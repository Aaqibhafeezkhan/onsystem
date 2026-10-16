// The comparison behind scripts/corpus.mjs: fingerprints, per-rule counts, the snapshot diff,
// label checks and the false-positive rate. Pure functions, so test/corpus.test.ts covers them.
import { createHash } from 'node:crypto';
import path from 'node:path';

export interface CheckDiagnostic {
  ruleId: string;
  severity: 'error' | 'warning';
  message: string;
  line: number;
  source: string;
  suggestion?: string;
  fix?: unknown[];
}

export interface CheckFileResult {
  file: string;
  diagnostics: CheckDiagnostic[];
}

/** One finding, keyed by what does not move when unrelated code changes: no line, no message. */
export interface Finding {
  fingerprint: string;
  run: string;
  file: string;
  line: number;
  rule: string;
  source: string;
  /** 1-based, among the findings of this rule with this source text in this file. */
  occurrence: number;
  severity: 'error' | 'warning';
  suggestion: string | null;
  fixable: boolean;
  message: string;
}

export type Verdict = 'TP' | 'FP' | 'D';

export interface Label {
  fingerprint: string;
  run: string;
  file: string;
  /** Where it was when labelled; informational. */
  line: number;
  rule: string;
  source: string;
  occurrence: number;
  /** When set, the label applies only while this is the suggestion (`null`: no suggestion). */
  suggestion?: string | null;
  verdict: Verdict;
  reason: string;
  /**
   * `audit`: picked because it looked suspicious. `random`: drawn at random, run by run, by a
   * reviewer who could see the finding, so not blind; its figures cover only the runs and rules
   * it labels. `blind`: a seeded draw from every distinct finding, stratified by rule, labelled by
   * a reviewer who saw no other label; `draw` names its folder in corpus/, with the method and
   * statistics. The false-positive rate to quote is a blind draw's.
   */
  sample: 'audit' | 'random' | 'blind';
  draw?: string;
}

export interface RuleCounts {
  errors: number;
  warnings: number;
  fixes: number;
}

export interface RunSnapshot {
  inspect: Record<string, unknown>;
  files: number;
  /** Files with at least one finding: what a baseline of the run would hold. */
  flagged?: number;
  rules: Record<string, RuleCounts>;
  /**
   * A run from a monorepo root: its findings outside the folders other runs check from
   * inside (`sameAs`), which it reports again. The false-positive rate counts only these.
   */
  added?: Record<string, RuleCounts>;
}

export interface Snapshot {
  runs: Record<string, RunSnapshot>;
  /** Whether each label matched a finding at the last update, by `labelKey`. */
  labels: Record<string, boolean>;
}

export function fingerprint(
  run: string,
  file: string,
  rule: string,
  source: string,
  occurrence: number,
): string {
  return createHash('sha256')
    .update([run, file, rule, source, String(occurrence)].join('\0'))
    .digest('hex')
    .slice(0, 12);
}

export function findings(run: string, results: CheckFileResult[]): Finding[] {
  const out: Finding[] = [];
  for (const result of results) {
    const seen = new Map<string, number>();
    for (const d of result.diagnostics) {
      const key = `${d.ruleId}\0${d.source}`;
      const occurrence = (seen.get(key) ?? 0) + 1;
      seen.set(key, occurrence);
      out.push({
        fingerprint: fingerprint(run, result.file, d.ruleId, d.source, occurrence),
        run,
        file: result.file,
        line: d.line,
        rule: d.ruleId,
        source: d.source,
        occurrence,
        severity: d.severity,
        suggestion: d.suggestion ?? null,
        fixable: Boolean(d.fix?.length),
        message: d.message,
      });
    }
  }
  return out;
}

/** Errors, warnings and fixable findings per rule, rules sorted by id. */
export function ruleCounts(found: readonly Finding[]): Record<string, RuleCounts> {
  const rules = new Map<string, RuleCounts>();
  for (const f of found) {
    const counts = rules.get(f.rule) ?? { errors: 0, warnings: 0, fixes: 0 };
    if (f.severity === 'error') counts.errors++;
    else counts.warnings++;
    if (f.fixable) counts.fixes++;
    rules.set(f.rule, counts);
  }
  return Object.fromEntries([...rules].sort(([a], [b]) => a.localeCompare(b)));
}

export function labelKey(label: Pick<Label, 'fingerprint' | 'suggestion'>): string {
  return label.suggestion === undefined
    ? label.fingerprint
    : `${label.fingerprint}@${label.suggestion ?? 'none'}`;
}

export function matches(label: Label, finding: Finding): boolean {
  return (
    label.fingerprint === finding.fingerprint &&
    (label.suggestion === undefined || label.suggestion === finding.suggestion)
  );
}

/**
 * Problems with the label file itself: a fingerprint that does not match its fields, duplicates.
 * A finding has one label, plus at most one from each blind draw.
 */
export function invalidLabels(labels: readonly Label[]): string[] {
  const problems: string[] = [];
  const keys = new Set<string>();
  for (const label of labels) {
    const expected = fingerprint(label.run, label.file, label.rule, label.source, label.occurrence);
    if (expected !== label.fingerprint) {
      problems.push(
        `${label.fingerprint}: the fingerprint of ${label.run} ${label.file} ${label.rule} "${label.source}" #${label.occurrence} is ${expected}`,
      );
    }
    if (!['TP', 'FP', 'D'].includes(label.verdict)) {
      problems.push(`${label.fingerprint}: verdict must be TP, FP or D`);
    }
    if (label.sample === 'blind' && !label.draw) {
      problems.push(`${label.fingerprint}: a blind label names its draw`);
    }
    // A blind draw is a sample of its own: it may pick a finding the other labels have.
    const key = labelKey(label);
    const scoped = label.sample === 'blind' ? `${label.draw ?? ''}\0${key}` : key;
    if (keys.has(scoped)) problems.push(`${key}: labelled twice`);
    keys.add(scoped);
  }
  return problems;
}

export interface CountChange {
  run: string;
  rule: string;
  before: RuleCounts | undefined;
  after: RuleCounts | undefined;
}

export interface Comparison {
  /** Rule counts that differ from the snapshot. */
  changes: CountChange[];
  /** Runs whose inspect summary, or number of checked or flagged files, differs. */
  changedRuns: string[];
  /** Failures no `--update` accepts: a TP that went away, an FP that came back, a stale label. */
  labelFailures: string[];
  /** Labelled findings that went away or came back, as expected or not. */
  labelChanges: { label: Label; present: boolean }[];
  present: Map<Label, Finding>;
}

/** Compares a run of the corpus with the snapshot, for the runs in `current`. */
export function compare(
  snapshot: Snapshot,
  current: Record<string, RunSnapshot>,
  found: readonly Finding[],
  labels: readonly Label[],
): Comparison {
  const changes: CountChange[] = [];
  const changedRuns: string[] = [];
  for (const [run, now] of Object.entries(current)) {
    const before = snapshot.runs[run];
    if (
      !before ||
      before.files !== now.files ||
      before.flagged !== now.flagged ||
      JSON.stringify(before.inspect) !== JSON.stringify(now.inspect) ||
      JSON.stringify(before.added) !== JSON.stringify(now.added)
    ) {
      changedRuns.push(run);
    }
    const rules = new Set([...Object.keys(before?.rules ?? {}), ...Object.keys(now.rules)]);
    for (const rule of [...rules].sort()) {
      const a = before?.rules[rule];
      const b = now.rules[rule];
      if (JSON.stringify(a) !== JSON.stringify(b)) changes.push({ run, rule, before: a, after: b });
    }
  }

  const byFingerprint = new Map<string, Finding[]>();
  for (const f of found)
    byFingerprint.set(f.fingerprint, [...(byFingerprint.get(f.fingerprint) ?? []), f]);
  const present = new Map<Label, Finding>();
  const labelFailures: string[] = [];
  const labelChanges: Comparison['labelChanges'] = [];
  for (const label of labels) {
    if (!(label.run in current)) continue;
    const finding = byFingerprint.get(label.fingerprint)?.find((f) => matches(label, f));
    if (finding) present.set(label, finding);
    // A label that has just been narrowed to a suggestion was recorded under its fingerprint.
    const was = snapshot.labels[labelKey(label)] ?? snapshot.labels[label.fingerprint];
    const is = finding !== undefined;
    const where = `${label.run} ${label.file}:${label.line} [${label.rule}] "${label.source}"`;
    if (was === undefined && !is) {
      labelFailures.push(`New label matches no finding: ${where} (${labelKey(label)})`);
    } else if (was !== undefined && was !== is) {
      labelChanges.push({ label, present: is });
      if (label.verdict === 'TP' && !is) {
        labelFailures.push(
          `A true positive is no longer reported: ${where}. ${label.reason} Relabel or remove it in corpus/labels.json if that is intended.`,
        );
      } else if (label.verdict === 'FP' && is) {
        labelFailures.push(`A fixed false positive is back: ${where}. ${label.reason}`);
      }
    }
  }
  return { changes, changedRuns, labelFailures, labelChanges, present };
}

export interface Precision {
  tp: number;
  fp: number;
  d: number;
  /** FP / all labelled findings still reported, or undefined with none. */
  rate: number | undefined;
}

function tally(labels: Iterable<Label>): Precision {
  const out: Precision = { tp: 0, fp: 0, d: 0, rate: undefined };
  for (const label of labels) {
    if (label.verdict === 'TP') out.tp++;
    else if (label.verdict === 'FP') out.fp++;
    else out.d++;
  }
  const total = out.tp + out.fp + out.d;
  out.rate = total ? out.fp / total : undefined;
  return out;
}

export interface FalsePositiveRate {
  /** Random labels still reported, all severities and errors only. */
  sample: Precision;
  sampleErrors: Precision;
  /** Audit labels still reported (picked as suspicious, so not an estimate). */
  audit: Precision;
  /**
   * The random sample's FP rate per run and rule, weighted by how many findings each has now. It
   * describes only the runs and rules those labels cover, not all findings in the corpus, and the
   * labels are not blind: the rate to quote is a blind draw's. `coverage` is the share of findings
   * in a run and rule with at least one random label still reported.
   */
  estimate: number | undefined;
  coverage: number;
  estimateErrors: number | undefined;
  coverageErrors: number;
  /** The random sample per rule. */
  byRule: { rule: string; precision: Precision }[];
}

export function falsePositiveRate(
  present: ReadonlyMap<Label, Finding>,
  current: Record<string, RunSnapshot>,
): FalsePositiveRate {
  const random = [...present].filter(([label]) => label.sample === 'random');
  const weighted = (errorsOnly: boolean) => {
    const strata = new Map<string, Label[]>();
    for (const [label, finding] of random) {
      if (errorsOnly && finding.severity !== 'error') continue;
      const key = `${label.run}\0${label.rule}`;
      strata.set(key, [...(strata.get(key) ?? []), label]);
    }
    let total = 0;
    let covered = 0;
    let fp = 0;
    for (const [run, snapshot] of Object.entries(current)) {
      for (const [rule, counts] of Object.entries(snapshot.added ?? snapshot.rules)) {
        const n = counts.errors + (errorsOnly ? 0 : counts.warnings);
        total += n;
        const labelled = strata.get(`${run}\0${rule}`);
        if (!labelled?.length) continue;
        covered += n;
        fp += (n * labelled.filter((l) => l.verdict === 'FP').length) / labelled.length;
      }
    }
    return { rate: covered ? fp / covered : undefined, coverage: total ? covered / total : 0 };
  };
  const all = weighted(false);
  const errors = weighted(true);
  return {
    sample: tally(random.map(([label]) => label)),
    sampleErrors: tally(random.filter(([, f]) => f.severity === 'error').map(([label]) => label)),
    audit: tally([...present.keys()].filter((label) => label.sample === 'audit')),
    estimate: all.rate,
    coverage: all.coverage,
    estimateErrors: errors.rate,
    coverageErrors: errors.coverage,
    byRule: [...new Set(random.map(([label]) => label.rule))].sort().map((rule) => ({
      rule,
      precision: tally(random.filter(([label]) => label.rule === rule).map(([label]) => label)),
    })),
  };
}

/** A finding as a root run and a run from the project's own folder both report it. */
function sameness(f: Finding, file: string): string {
  return JSON.stringify([file, f.rule, f.severity, f.line, f.source, f.message, f.suggestion]);
}

/**
 * Where a run from a workspace root differs from a run from one of its projects, for the
 * files under `folder`: root mode routes each file to its own project, so both must report
 * the same files and findings. `.` compares every file: a run of the same folder another way
 * (after `init` set up its design-system package). Lines name each difference; none means
 * they agree.
 */
export function rootDifferences(
  root: { files: readonly string[]; findings: readonly Finding[] },
  folder: string,
  project: { files: readonly string[]; findings: readonly Finding[] },
): string[] {
  const prefix = folderPrefix(folder);
  const differences: string[] = [];
  const rootFiles = new Set(root.files.filter((f) => f.startsWith(prefix)));
  const projectFiles = new Set(project.files.map((f) => `${prefix}${f}`));
  for (const file of [...projectFiles].filter((f) => !rootFiles.has(f)).sort()) {
    differences.push(`${file}: checked from ${folder}, not from the root`);
  }
  for (const file of [...rootFiles].filter((f) => !projectFiles.has(f)).sort()) {
    differences.push(`${file}: checked from the root, not from ${folder}`);
  }
  const fromRoot = root.findings
    .filter((f) => f.file.startsWith(prefix))
    .map((f) => sameness(f, f.file));
  const fromProject = project.findings.map((f) => sameness(f, `${prefix}${f.file}`));
  const count = (list: string[]) => {
    const counts = new Map<string, number>();
    for (const key of list) counts.set(key, (counts.get(key) ?? 0) + 1);
    return counts;
  };
  const a = count(fromRoot);
  const b = count(fromProject);
  for (const key of [...new Set([...a.keys(), ...b.keys()])].sort()) {
    const n = a.get(key) ?? 0;
    const m = b.get(key) ?? 0;
    if (n === m) continue;
    const [file, rule, , line, source] = JSON.parse(key) as [
      string,
      string,
      string,
      number,
      string,
    ];
    differences.push(
      `${file}:${line} [${rule}] "${source}": ${n} from the root, ${m} from ${folder}`,
    );
  }
  return differences;
}

/** Findings outside the given folders (`.` holds them all): what a root run adds to the runs from its projects. */
export function outside<F extends Pick<Finding, 'file'>>(
  found: readonly F[],
  folders: readonly string[],
): F[] {
  const prefixes = folders.map(folderPrefix);
  return found.filter((f) => !prefixes.some((prefix) => f.file.startsWith(prefix)));
}

/** `apps/web/` for `apps/web`, and nothing for `.`, the run's whole folder. */
function folderPrefix(folder: string): string {
  const trimmed = folder.replace(/\/+$/, '');
  return trimmed === '.' ? '' : `${trimmed}/`;
}

export function percent(rate: number | undefined): string {
  return rate === undefined ? 'n/a' : `${(rate * 100).toFixed(1)}%`;
}

/** A Markdown table of count changes, for pull request descriptions. */
export function changeTable(changes: readonly CountChange[]): string {
  const cell = (c: RuleCounts | undefined) =>
    c ? `${c.errors + c.warnings} (${c.fixes} fixable)` : '0';
  const lines = ['| Run | Rule | Before | After |', '| --- | --- | ---: | ---: |'];
  for (const { run, rule, before, after } of changes) {
    lines.push(`| ${run} | ${rule} | ${cell(before)} | ${cell(after)} |`);
  }
  return lines.join('\n');
}

/** A small seeded generator (mulberry32), so `sample` draws the same findings for the same seed. */
export function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A repository's `install` in corpus/repos.json: for each folder of the checkout, the npm
 * packages the CLI needs to read the app as the app's own editor does (a component library's
 * type declarations, its peers and React's types), each at an exact version, and the date that
 * pins what they depend on: npm takes the newest versions published by then.
 */
export interface InstallSpec {
  before: string;
  /** Folder of the checkout (`.` for its root) → package → exact version. */
  folders: Record<string, Record<string, string>>;
}

export interface Install {
  folder: string;
  /** Where the packages are installed: beside the checkouts, never in one. */
  dir: string;
  /** The folder's node_modules in the checkout, a link to `dir`'s. */
  link: string;
  /** The package.json written into `dir`: the repository's own is not used. */
  manifest: { private: true; dependencies: Record<string, string> };
  /** npm's arguments: no package's install scripts run. */
  args: string[];
}

/** `5.15.0`, `7.0.0-beta.13`: one version, not a range or a tag. */
const EXACT_VERSION = /^\d+\.\d+\.\d+(?:-[\w.]+)?$/;

/** What `corpus.mjs fetch` installs for `repo`, under the corpus folder `corpus`. */
export function installs(
  repo: { name: string; install?: InstallSpec | undefined },
  corpus: string,
): Install[] {
  if (!repo.install) return [];
  const { before, folders } = repo.install;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(before)) {
    throw new Error(
      `${repo.name}: install.before must be a date (2026-08-13), not ${JSON.stringify(before)}.`,
    );
  }
  return Object.entries(folders).map(([folder, packages]) => {
    const parts = folder.split('/').filter((part) => part && part !== '.');
    if (parts.includes('..') || path.isAbsolute(folder)) {
      throw new Error(`${repo.name}: install folder ${folder} is not inside the checkout.`);
    }
    for (const [name, version] of Object.entries(packages)) {
      if (!EXACT_VERSION.test(version)) {
        throw new Error(
          `${repo.name}: install ${name}@${version} in ${folder}: pin an exact version.`,
        );
      }
    }
    return {
      folder,
      dir: path.join(corpus, '.installs', repo.name, ...(parts.length ? parts : ['.root'])),
      link: path.join(corpus, repo.name, ...parts, 'node_modules'),
      manifest: { private: true, dependencies: packages },
      args: [
        'install',
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        '--update-notifier=false',
        '--loglevel=error',
        `--before=${before}`,
      ],
    };
  });
}

// ─── The installed-types corpus ───────────────────────────────────────────────

/** A run of corpus/repos.json, as far as the installed-types corpus reads it. */
export interface CorpusRun {
  name: string;
  cwd: string;
  check: string[];
  args?: string[];
  config?: string;
  init?: string[];
  sameAs?: Record<string, string>;
}

export interface CorpusRepo {
  name: string;
  url: string;
  sha: string;
  paths?: string[];
  install?: InstallSpec;
  runs: CorpusRun[];
}

/** A repository of bench/v2/config/repos.json: `corpus` names its entry in corpus/repos.json. */
export interface BenchRepo {
  name: string;
  corpus: string;
  install: string[];
}

export interface InstalledRun extends CorpusRun {
  /** The run of corpus/repos.json this one repeats with dependencies installed. */
  plain: string;
}

export interface InstalledRepo {
  name: string;
  url: string;
  sha: string;
  paths?: string[];
  /** The install bench/v2 runs in the checkout, from the repository's own lockfile. */
  command: string[];
  runs: InstalledRun[];
}

/** The suffix that keeps an installed run's name, fingerprints and labels apart from its plain run. */
export const INSTALLED = '-installed';

/**
 * The installed-types corpus: the repositories bench/v2 installs (bench/v2/config/repos.json), at
 * the commits and folders corpus/repos.json pins, each installed from its own lockfile with
 * bench/v2's command, and their corpus runs repeated with that install. A run with `init` checks a
 * copy of the checkout and is left out: the copy would take the whole install with it.
 */
export function installedRepos(
  corpus: { repos: readonly CorpusRepo[] },
  bench: { repos: readonly BenchRepo[] },
): InstalledRepo[] {
  return bench.repos.map((benchRepo) => {
    const repo = corpus.repos.find((r) => r.name === benchRepo.corpus);
    if (!repo) {
      throw new Error(
        `${benchRepo.name}: corpus/repos.json has no repository named ${benchRepo.corpus}.`,
      );
    }
    const [tool, ...args] = benchRepo.install;
    // Nothing in the repository runs: no lifecycle script, and no install that changes the lockfile.
    if (tool !== 'pnpm' || args[0] !== 'install') {
      throw new Error(`${repo.name}: the installed corpus runs pnpm install, not ${tool ?? ''}.`);
    }
    for (const flag of ['--frozen-lockfile', '--ignore-scripts']) {
      if (!args.includes(flag)) throw new Error(`${repo.name}: the install must pass ${flag}.`);
    }
    if (repo.install) {
      throw new Error(`${repo.name}: has pinned packages of its own (install) and a lockfile.`);
    }
    const kept = repo.runs.filter((run) => !run.init);
    const names = new Set(kept.map((run) => run.name));
    return {
      name: repo.name,
      url: repo.url,
      sha: repo.sha,
      ...(repo.paths ? { paths: repo.paths } : {}),
      command: benchRepo.install,
      runs: kept.map(({ sameAs, ...run }) => {
        const same = Object.entries(sameAs ?? {}).filter(([, other]) => names.has(other));
        return {
          ...run,
          name: `${run.name}${INSTALLED}`,
          plain: run.name,
          ...(same.length
            ? {
                sameAs: Object.fromEntries(
                  same.map(([folder, other]) => [folder, `${other}${INSTALLED}`]),
                ),
              }
            : {}),
        };
      }),
    };
  });
}

/** One rule of one run whose counts differ once the run's dependencies are installed. */
export interface TypeDriven {
  run: string;
  rule: string;
  without: RuleCounts | undefined;
  with: RuleCounts | undefined;
}

/**
 * What installing the dependencies changes, run by run and rule by rule: each installed run
 * against its plain run in corpus/snapshot.json. Types decide which props and variants a
 * component takes and whether a native element's attributes fit a design-system component, so
 * the API rules and the component rule's fixes differ; colors and spacing do not.
 */
export function typeDriven(
  installed: Record<string, Pick<RunSnapshot, 'rules'>>,
  plain: Record<string, Pick<RunSnapshot, 'rules'>>,
  plainName: (run: string) => string,
): TypeDriven[] {
  const out: TypeDriven[] = [];
  for (const [run, now] of Object.entries(installed)) {
    const before = plain[plainName(run)];
    if (!before) continue;
    const rules = new Set([...Object.keys(before.rules), ...Object.keys(now.rules)]);
    for (const rule of [...rules].sort()) {
      const a = before.rules[rule];
      const b = now.rules[rule];
      if (JSON.stringify(a) !== JSON.stringify(b)) out.push({ run, rule, without: a, with: b });
    }
  }
  return out;
}

/** A Markdown table of what installing changes, for pull request descriptions and the job summary. */
export function typeDrivenTable(rows: readonly TypeDriven[]): string {
  const cell = (c: RuleCounts | undefined) =>
    c ? `${c.errors + c.warnings} (${c.fixes} fixable)` : '0';
  const lines = [
    '| Run | Rule | Without dependencies | With them |',
    '| --- | --- | ---: | ---: |',
  ];
  for (const row of rows) {
    lines.push(`| ${row.run} | ${row.rule} | ${cell(row.without)} | ${cell(row.with)} |`);
  }
  return lines.join('\n');
}

// ─── A holdout: a seeded draw of distinct findings, labelled blind ────────────

/**
 * Every distinct finding of a corpus, the population a sample is drawn from: a run with its own
 * `config` re-checks another run's files and is left out, and a run with `sameAs` counts only
 * what it adds outside those folders (the snapshot's `added`). The README counts the same way.
 */
export function distinctFindings<F extends Pick<Finding, 'file'>>(
  runs: readonly Pick<CorpusRun, 'name' | 'config' | 'sameAs'>[],
  byRun: Readonly<Record<string, readonly F[]>>,
): F[] {
  return runs.flatMap((run) => {
    const found = byRun[run.name];
    if (!found) throw new Error(`${run.name}: no findings to draw from; run it first.`);
    if (run.config) return [];
    return run.sameAs ? outside(found, Object.keys(run.sameAs)) : [...found];
  });
}

export interface Stratum {
  rule: string;
  population: number;
  sampled: number;
  /** population / sampled: each sampled finding stands for this many in its rule. */
  weight: number;
}

/**
 * A sample for a rate per rule: up to `perRule` findings of each rule, all of a rule that has
 * fewer. One mulberry32 generator (`random`) does every draw: rules in id order, each rule's
 * findings in `id` order, then the corpus `sample` command's step, `floor(next() * remaining)`,
 * taken out of the list; then the picks are shuffled (Fisher-Yates, same generator) so a
 * labeller does not see them grouped by rule.
 */
export function drawHoldout<F extends { rule: string }>(
  population: readonly F[],
  { seed, perRule, id }: { seed: number; perRule: number; id: (f: F) => string },
): { strata: Stratum[]; picks: F[] } {
  if (!Number.isInteger(perRule) || perRule < 1) throw new Error('perRule must be 1 or more.');
  const byCodeUnits = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
  const ids = new Set(population.map(id));
  if (ids.size !== population.length) throw new Error('two findings share an id.');
  const next = random(seed);
  const strata: Stratum[] = [];
  const picks: F[] = [];
  for (const rule of [...new Set(population.map((f) => f.rule))].sort(byCodeUnits)) {
    const pool = population
      .filter((f) => f.rule === rule)
      .sort((a, b) => byCodeUnits(id(a), id(b)));
    const sampled = Math.min(perRule, pool.length);
    strata.push({ rule, population: pool.length, sampled, weight: pool.length / sampled });
    for (let i = 0; i < sampled; i++)
      picks.push(...pool.splice(Math.floor(next() * pool.length), 1));
  }
  for (let i = picks.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [picks[i], picks[j]] = [picks[j] as F, picks[i] as F];
  }
  return { strata, picks };
}

/** A 95% Wilson score interval for k of n. */
export function wilson(k: number, n: number): [number, number] {
  if (!n) return [0, 1];
  const z = 1.959964;
  const p = k / n;
  const d = 1 + (z * z) / n;
  const c = (p + (z * z) / (2 * n)) / d;
  const h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return [Math.max(0, c - h), Math.min(1, c + h)];
}

/** A labeller's verdict in a draw's sample-labelled.json. */
export type HoldoutLabel = 'TP' | 'FP' | 'debatable';

export interface RuleRate {
  rule: string;
  n: number;
  tp: number;
  fp: number;
  d: number;
  /** False positives among the labelled findings of the rule, with a 95% Wilson interval. */
  rate: number;
  low: number;
  high: number;
}

/** The false-positive rate of each rule in a labelled holdout, rules in id order. */
export function ruleRates(labelled: readonly { rule: string; label: HoldoutLabel }[]): RuleRate[] {
  const rules = [...new Set(labelled.map((f) => f.rule))].sort();
  return rules.map((rule) => {
    const of = labelled.filter((f) => f.rule === rule);
    const count = (label: HoldoutLabel) => of.filter((f) => f.label === label).length;
    const fp = count('FP');
    const [low, high] = wilson(fp, of.length);
    return {
      rule,
      n: of.length,
      tp: count('TP'),
      fp,
      d: count('debatable'),
      rate: fp / of.length,
      low,
      high,
    };
  });
}
