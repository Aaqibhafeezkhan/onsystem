// The run matrix, token and cost estimates, the spend cap and the API key check behind
// bench/v2/run.mjs. Pure functions over the JSON in bench/v2/config, so
// test/bench-v2.test.ts covers them.

export interface Rates {
  /** USD per million uncached input tokens. */
  input: number;
  /** USD per million tokens read from the prompt cache. */
  cacheRead: number;
  /** USD per million tokens written to the prompt cache; null when writes cost the input price. */
  cacheWrite: number | null;
  /** USD per million output tokens, thinking and reasoning tokens included. */
  output: number;
}

export interface Price extends Rates {
  /** Higher rates for a request whose prompt (input + cache reads + cache writes) is longer. */
  above?: Rates & { promptTokens: number };
}

export interface ModelSpec {
  id: string;
  provider: string;
  name: string;
  tier: 'small' | 'mid' | 'frontier' | 'test';
  /** The reasoning setting sent with every request (Anthropic effort, OpenAI reasoning effort, Gemini thinking level). */
  effort: string | null;
  /** Which v1 usage profile its token estimate starts from. */
  profile: 'small' | 'large';
  price: Price;
  sources: string[];
  notes?: string;
}

export interface ProviderSpec {
  /** The environment variable that holds the API key; null for the offline mock. */
  keyEnv: string | null;
  endpoint: string | null;
}

export interface Task {
  id: string;
  repo: string;
  /** Path of the file to create, relative to the repository root. */
  file: string;
  prompt: string;
}

export interface MatrixGroup {
  models: string[];
  arms: string[];
  tasksPerRepo: number;
  repeats: number;
}

export interface MatrixSpec {
  description: string;
  groups: MatrixGroup[];
  /** Limit to these repositories (all by default). */
  repos?: string[];
}

export interface PlannedRun {
  id: string;
  provider: string;
  model: string;
  arm: string;
  repo: string;
  task: string;
  repeat: number;
}

export interface Usage {
  /** Uncached input tokens. */
  input: number;
  cacheRead: number;
  cacheWrite: number;
  output: number;
}

export const ARMS = ['none', 'skill', 'mcp', 'hook', 'all'] as const;
export type Arm = (typeof ARMS)[number];

/** What each arm turns on. */
export function armParts(arm: string): { skill: boolean; mcp: boolean; hook: boolean } {
  switch (arm) {
    case 'none':
      return { skill: false, mcp: false, hook: false };
    case 'skill':
      return { skill: true, mcp: false, hook: false };
    case 'mcp':
      return { skill: false, mcp: true, hook: false };
    case 'hook':
      return { skill: false, mcp: false, hook: true };
    case 'all':
      return { skill: true, mcp: true, hook: true };
    default:
      throw new Error(`Unknown arm "${arm}": use one of ${ARMS.join(', ')}.`);
  }
}

/** Every run of a matrix, in task order; run.mjs shuffles them with a seed before running. */
export function expandMatrix(
  matrix: MatrixSpec,
  tasks: readonly Task[],
  models: readonly ModelSpec[],
): PlannedRun[] {
  const byRepo = new Map<string, Task[]>();
  for (const t of tasks) byRepo.set(t.repo, [...(byRepo.get(t.repo) ?? []), t]);
  const repos = matrix.repos ?? [...byRepo.keys()];
  for (const repo of repos) {
    if (!byRepo.has(repo))
      throw new Error(`The matrix names repository "${repo}", which has no tasks.`);
  }
  const runs = new Map<string, PlannedRun>();
  for (const group of matrix.groups) {
    for (const modelId of group.models) {
      const model = models.find((m) => m.id === modelId);
      if (!model)
        throw new Error(`The matrix names model "${modelId}", which models.json does not list.`);
      for (const arm of group.arms) {
        armParts(arm);
        for (const repo of repos) {
          const repoTasks = byRepo.get(repo) ?? [];
          if (group.tasksPerRepo > repoTasks.length) {
            throw new Error(
              `${repo} has ${repoTasks.length} tasks; the matrix asks for ${group.tasksPerRepo}.`,
            );
          }
          for (const task of repoTasks.slice(0, group.tasksPerRepo)) {
            for (let repeat = 1; repeat <= group.repeats; repeat++) {
              const id = runId(model.id, arm, repo, task.id, repeat);
              runs.set(id, {
                id,
                provider: model.provider,
                model: model.id,
                arm,
                repo,
                task: task.id,
                repeat,
              });
            }
          }
        }
      }
    }
  }
  return [...runs.values()];
}

export function runId(
  model: string,
  arm: string,
  repo: string,
  task: string,
  repeat: number,
): string {
  return `${model}--${arm}--${repo}--${task}--r${repeat}`;
}

/** The rates that apply to one request, by the length of its prompt. */
export function ratesFor(price: Price, promptTokens: number): Rates {
  return price.above && promptTokens > price.above.promptTokens ? price.above : price;
}

/** USD for one request's usage. Cache writes cost the input price where a provider has no premium. */
export function costOf(usage: Usage, price: Price): number {
  return costAtRates(usage, ratesFor(price, usage.input + usage.cacheRead + usage.cacheWrite));
}

/** USD for usage at fixed rates (an estimate summed over many requests picks the rates itself). */
export function costAtRates(usage: Usage, r: Rates): number {
  return (
    (usage.input * r.input +
      usage.cacheRead * r.cacheRead +
      usage.cacheWrite * (r.cacheWrite ?? r.input) +
      usage.output * r.output) /
    1_000_000
  );
}

// ─── Estimates ────────────────────────────────────────────────────────────────

/** Per-run token use measured in the v1 benchmark (bench/agents), the basis of every estimate. */
export interface UsageProfile {
  /** API requests per run. */
  calls: number;
  /**
   * Sum over a run's requests of (that request's context - the first request's context): the
   * tokens a run adds by reading files, writing them and talking, re-sent on every later request.
   */
  work: number;
  /** Last request's context - first request's context. */
  growth: number;
  /** Output tokens per run, thinking included. */
  output: number;
}

export interface UsageModel {
  profiles: Record<'small' | 'large', { none: UsageProfile; treated: UsageProfile }>;
  /** Tokens of fixed prompt per request in this harness: system prompt, tools and task. */
  overhead: { base: number; skillListing: number; skillBody: number; mcp: number };
  /** Multipliers for the pessimistic estimate (no cache hits at all). */
  pessimistic: { prompt: number; output: number };
}

export interface Estimate {
  usage: Usage;
  calls: number;
  cost: number;
}

/**
 * Tokens and cost of one run of `model` in `arm`. Expected: every request reads the previous
 * context from the prompt cache and writes only what is new. Pessimistic: no cache hits, and
 * the prompt and output multiplied by the model's pessimistic factors. Arms other than "none"
 * take, field by field, the larger of v1's two conditions, and the skill's body counts as read
 * on the first request.
 */
export function estimateRun(
  model: ModelSpec,
  arm: string,
  usage: UsageModel,
): { expected: Estimate; pessimistic: Estimate } {
  const profiles = usage.profiles[model.profile];
  const parts = armParts(arm);
  const p: UsageProfile =
    arm === 'none'
      ? profiles.none
      : {
          calls: Math.max(profiles.none.calls, profiles.treated.calls),
          work: Math.max(profiles.none.work, profiles.treated.work),
          growth: Math.max(profiles.none.growth, profiles.treated.growth),
          output: Math.max(profiles.none.output, profiles.treated.output),
        };
  const overhead =
    usage.overhead.base +
    (parts.skill ? usage.overhead.skillListing : 0) +
    (parts.mcp ? usage.overhead.mcp : 0);
  const skillBody = parts.skill ? usage.overhead.skillBody : 0;
  const work = p.work + skillBody * Math.max(0, p.calls - 1);
  const growth = p.growth + skillBody;
  const prompt = p.calls * overhead + work;
  const written = Math.min(prompt, overhead + growth);
  const expectedUsage: Usage = {
    input: 0,
    cacheRead: prompt - written,
    cacheWrite: written,
    output: p.output,
  };
  // A run's requests are priced at the rates of its longest request (the last one): a tiered
  // price never applies to the sum of a run's requests.
  const longest = overhead + growth;
  const pricedAt = (u: Usage, tokens: number) => costAtRates(u, ratesFor(model.price, tokens));
  const pessimisticUsage: Usage = {
    input: Math.round(prompt * usage.pessimistic.prompt),
    cacheRead: 0,
    cacheWrite: 0,
    output: Math.round(p.output * usage.pessimistic.output),
  };
  return {
    expected: { usage: expectedUsage, calls: p.calls, cost: pricedAt(expectedUsage, longest) },
    pessimistic: {
      usage: pessimisticUsage,
      calls: Math.ceil(p.calls * usage.pessimistic.prompt),
      cost: pricedAt(pessimisticUsage, longest * usage.pessimistic.prompt),
    },
  };
}

/** Measured mean cost per run, by model and arm, from finished runs: replaces the estimate. */
export function calibration(
  results: readonly { model: string; arm: string; cost: number; status: string }[],
): Map<string, { runs: number; cost: number }> {
  const sums = new Map<string, { runs: number; total: number }>();
  for (const r of results) {
    if (r.status === 'aborted' || r.status === 'error') continue;
    const key = `${r.model}\0${r.arm}`;
    const s = sums.get(key) ?? { runs: 0, total: 0 };
    s.runs += 1;
    s.total += r.cost;
    sums.set(key, s);
  }
  return new Map([...sums].map(([k, s]) => [k, { runs: s.runs, cost: s.total / s.runs }]));
}

export interface PlanLine {
  provider: string;
  model: string;
  runs: number;
  arms: string[];
  expectedTokens: number;
  expectedCost: number;
  pessimisticCost: number;
  /** Runs whose cost comes from finished runs (--usage-from) rather than the v1-based model. */
  measuredRuns: number;
}

export function estimatePlan(
  runs: readonly PlannedRun[],
  models: readonly ModelSpec[],
  usage: UsageModel,
  measured: Map<string, { runs: number; cost: number }> = new Map(),
): { lines: PlanLine[]; expectedCost: number; pessimisticCost: number } {
  const lines = new Map<string, PlanLine>();
  for (const run of runs) {
    const model = models.find((m) => m.id === run.model);
    if (!model) throw new Error(`Unknown model ${run.model}.`);
    const line =
      lines.get(model.id) ??
      ({
        provider: model.provider,
        model: model.id,
        runs: 0,
        arms: [],
        expectedTokens: 0,
        expectedCost: 0,
        pessimisticCost: 0,
        measuredRuns: 0,
      } satisfies PlanLine);
    const e = estimateRun(model, run.arm, usage);
    const m = measured.get(`${run.model}\0${run.arm}`);
    line.runs += 1;
    if (!line.arms.includes(run.arm)) line.arms.push(run.arm);
    line.expectedTokens +=
      e.expected.usage.input +
      e.expected.usage.cacheRead +
      e.expected.usage.cacheWrite +
      e.expected.usage.output;
    if (m) {
      line.measuredRuns += 1;
      line.expectedCost += m.cost;
      line.pessimisticCost += Math.max(m.cost * 2, e.pessimistic.cost);
    } else {
      line.expectedCost += e.expected.cost;
      line.pessimisticCost += e.pessimistic.cost;
    }
    lines.set(model.id, line);
  }
  const all = [...lines.values()].sort(
    (a, b) => a.provider.localeCompare(b.provider) || a.model.localeCompare(b.model),
  );
  return {
    lines: all,
    expectedCost: all.reduce((a, l) => a + l.expectedCost, 0),
    pessimisticCost: all.reduce((a, l) => a + l.pessimisticCost, 0),
  };
}

// ─── Spend cap and keys ───────────────────────────────────────────────────────

export interface Budget {
  readonly cap: number;
  spent(): number;
  /** Adds a request's cost; true once the total has passed the cap. */
  add(cost: number): boolean;
  exceeded(): boolean;
}

/**
 * The spend cap: a running total of what requests cost, by the providers' published prices
 * and the usage each response reports. Once it passes the cap no request starts; requests
 * already in flight finish, so a run can end above the cap by at most one request per worker.
 */
export function createBudget(cap: number, alreadySpent = 0): Budget {
  if (!(cap >= 0)) throw new Error('The spend cap must be a number of US dollars, 0 or more.');
  let total = alreadySpent;
  return {
    cap,
    spent: () => total,
    add(cost: number) {
      total += cost;
      return total > cap;
    },
    exceeded: () => total > cap,
  };
}

/** Names of the API key variables the matrix needs and the environment lacks. Never values. */
export function missingKeys(
  runs: readonly PlannedRun[],
  providers: Record<string, ProviderSpec>,
  env: Record<string, string | undefined>,
): string[] {
  const needed = new Set<string>();
  for (const run of runs) {
    const spec = providers[run.provider];
    if (!spec) throw new Error(`Unknown provider "${run.provider}".`);
    if (spec.keyEnv) needed.add(spec.keyEnv);
  }
  return [...needed].filter((name) => !env[name]?.trim()).sort();
}

const usd = (x: number) => `$${x < 10 ? x.toFixed(2) : x.toFixed(0)}`;

/** The plan as a plain-text table. */
export function renderPlan(
  name: string,
  matrix: MatrixSpec,
  plan: ReturnType<typeof estimatePlan>,
  runs: number,
): string {
  const out = [`Matrix "${name}": ${matrix.description}`, ''];
  for (const g of matrix.groups) {
    out.push(
      `  ${g.models.join(', ')} × arms ${g.arms.join('/')} × ${g.tasksPerRepo} task(s) per repository × ${g.repeats} repeat(s)`,
    );
  }
  out.push('', `Runs: ${runs}`, '');
  const header = [
    'provider',
    'model',
    'runs',
    'tokens (expected)',
    'cost (expected)',
    'cost (pessimistic)',
  ];
  const rows = plan.lines.map((l) => [
    l.provider,
    l.model + (l.measuredRuns ? ` (${l.measuredRuns} measured)` : ''),
    String(l.runs),
    `${(l.expectedTokens / 1e6).toFixed(1)}M`,
    usd(l.expectedCost),
    usd(l.pessimisticCost),
  ]);
  const byProvider = new Map<string, { runs: number; e: number; p: number; t: number }>();
  for (const l of plan.lines) {
    const s = byProvider.get(l.provider) ?? { runs: 0, e: 0, p: 0, t: 0 };
    s.runs += l.runs;
    s.e += l.expectedCost;
    s.p += l.pessimisticCost;
    s.t += l.expectedTokens;
    byProvider.set(l.provider, s);
  }
  for (const [provider, s] of byProvider) {
    rows.push([
      provider,
      '(all)',
      String(s.runs),
      `${(s.t / 1e6).toFixed(1)}M`,
      usd(s.e),
      usd(s.p),
    ]);
  }
  rows.push([
    'total',
    '',
    String(runs),
    `${(plan.lines.reduce((a, l) => a + l.expectedTokens, 0) / 1e6).toFixed(1)}M`,
    usd(plan.expectedCost),
    usd(plan.pessimisticCost),
  ]);
  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => (r[i] ?? '').length)));
  const line = (r: string[]) =>
    r.map((c, i) => (i < 2 ? c.padEnd(widths[i] ?? 0) : c.padStart(widths[i] ?? 0))).join('  ');
  out.push(line(header), widths.map((w) => '-'.repeat(w)).join('  '), ...rows.map(line));
  return `${out.join('\n')}\n`;
}
