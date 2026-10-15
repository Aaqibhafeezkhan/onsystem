// Draws the seeded, rule-stratified false-positive sample from population.json.
//
//   node draw.mjs <population.json> <corpus dir> <out dir> [--n 80] [--seed 20261016]
//
// Writes to <out dir>:
//   sample-unlabelled.json  what the labeller sees: location, rule, the finding's message exactly,
//                           and ~15 lines of code from the pinned checkout. No suggestion, no fix,
//                           no severity, no opinion.
//   sample-key.json         per sampled id: severity, whether onsystem offers a fix, its stratum
//                           and weight. For the statistics step, not for labelling.
//   allocation.json         the allocation table.
//
// Allocation: proportional to each rule's share of the population, with a floor of 1. A rule
// whose proportional quota n*N_r/N is below 1 gets 1; the slots left are split proportionally
// among the other rules, repeating until no further rule falls below the floor. The integer
// split uses largest remainders (Hamilton), ties broken by the larger population, then rule id.
//
// Draw: one mulberry32 generator (the one scripts/corpus-lib.ts `random()` uses) seeded with
// --seed. Rules in id order; within a rule, findings sorted by id (code-unit order), then the
// corpus `sample` command's step, k times: take index floor(next() * remaining) out of the list.
// Then the 80 picks are put in a seeded shuffled order (same generator, Fisher-Yates) and numbered
// S01..S80, so the labeller does not see them grouped by rule.
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { n: { type: 'string', default: '80' }, seed: { type: 'string', default: '20261016' } },
});
const [populationFile, corpusDir, outDir] = positionals;
if (!outDir) {
  console.error(
    'usage: node draw.mjs <population.json> <corpus dir> <out dir> [--n 80] [--seed 20261016]',
  );
  process.exit(2);
}
const N_SAMPLE = Number(values.n);
const SEED = Number(values.seed);

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const byCodeUnits = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

const population = JSON.parse(fs.readFileSync(populationFile, 'utf8'));
const total = population.length;
const strata = new Map();
for (const f of population) strata.set(f.rule, [...(strata.get(f.rule) ?? []), f]);
const rules = [...strata.keys()].sort(byCodeUnits);

// ─── Allocation ───────────────────────────────────────────────────────────────
const size = (rule) => strata.get(rule).length;
const floored = new Set();
for (;;) {
  const open = rules.filter((r) => !floored.has(r));
  const slots = N_SAMPLE - floored.size;
  const openTotal = open.reduce((n, r) => n + size(r), 0);
  const below = open.filter((r) => (slots * size(r)) / openTotal < 1);
  if (!below.length) break;
  for (const r of below) floored.add(r);
}
const open = rules.filter((r) => !floored.has(r));
const slots = N_SAMPLE - floored.size;
const openTotal = open.reduce((n, r) => n + size(r), 0);
const allocation = new Map(rules.map((r) => [r, floored.has(r) ? 1 : 0]));
const quota = new Map(open.map((r) => [r, (slots * size(r)) / openTotal]));
for (const r of open) allocation.set(r, Math.floor(quota.get(r)));
let left = slots - open.reduce((n, r) => n + allocation.get(r), 0);
const byRemainder = [...open].sort(
  (a, b) =>
    quota.get(b) - Math.floor(quota.get(b)) - (quota.get(a) - Math.floor(quota.get(a))) ||
    size(b) - size(a) ||
    byCodeUnits(a, b),
);
for (const r of byRemainder) {
  if (left <= 0) break;
  allocation.set(r, allocation.get(r) + 1);
  left--;
}
for (const r of rules) allocation.set(r, Math.min(allocation.get(r), size(r)));
const allocated = rules.reduce((n, r) => n + allocation.get(r), 0);
if (allocated !== N_SAMPLE) throw new Error(`allocated ${allocated}, not ${N_SAMPLE}`);

const table = [...rules]
  .sort((a, b) => size(b) - size(a) || byCodeUnits(a, b))
  .map((rule) => ({
    rule,
    population: size(rule),
    share: size(rule) / total,
    proportionalQuota: (N_SAMPLE * size(rule)) / total,
    floored: floored.has(rule),
    sampled: allocation.get(rule),
    samplingFraction: allocation.get(rule) / size(rule),
    weight: size(rule) / allocation.get(rule),
  }));

// ─── Draw ─────────────────────────────────────────────────────────────────────
const next = mulberry32(SEED);
const picked = [];
for (const rule of rules) {
  const pool = [...strata.get(rule)].sort((a, b) => byCodeUnits(a.id, b.id));
  for (let i = 0; i < allocation.get(rule); i++)
    picked.push(...pool.splice(Math.floor(next() * pool.length), 1));
}
for (let i = picked.length - 1; i > 0; i--) {
  const j = Math.floor(next() * (i + 1));
  [picked[i], picked[j]] = [picked[j], picked[i]];
}

// ─── Excerpts from the pinned checkouts ───────────────────────────────────────
const RADIUS = 7; // 7 above + the line + 7 below = 15 lines
const MAX_CONTEXT_LINE = 400;
const MAX_FLAGGED_LINE = 2000;
const fileCache = new Map();
function lines(f) {
  const file = path.join(corpusDir, f.repo, ...f.file.split('/'));
  if (!fileCache.has(file))
    fileCache.set(
      file,
      fs
        .readFileSync(file, 'utf8')
        .split('\n')
        .map((l) => l.replace(/\r$/, '')),
    );
  return fileCache.get(file);
}
function excerpt(f) {
  const all = lines(f);
  const start = Math.max(1, f.line - RADIUS);
  const end = Math.min(all.length, f.line + RADIUS);
  const width = String(end).length;
  const out = [];
  for (let n = start; n <= end; n++) {
    let text = all[n - 1] ?? '';
    const max = n === f.line ? MAX_FLAGGED_LINE : MAX_CONTEXT_LINE;
    if (text.length > max) text = `${text.slice(0, max)} …[line truncated: ${text.length} chars]`;
    out.push(`${n === f.line ? '>' : ' '} ${String(n).padStart(width)} | ${text}`);
  }
  return { start, end, text: out.join('\n') };
}
const permalink = (f) =>
  `${f.repoUrl.replace(/\.git$/, '')}/blob/${f.sha}/${f.file.split('/').map(encodeURIComponent).join('/')}#L${f.line}`;

const pad = String(picked.length).length;
const sample = picked.map((f, i) => {
  const ex = excerpt(f);
  return {
    sampleNo: `S${String(i + 1).padStart(Math.max(2, pad), '0')}`,
    id: f.id,
    repo: f.repo,
    repoUrl: f.repoUrl,
    sha: f.sha,
    permalink: permalink(f),
    run: f.run,
    file: f.file,
    line: f.line,
    column: f.column,
    endLine: f.endLine,
    endColumn: f.endColumn,
    rule: f.rule,
    message: f.message,
    source: f.source,
    occurrence: f.occurrence,
    fingerprint: f.fingerprint,
    excerptStartLine: ex.start,
    excerptEndLine: ex.end,
    excerpt: ex.text,
  };
});
const key = picked.map((f, i) => ({
  sampleNo: sample[i].sampleNo,
  id: f.id,
  rule: f.rule,
  severity: f.severity,
  hasFix: f.hasFix,
  stratumPopulation: size(f.rule),
  stratumSampled: allocation.get(f.rule),
  weight: size(f.rule) / allocation.get(f.rule),
}));

fs.mkdirSync(outDir, { recursive: true });
const meta = {
  seed: SEED,
  n: N_SAMPLE,
  populationTotal: total,
  generator: 'mulberry32 (scripts/corpus-lib.ts random)',
};
fs.writeFileSync(
  path.join(outDir, 'sample-unlabelled.json'),
  `${JSON.stringify(
    {
      $comment:
        'Seeded rule-stratified random sample of distinct onsystem corpus findings, unlabelled. Each item: where the finding is (repo, pinned commit, file, line, column), the rule id, the finding message exactly as onsystem printed it, the matched source text, and ~15 lines of code from the pinned checkout (the reported line is marked with >). No suggested fix and no labels. run, occurrence and fingerprint are the corpus keys (scripts/corpus-lib.ts) for adding labels to corpus/labels.json.',
      ...meta,
      findings: sample,
    },
    null,
    2,
  )}\n`,
);
fs.writeFileSync(
  path.join(outDir, 'sample-key.json'),
  `${JSON.stringify({ ...meta, findings: key }, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(outDir, 'allocation.json'),
  `${JSON.stringify({ ...meta, allocation: table }, null, 2)}\n`,
);

console.log(`population ${total}, n ${N_SAMPLE}, seed ${SEED}`);
console.log(
  `${'rule'.padEnd(32)} ${'population'.padStart(10)} ${'share'.padStart(7)} ${'quota'.padStart(7)} ${'sampled'.padStart(7)}  floor`,
);
for (const t of table)
  console.log(
    `${t.rule.padEnd(32)} ${String(t.population).padStart(10)} ${(t.share * 100).toFixed(2).padStart(6)}% ${t.proportionalQuota.toFixed(3).padStart(7)} ${String(t.sampled).padStart(7)}  ${t.floored ? 'yes' : ''}`,
  );
console.log(
  `${'total'.padEnd(32)} ${String(total).padStart(10)} ${'100.00%'.padStart(7)} ${N_SAMPLE.toFixed(3).padStart(7)} ${String(allocated).padStart(7)}`,
);
