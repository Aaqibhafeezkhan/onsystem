// Statistics and aggregation behind bench/v2/run.mjs: Wilson intervals for rates, a seeded
// cluster bootstrap for means and paired differences, the results table and the sample drawn
// for human labelling. Pure functions, so test/bench-v2.test.ts covers them.
//
// Runs of the same task are not independent (a hard task is hard in every arm), so every
// bootstrap here resamples tasks, not runs: a cluster is one repository task, and all the runs
// of that task (every repeat) move together.

/** One scored run, as run.mjs writes it to runs/<id>/result.json. Only what aggregation reads. */
export interface RunResult {
  id: string;
  provider: string;
  model: string;
  /** The model's tier (small, mid, frontier): rows pool the models of each tier. */
  tier?: string;
  arm: string;
  repo: string;
  task: string;
  repeat: number;
  status: 'done' | 'error' | 'aborted' | 'timeout' | 'refusal' | 'max-calls';
  created: boolean;
  tscPass: boolean | null;
  tscErrors: number | null;
  onsystemErrors: number;
  onsystemWarnings: number;
  outOfScope: number;
  cost: number;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  seconds: number;
  hookBlocks: number;
  mcpCalls: number;
  skillLoads: number;
}

export interface Interval {
  value: number;
  low: number;
  high: number;
}

export interface Rate extends Interval {
  successes: number;
  n: number;
}

/** Small, fast, seedable PRNG (mulberry32): the same seed gives the same intervals. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A stable 32-bit seed from a string, for per-run randomness that does not depend on order. */
export function seedOf(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Fisher-Yates with a seeded generator: the run order, the same on every machine. */
export function shuffle<T>(items: readonly T[], seed: number): T[] {
  const out = [...items];
  const next = rng(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/**
 * Wilson score interval for a binomial rate (95% by default). Unlike the normal approximation it
 * stays inside [0, 1] and behaves at 0/n and n/n, which small benchmark cells hit often.
 */
export function wilson(successes: number, n: number, z = 1.959964): Rate {
  if (n === 0) return { successes, n, value: Number.NaN, low: Number.NaN, high: Number.NaN };
  const p = successes / n;
  const z2 = z * z;
  const denominator = 1 + z2 / n;
  const centre = (p + z2 / (2 * n)) / denominator;
  const half = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / denominator;
  return {
    successes,
    n,
    value: p,
    // At 0/n and n/n the bound is exactly 0 or 1; floating point would give 0.9999999999999999.
    low: successes === 0 ? 0 : Math.max(0, centre - half),
    high: successes === n ? 1 : Math.min(1, centre + half),
  };
}

/** The q-th quantile (0..1) of sorted values, linear between closest ranks. */
export function quantile(sorted: readonly number[], q: number): number {
  if (!sorted.length) return Number.NaN;
  const position = (sorted.length - 1) * q;
  const below = Math.floor(position);
  const above = Math.ceil(position);
  const low = sorted[below] as number;
  const high = sorted[above] as number;
  return low + (high - low) * (position - below);
}

export interface BootstrapOptions {
  iterations?: number;
  seed?: number;
  /** Two-sided level; 0.95 gives the 2.5th and 97.5th percentiles. */
  level?: number;
}

/**
 * Percentile cluster bootstrap of a mean. `values` are grouped by `cluster`; each iteration
 * draws as many clusters as there are, with replacement, and takes the mean of every value in
 * the drawn clusters.
 */
export function bootstrapMean(
  values: readonly { cluster: string; value: number }[],
  options: BootstrapOptions = {},
): Interval {
  const { iterations = 10_000, seed = 1, level = 0.95 } = options;
  if (!values.length) return { value: Number.NaN, low: Number.NaN, high: Number.NaN };
  const clusters = groupSums(values);
  const value = values.reduce((a, v) => a + v.value, 0) / values.length;
  if (clusters.length === 1) return { value, low: value, high: value };
  const next = rng(seed);
  const means: number[] = [];
  for (let i = 0; i < iterations; i++) {
    let sum = 0;
    let count = 0;
    for (let k = 0; k < clusters.length; k++) {
      const drawn = clusters[Math.floor(next() * clusters.length)] as Cluster;
      sum += drawn.sum;
      count += drawn.count;
    }
    means.push(sum / count);
  }
  means.sort((a, b) => a - b);
  return {
    value,
    low: quantile(means, (1 - level) / 2),
    high: quantile(means, 1 - (1 - level) / 2),
  };
}

export interface Pair {
  cluster: string;
  /** The baseline arm's value for this unit (for a rate: 1 or 0). */
  base: number;
  /** The treated arm's value for the same unit. */
  treated: number;
}

/**
 * Mean paired difference (treated - base) with a cluster bootstrap interval. A unit is one
 * model, task and repeat, run once in each arm; units are clustered by task.
 */
export function pairedDifference(pairs: readonly Pair[], options: BootstrapOptions = {}): Interval {
  return bootstrapMean(
    pairs.map((p) => ({ cluster: p.cluster, value: p.treated - p.base })),
    options,
  );
}

interface Cluster {
  sum: number;
  count: number;
}

function groupSums(values: readonly { cluster: string; value: number }[]): Cluster[] {
  const map = new Map<string, Cluster>();
  for (const v of values) {
    const c = map.get(v.cluster) ?? { sum: 0, count: 0 };
    c.sum += v.value;
    c.count += 1;
    map.set(v.cluster, c);
  }
  return [...map.values()];
}

// ─── The results table ────────────────────────────────────────────────────────

export interface Row {
  model: string;
  provider: string;
  arm: string;
  runs: number;
  /** Runs that ended with a result to score (not stopped by an error or the spend cap). */
  scored: number;
  created: Rate;
  tscPass: Rate;
  onsystemClean: Rate;
  /** Created, type-checks and no onsystem error: what a reviewer could merge as is. */
  accepted: Rate;
  onsystemErrors: Interval;
  cost: Interval;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  hookBlocks: number;
  mcpCalls: number;
  skillLoads: number;
}

export interface Delta {
  model: string;
  arm: string;
  pairs: number;
  tscPass: Interval;
  onsystemClean: Interval;
  accepted: Interval;
  onsystemErrors: Interval;
}

const scoredStatuses = new Set(['done', 'max-calls', 'timeout', 'refusal']);

/** Whether a run counts in the tables: it reached the end, or a limit that is part of the result. */
export function isScored(r: RunResult): boolean {
  return scoredStatuses.has(r.status);
}

export function isAccepted(r: RunResult): boolean {
  return r.created && r.tscPass === true && r.onsystemErrors === 0;
}

const cluster = (r: RunResult) => `${r.repo}/${r.task}`;

/**
 * The groups each run counts in: its model, its tier's pooled row, and all models. A pool that
 * holds a single model would repeat that model's row, so it is left out.
 */
function poolKeys(results: readonly RunResult[]): (r: RunResult) => string[] {
  const models = new Map<string, Set<string>>();
  for (const r of results) {
    for (const pool of [...(r.tier ? [`${r.tier} models`] : []), 'all models']) {
      models.set(pool, (models.get(pool) ?? new Set()).add(r.model));
    }
  }
  const pooled = new Set([...models].filter(([, set]) => set.size > 1).map(([pool]) => pool));
  return (r) => [
    r.model,
    ...[...(r.tier ? [`${r.tier} models`] : []), 'all models'].filter((p) => pooled.has(p)),
  ];
}

/** One row per model and arm, plus pooled rows per tier and for all models, in a stable order. */
export function aggregate(results: readonly RunResult[], options: BootstrapOptions = {}): Row[] {
  const rows: Row[] = [];
  const groups = new Map<string, RunResult[]>();
  const pools = poolKeys(results);
  for (const r of results) {
    for (const model of pools(r)) {
      const key = `${model}\0${model === r.model ? r.provider : 'all'}\0${r.arm}`;
      groups.set(key, [...(groups.get(key) ?? []), r]);
    }
  }
  for (const [key, all] of groups) {
    const [model = '', provider = '', arm = ''] = key.split('\0');
    const runs = all.filter(isScored);
    const rate = (pass: (r: RunResult) => boolean) => wilson(runs.filter(pass).length, runs.length);
    const mean = (pick: (r: RunResult) => number) =>
      runs.length ? runs.reduce((a, r) => a + pick(r), 0) / runs.length : Number.NaN;
    rows.push({
      model,
      provider,
      arm,
      runs: all.length,
      scored: runs.length,
      created: rate((r) => r.created),
      tscPass: rate((r) => r.tscPass === true),
      onsystemClean: rate((r) => r.created && r.onsystemErrors === 0),
      accepted: rate(isAccepted),
      onsystemErrors: bootstrapMean(
        runs.map((r) => ({ cluster: cluster(r), value: r.onsystemErrors })),
        options,
      ),
      cost: bootstrapMean(
        all.map((r) => ({ cluster: cluster(r), value: r.cost })),
        options,
      ),
      calls: mean((r) => r.calls),
      inputTokens: mean((r) => r.inputTokens),
      outputTokens: mean((r) => r.outputTokens),
      hookBlocks: mean((r) => r.hookBlocks),
      mcpCalls: mean((r) => r.mcpCalls),
      skillLoads: mean((r) => r.skillLoads),
    });
  }
  return rows.sort(compareRows);
}

/**
 * Each arm against the baseline arm, paired on model, task and repeat, for every model, each
 * tier's models together, and all models together. Units where either run was not scored are left out of that pair.
 */
export function deltas(
  results: readonly RunResult[],
  baseline = 'none',
  options: BootstrapOptions = {},
): Delta[] {
  const unit = (r: RunResult) => `${r.model}\0${r.repo}\0${r.task}\0${r.repeat}`;
  const base = new Map(
    results.filter((r) => r.arm === baseline && isScored(r)).map((r) => [unit(r), r]),
  );
  const groups = new Map<string, [RunResult, RunResult][]>();
  const pools = poolKeys(results);
  for (const r of results) {
    if (r.arm === baseline || !isScored(r)) continue;
    const b = base.get(unit(r));
    if (!b) continue;
    for (const model of pools(r)) {
      const key = `${model}\0${r.arm}`;
      groups.set(key, [...(groups.get(key) ?? []), [b, r]]);
    }
  }
  const out: Delta[] = [];
  for (const [key, pairs] of groups) {
    const [model = '', arm = ''] = key.split('\0');
    const diff = (pick: (r: RunResult) => number) =>
      pairedDifference(
        pairs.map(([b, t]) => ({ cluster: cluster(t), base: pick(b), treated: pick(t) })),
        options,
      );
    out.push({
      model,
      arm,
      pairs: pairs.length,
      tscPass: diff((r) => (r.tscPass === true ? 1 : 0)),
      onsystemClean: diff((r) => (r.created && r.onsystemErrors === 0 ? 1 : 0)),
      accepted: diff((r) => (isAccepted(r) ? 1 : 0)),
      onsystemErrors: diff((r) => r.onsystemErrors),
    });
  }
  return out.sort(compareRows);
}

export const ARM_ORDER = ['none', 'skill', 'mcp', 'hook', 'all'];

function compareRows(a: { model: string; arm: string }, b: { model: string; arm: string }) {
  const rank = (m: string) => (m === 'all models' ? 2 : m.endsWith(' models') ? 1 : 0);
  return (
    rank(a.model) - rank(b.model) ||
    a.model.localeCompare(b.model) ||
    armIndex(a.arm) - armIndex(b.arm)
  );
}

function armIndex(arm: string): number {
  const i = ARM_ORDER.indexOf(arm);
  return i === -1 ? ARM_ORDER.length : i;
}

// ─── Rendering ────────────────────────────────────────────────────────────────

const pct = (x: number) => (Number.isNaN(x) ? 'n/a' : `${Math.round(x * 100)}%`);
const signedPct = (x: number) => {
  if (Number.isNaN(x)) return 'n/a';
  const points = Math.round(x * 100);
  return points > 0 ? `+${points}` : String(points === 0 ? 0 : points);
};
const num = (x: number, digits = 1) => (Number.isNaN(x) ? 'n/a' : x.toFixed(digits));
const signedNum = (x: number, digits: number) =>
  Number.isNaN(x) ? 'n/a' : `${x > 0 ? '+' : ''}${x.toFixed(digits)}`;

export function formatRate(r: Rate): string {
  if (!r.n) return 'n/a';
  return `${r.successes}/${r.n} ${pct(r.value)} [${pct(r.low)}, ${pct(r.high)}]`;
}

function formatInterval(i: Interval, digits = 1): string {
  return `${num(i.value, digits)} [${num(i.low, digits)}, ${num(i.high, digits)}]`;
}

function formatDelta(i: Interval): string {
  return `${signedPct(i.value)} [${signedPct(i.low)}, ${signedPct(i.high)}]`;
}

function formatSignedInterval(i: Interval, digits: number): string {
  return `${signedNum(i.value, digits)} [${signedNum(i.low, digits)}, ${signedNum(i.high, digits)}]`;
}

/** The results tables in Markdown: rates per model and arm, then each arm against "none". */
export function renderMarkdown(rows: readonly Row[], diffs: readonly Delta[]): string {
  const lines = [
    '| Model | Arm | Runs | Created | `tsc` passes | onsystem clean | Accepted | onsystem errors / run | Cost / run | Calls | Hook blocks | MCP calls |',
    '| --- | --- | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: |',
  ];
  for (const r of rows) {
    lines.push(
      `| ${r.model} | ${r.arm} | ${r.scored}${r.scored === r.runs ? '' : ` of ${r.runs}`} | ${pct(r.created.value)} | ${formatRate(r.tscPass)} | ${formatRate(r.onsystemClean)} | ${formatRate(r.accepted)} | ${formatInterval(r.onsystemErrors, 2)} | $${num(r.cost.value, 4)} | ${num(r.calls)} | ${num(r.hookBlocks, 2)} | ${num(r.mcpCalls)} |`,
    );
  }
  lines.push(
    '',
    'Each arm against `none`, paired on model, task and repeat (percentage points; errors per run):',
    '',
    '| Model | Arm | Pairs | Δ `tsc` passes | Δ onsystem clean | Δ accepted | Δ onsystem errors / run |',
    '| --- | --- | --: | --: | --: | --: | --: |',
  );
  for (const d of diffs) {
    lines.push(
      `| ${d.model} | ${d.arm} | ${d.pairs} | ${formatDelta(d.tscPass)} | ${formatDelta(d.onsystemClean)} | ${formatDelta(d.accepted)} | ${formatSignedInterval(d.onsystemErrors, 2)} |`,
    );
  }
  return `${lines.join('\n')}\n`;
}

// ─── Human labels ─────────────────────────────────────────────────────────────

/**
 * A stratified random sample for human labelling: up to `perCell` scored runs that created
 * their file, per model and arm, drawn with a seeded shuffle. Each gets a blind id that does not
 * reveal the model or the arm; the key that maps it back is written separately.
 */
export function labelSample(
  results: readonly RunResult[],
  perCell: number,
  seed = 1,
): { sampleId: string; run: RunResult }[] {
  const cells = new Map<string, RunResult[]>();
  for (const r of results) {
    if (!isScored(r) || !r.created) continue;
    const key = `${r.model}\0${r.arm}`;
    cells.set(key, [...(cells.get(key) ?? []), r]);
  }
  const picked: RunResult[] = [];
  for (const key of [...cells.keys()].sort()) {
    const runs = [...(cells.get(key) ?? [])].sort((a, b) => a.id.localeCompare(b.id));
    picked.push(...shuffle(runs, seed ^ seedOf(key)).slice(0, perCell));
  }
  // The order of the sample is shuffled too, so neighbouring files do not share an arm.
  return shuffle(picked, seed).map((run, i) => ({
    sampleId: `S${String(i + 1).padStart(3, '0')}`,
    run,
  }));
}

/** RFC 4180 CSV: quotes fields with commas, quotes or line breaks. */
export function toCsv(rows: readonly Record<string, string | number | boolean | null>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0] as object);
  const cell = (v: string | number | boolean | null | undefined) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return `${[headers.join(','), ...rows.map((r) => headers.map((h) => cell(r[h])).join(','))].join('\n')}\n`;
}

/** Parses the CSV toCsv writes (and what a spreadsheet saves back), quoted fields included. */
export function parseCsv(text: string): Record<string, string>[] {
  const records: string[][] = [];
  let field = '';
  let record: string[] = [];
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text.charAt(i);
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      record.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      record.push(field);
      records.push(record);
      record = [];
      field = '';
    } else field += c;
  }
  if (field || record.length) {
    record.push(field);
    records.push(record);
  }
  const [headers = [], ...body] = records.filter((r) => r.some((f) => f !== ''));
  return body.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])));
}

export interface LabelArm {
  arm: string;
  labelled: number;
  wouldMerge: Rate;
  humanClean: Rate;
  humanViolations: Interval;
}

export interface LabelSummary {
  arms: LabelArm[];
  /** Files by (onsystem reported an error, the labeller counted a violation). */
  agreement: { both: number; onsystemOnly: number; humanOnly: number; neither: number };
  /** onsystem's findings on the sampled files judged TP out of TP + FP; `unsure` counts D and anything else. */
  precision: Rate & { unsure: number };
}

const VIOLATION_COLUMNS = [
  'invented_api',
  'hardcoded_values',
  'native_elements',
  'unnamed_controls',
];

/**
 * Joins the filled labelling sheets with the blinding key and the run results. A file counts
 * once `would_merge` is filled; empty counts read as 0.
 */
export function labelSummary(
  labels: readonly Record<string, string>[],
  key: Record<string, { run: string; model: string; arm: string }>,
  findings: readonly Record<string, string>[],
  results: readonly RunResult[],
  options: BootstrapOptions = {},
): LabelSummary {
  const byId = new Map(results.map((r) => [r.id, r]));
  const filled = labels
    .filter((l) => /^(yes|no)$/i.test((l.would_merge ?? '').trim()))
    .flatMap((l) => {
      const k = key[l.sample_id ?? ''];
      const run = k ? byId.get(k.run) : undefined;
      if (!k || !run) return [];
      const violations = VIOLATION_COLUMNS.reduce(
        (a, c) => a + (Number.parseInt(l[c] ?? '', 10) || 0),
        0,
      );
      return [{ arm: k.arm, run, violations, merge: /^yes$/i.test((l.would_merge ?? '').trim()) }];
    });
  const arms = [...new Set(filled.map((f) => f.arm))].sort((a, b) => armIndex(a) - armIndex(b));
  const agreement = { both: 0, onsystemOnly: 0, humanOnly: 0, neither: 0 };
  for (const f of filled) {
    const tool = f.run.onsystemErrors > 0;
    const human = f.violations > 0;
    if (tool && human) agreement.both++;
    else if (tool) agreement.onsystemOnly++;
    else if (human) agreement.humanOnly++;
    else agreement.neither++;
  }
  const verdicts = findings.map((f) => (f.verdict ?? '').trim().toUpperCase()).filter(Boolean);
  const tp = verdicts.filter((v) => v === 'TP').length;
  const fp = verdicts.filter((v) => v === 'FP').length;
  return {
    arms: arms.map((arm) => {
      const rows = filled.filter((f) => f.arm === arm);
      return {
        arm,
        labelled: rows.length,
        wouldMerge: wilson(rows.filter((r) => r.merge).length, rows.length),
        humanClean: wilson(rows.filter((r) => r.violations === 0).length, rows.length),
        humanViolations: bootstrapMean(
          rows.map((r) => ({ cluster: cluster(r.run), value: r.violations })),
          options,
        ),
      };
    }),
    agreement,
    precision: { ...wilson(tp, tp + fp), unsure: verdicts.length - tp - fp },
  };
}

export function renderLabelSummary(s: LabelSummary): string {
  const lines = [
    '| Arm | Files labelled | Would merge | No violations (human) | Violations / file (human) |',
    '| --- | --: | --: | --: | --: |',
    ...s.arms.map(
      (a) =>
        `| ${a.arm} | ${a.labelled} | ${formatRate(a.wouldMerge)} | ${formatRate(a.humanClean)} | ${formatInterval(a.humanViolations, 2)} |`,
    ),
    '',
    `onsystem against the labeller, per file: both found a problem in ${s.agreement.both}, only onsystem in ${s.agreement.onsystemOnly}, only the labeller in ${s.agreement.humanOnly}, neither in ${s.agreement.neither}.`,
    `onsystem's findings judged correct: ${formatRate(s.precision)}${s.precision.unsure ? ` (${s.precision.unsure} debatable, left out)` : ''}.`,
  ];
  return `${lines.join('\n')}\n`;
}
