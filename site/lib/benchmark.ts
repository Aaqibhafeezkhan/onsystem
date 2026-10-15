import type {
  Benchmark,
  BenchDelta,
  BenchInterval,
  BenchRate,
  BenchRow,
  ShadcnLintDelta,
  ShadcnLintRow,
} from '@/lib/data';

/**
 * How /benchmark and the home page print bench/v2's numbers. Every value comes from
 * generated/benchmark.json, which scripts/generate.mjs reads from bench/v2/results/standard;
 * test/benchmark.test.ts checks the rendered page against results.json itself.
 */

const MINUS = '−';

/** Errors per run, as results.md prints them: two decimals. */
export function perRun(value: number): string {
  return value < 0 ? `${MINUS}${Math.abs(value).toFixed(2)}` : value.toFixed(2);
}

export function signedPerRun(value: number): string {
  return value > 0 ? `+${value.toFixed(2)}` : perRun(value);
}

export function percent(value: number): string {
  return `${String(Math.round(value * 100))}%`;
}

/** A difference in percentage points, rounded as results.md rounds it. */
export function points(value: number): string {
  const n = Math.round(value * 100);
  return n > 0 ? `+${String(n)}` : n < 0 ? `${MINUS}${String(-n)}` : '0';
}

export function usd(value: number, digits = 4): string {
  return `$${value.toFixed(digits)}`;
}

export function count(value: number): string {
  return value.toLocaleString('en-US');
}

const WORDS = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
];

/** Small counts in prose: "two of the six models". */
export function words(value: number): string {
  return WORDS[value] ?? count(value);
}

export function rateInterval(rate: BenchRate): string {
  return `[${percent(rate.low)}, ${percent(rate.high)}]`;
}

export function perRunInterval(interval: BenchInterval): string {
  return `[${perRun(interval.low)}, ${perRun(interval.high)}]`;
}

export function signedPerRunInterval(interval: BenchInterval): string {
  return `[${signedPerRun(interval.low)}, ${signedPerRun(interval.high)}]`;
}

export function pointsInterval(interval: BenchInterval): string {
  return `[${points(interval.low)}, ${points(interval.high)}]`;
}

export function row(benchmark: Benchmark, model: string, arm: string): BenchRow {
  const found = benchmark.rows.find((r) => r.model === model && r.arm === arm);
  if (!found) throw new Error(`No benchmark row for ${model}, ${arm}`);
  return found;
}

export function delta(benchmark: Benchmark, model: string, arm: string): BenchDelta {
  const found = benchmark.deltas.find((d) => d.model === model && d.arm === arm);
  if (!found) throw new Error(`No paired difference for ${model}, ${arm}`);
  return found;
}

/** @shadcn/lint's count of one arm, pooled over all models. */
export function shadcnLintRow(benchmark: Benchmark, arm: string): ShadcnLintRow {
  const found = benchmark.shadcnLint.rows.find((r) => r.model === 'all models' && r.arm === arm);
  if (!found) throw new Error(`No @shadcn/lint row for ${arm}`);
  return found;
}

/** @shadcn/lint's paired difference of one arm against `none`, or null for `none` itself. */
export function shadcnLintDelta(benchmark: Benchmark, arm: string): ShadcnLintDelta | null {
  if (arm === 'none') return null;
  const found = benchmark.shadcnLint.deltas.find((d) => d.model === 'all models' && d.arm === arm);
  if (!found) throw new Error(`No @shadcn/lint paired difference for ${arm}`);
  return found;
}

/** The independent scorer's repository, as bench/v2/README.md links it. */
export const SHADCN_LINT = 'https://github.com/shadcn-ui/lint';

/** The section of bench/v2/README.md and of results.md on @shadcn/lint, as GitHub anchors it. */
export const SHADCN_LINT_ANCHOR = 'independent-scorer-shadcnlint';

/** What the arms add on top of the file tools, in a few words. */
export const ARM_LABELS: Record<string, string> = {
  none: 'No onsystem',
  skill: 'Skill',
  mcp: 'MCP server',
  hook: 'Hook',
  all: 'Skill, MCP server and hook',
};

/** The model's name from config/models.json, or the pool as results.json names it. */
export function modelName(benchmark: Benchmark, id: string): string {
  return benchmark.models.find((m) => m.id === id)?.name ?? id;
}

/**
 * The result in one sentence, pooled over every model: onsystem's errors per run without it
 * and with all three parts. The tool under test counts them, in the release the benchmark ran,
 * so wherever the result is quoted it names that release. scripts/generate.mjs fails the build
 * if the results stop supporting "no measurable change in tsc pass rate or cost per run", or
 * if the arms differ in size.
 */
export function headline(benchmark: Benchmark) {
  const none = row(benchmark, 'all models', 'none');
  return {
    from: perRun(none.onsystemErrors.value),
    to: perRun(row(benchmark, 'all models', 'all').onsystemErrors.value),
    /** The onsystem release that ran the benchmark and counted the errors. */
    version: benchmark.onsystem,
    /** Runs in each arm: the headline compares two of them. */
    perArm: count(none.runs),
    models: String(benchmark.models.length),
    providers: String(benchmark.providers.length),
    repos: String(benchmark.repos.length),
  };
}

/** The headline in a few words, saying whose count it is: "onsystem 0.5.0 errors per run: …". */
export function headlineShort(benchmark: Benchmark): string {
  const h = headline(benchmark);
  return `onsystem ${h.version} errors per run: ${h.from} → ${h.to}`;
}

/** The headline as plain text, starting lower case: "design-system rule violations per run…". */
export function headlineText(benchmark: Benchmark): string {
  const h = headline(benchmark);
  return `design-system rule violations per run, as onsystem ${h.version}'s own check counts them, went from ${h.from} to ${h.to} with onsystem's skill, MCP server and hook, with no measurable change in tsc pass rate or cost per run (${h.perArm} runs per arm, ${h.models} models, ${h.providers} providers, ${h.repos} repositories)`;
}

/** The models from the labeller's family, by name. */
export function labellerFamily(benchmark: Benchmark): string[] {
  return benchmark.labels.labeller.sameFamily.map((id) => modelName(benchmark, id));
}
