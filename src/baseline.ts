import fs from 'node:fs';
import path from 'node:path';

import { ConfigError, RULE_IDS } from './config.js';
import type { CheckResult, Diagnostic } from './types.js';
import { relativePath } from './util/paths.js';

export const BASELINE_FILE = 'onsystem.baseline.json';
/** The baseline's name from before the rename to onsystem: still read when the new one is absent. */
export const LEGACY_BASELINE_FILE = 'design-system-mcp.baseline.json';

/**
 * Findings a project accepts for now, so `check` fails only on new ones.
 * Keyed by file (relative to the root), rule and the offending source text,
 * with a count: line numbers would go stale on every edit above a finding.
 */
export interface Baseline {
  version: 1;
  /** The onsystem version that recorded the findings. */
  onsystem?: string;
  /** The rules that ran when the findings were recorded. */
  rules?: string[];
  files: Record<string, Record<string, Record<string, number>>>;
}

/** file → rule → source → count. Maps, so `constructor` or `__proto__` are ordinary keys. */
type Entries = Map<string, Map<string, Map<string, number>>>;

/**
 * A finding's identity within its file and rule: the offending text with
 * whitespace collapsed, and without the quotes of a string literal, so a
 * formatter switching quote style does not make every finding look new.
 * SARIF fingerprints use it too, so code scanning tracks a finding as a baseline does.
 */
export function findingKey(diagnostic: Diagnostic): string {
  const text = diagnostic.source.replace(/\s+/g, ' ').trim();
  return (/^(['"`])(.*)\1$/.exec(text)?.[2] ?? text).slice(0, 200);
}

/** A baseline as read: its entries, and what recorded them when the file says. */
export interface BaselineData {
  entries: Entries;
  onsystem?: string | undefined;
  /** Undefined in a baseline written before onsystem recorded which rules ran. */
  rules?: ReadonlySet<string> | undefined;
}

/** The baseline, or undefined when the file does not exist. */
export function readBaseline(file: string): BaselineData | undefined {
  let text: string;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (error) {
    // ENOTDIR: a folder in the path is a file, so there is no baseline there either.
    const { code } = error as NodeJS.ErrnoException;
    if (code === 'ENOENT' || code === 'ENOTDIR') return undefined;
    throw new ConfigError(`Could not read baseline ${file}: ${(error as Error).message}`);
  }
  const invalid = (why: string) =>
    new ConfigError(
      `${file} is not a valid onsystem baseline (${why}). Fix it, or delete it and run check --update-baseline.`,
    );
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw invalid((error as Error).message);
  }
  if (!isObject(parsed) || parsed.version !== 1) throw invalid('expected "version": 1');
  if (!isObject(parsed.files)) throw invalid('"files" must be an object');
  if (parsed.onsystem !== undefined && typeof parsed.onsystem !== 'string') {
    throw invalid('"onsystem" must be a version string');
  }
  if (
    parsed.rules !== undefined &&
    !(Array.isArray(parsed.rules) && parsed.rules.every((rule) => typeof rule === 'string'))
  ) {
    throw invalid('"rules" must be a list of rule ids');
  }

  const entries: Entries = new Map();
  for (const [name, rules] of Object.entries(parsed.files)) {
    if (!isObject(rules)) throw invalid(`"${name}" must map rules to findings`);
    const byRule = new Map<string, Map<string, number>>();
    for (const [rule, sources] of Object.entries(rules)) {
      if (!isObject(sources)) throw invalid(`"${name}" › "${rule}" must map findings to counts`);
      const counts = new Map<string, number>();
      for (const [source, count] of Object.entries(sources)) {
        if (!Number.isInteger(count) || (count as number) < 1) {
          throw invalid(`"${name}" › "${rule}" › "${source}" must be a positive whole number`);
        }
        counts.set(source, count as number);
      }
      byRule.set(rule, counts);
    }
    entries.set(name, byRule);
  }
  return {
    entries,
    onsystem: parsed.onsystem,
    rules: parsed.rules ? new Set(parsed.rules) : undefined,
  };
}

export interface BaselineMatch {
  /** The result without the findings the baseline accepts. */
  result: CheckResult;
  /** Findings the baseline accepted. */
  baselined: number;
  /** Baseline entries for this file that no longer occur. */
  fixed: number;
}

/** Line ranges, 1-based and inclusive, such as the lines a pull request changed in a file. */
export type LineRanges = readonly (readonly [number, number])[];

/**
 * Removes the findings the baseline accepts for `file`. Within a file and
 * rule, each entry accepts that many findings with the same source text, in
 * order; any beyond the count are new. With `changed`, the lines a pull request
 * changed, findings on other lines are accepted first: a copy of a baselined
 * line inserted above it is the new one, not the line that was there. Entries
 * of `disabled` rules are not counted as fixed: the rule is off, not satisfied.
 */
export function applyBaseline(
  baseline: Entries,
  file: string,
  result: CheckResult,
  disabled: ReadonlySet<string> = new Set(),
  changed?: LineRanges,
): BaselineMatch {
  const remaining = new Map<string, number>();
  for (const [rule, sources] of baseline.get(file) ?? []) {
    if (disabled.has(rule)) continue;
    for (const [source, count] of sources) remaining.set(`${rule}\0${source}`, count);
  }
  const onChanged = (d: Diagnostic) =>
    changed?.some(([start, end]) => start <= d.endLine && end >= d.line) ?? false;
  const accepted = new Set<Diagnostic>();
  for (const later of [false, true]) {
    for (const diagnostic of result.diagnostics) {
      if (onChanged(diagnostic) !== later) continue;
      const id = `${diagnostic.ruleId}\0${findingKey(diagnostic)}`;
      const left = remaining.get(id) ?? 0;
      if (left > 0) {
        remaining.set(id, left - 1);
        accepted.add(diagnostic);
      }
    }
  }
  const diagnostics = result.diagnostics.filter((d) => !accepted.has(d));
  const baselined = accepted.size;
  let fixed = 0;
  for (const count of remaining.values()) fixed += count;
  return {
    result: {
      ...result,
      diagnostics,
      errorCount: diagnostics.filter((d) => d.severity === 'error').length,
      warningCount: diagnostics.filter((d) => d.severity === 'warning').length,
    },
    baselined,
    fixed,
  };
}

/**
 * Whether the key `file`, relative to the real `root`, still names a file by that spelling. On a
 * disk that ignores case (macOS, Windows), `Billing.tsx` still opens after a rename to
 * `billing.tsx`, but `check` keys the file by its new spelling, so the old key is gone, as on
 * Linux.
 */
function existsAs(root: string, file: string): boolean {
  try {
    const real = fs.realpathSync.native(path.resolve(root, file));
    return relativePath(root, real).normalize('NFC') === file;
  } catch {
    return false;
  }
}

/**
 * The files with baseline entries that no longer exist under `root`, deleted or renamed, among
 * those `include` takes. `checked` are files a run read, which exist.
 */
export function goneFiles(
  entries: Entries,
  root: string,
  checked: ReadonlySet<string>,
  include: (file: string) => boolean = () => true,
): string[] {
  return [...entries.keys()].filter(
    (file) => !checked.has(file) && include(file) && !existsAs(root, file),
  );
}

/**
 * Renamed and moved files (`git mv`, a folder reorganised): each file of `unrecorded` (file → its
 * findings), which has no entries of its own, paired with a file of `gone` whose entries match at
 * least half of its findings and half of those entries match its findings, as git counts a
 * rename from 50% similarity. Each file of `gone` pairs with one file at most, best match first,
 * so a copy of a file is new however many copies there are. Entries of rules `disabled` for the
 * new file are left out, as `applyBaseline` leaves them out. Returns new file → old file.
 */
export function findMoves(
  entries: Entries,
  unrecorded: ReadonlyMap<string, readonly Diagnostic[]>,
  gone: readonly string[],
  disabled: (file: string) => ReadonlySet<string> = () => new Set(),
): Map<string, string> {
  // Finding id → the gone files with entries for it, and how many.
  const recorded = new Map<string, { file: string; count: number }[]>();
  for (const file of gone) {
    for (const [rule, sources] of entries.get(file) ?? []) {
      for (const [source, count] of sources) {
        const id = `${rule}\0${source}`;
        const list = recorded.get(id) ?? [];
        list.push({ file, count });
        recorded.set(id, list);
      }
    }
  }
  const pairs: { to: string; from: string; matched: number }[] = [];
  for (const [to, diagnostics] of unrecorded) {
    if (entries.has(to) || !diagnostics.length) continue;
    const found = new Map<string, number>();
    for (const diagnostic of diagnostics) {
      const id = `${diagnostic.ruleId}\0${findingKey(diagnostic)}`;
      found.set(id, (found.get(id) ?? 0) + 1);
    }
    const matched = new Map<string, number>();
    for (const [id, n] of found) {
      for (const { file, count } of recorded.get(id) ?? []) {
        matched.set(file, (matched.get(file) ?? 0) + Math.min(n, count));
      }
    }
    const off = disabled(to);
    for (const [from, n] of matched) {
      let size = 0;
      for (const [rule, sources] of entries.get(from) ?? []) {
        if (off.has(rule)) continue;
        for (const count of sources.values()) size += count;
      }
      if (n * 2 >= diagnostics.length && n * 2 >= size) pairs.push({ to, from, matched: n });
    }
  }
  // The best matches first; then a file that kept its name (a folder moved), then path order.
  const sameName = (pair: { to: string; from: string }) =>
    path.posix.basename(pair.to) === path.posix.basename(pair.from) ? 0 : 1;
  const order = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
  pairs.sort(
    (a, b) =>
      b.matched - a.matched ||
      sameName(a) - sameName(b) ||
      order(a.to, b.to) ||
      order(a.from, b.from),
  );
  const moves = new Map<string, string>();
  const taken = new Set<string>();
  for (const { to, from } of pairs) {
    if (moves.has(to) || taken.has(from)) continue;
    moves.set(to, from);
    taken.add(from);
  }
  return moves;
}

/**
 * The baseline after a run over `checked` (file → its findings): those files
 * get exactly their current findings, plus their previous entries for
 * `disabled` rules; other files keep their entries while they still exist
 * under `root` by the same spelling.
 */
export function updateBaseline(
  previous: Entries | undefined,
  checked: ReadonlyMap<string, Diagnostic[]>,
  root: string,
  disabled: ReadonlySet<string> | ((file: string) => ReadonlySet<string>) = new Set(),
): Entries {
  const disabledIn = typeof disabled === 'function' ? disabled : () => disabled;
  const next: Entries = new Map();
  for (const [file, rules] of previous ?? []) {
    if (!checked.has(file) && existsAs(root, file)) next.set(file, rules);
  }
  for (const [file, diagnostics] of checked) {
    const rules = new Map<string, Map<string, number>>();
    const off = disabledIn(file);
    for (const [rule, sources] of previous?.get(file) ?? []) {
      if (off.has(rule)) rules.set(rule, sources);
    }
    for (const diagnostic of diagnostics) {
      let sources = rules.get(diagnostic.ruleId);
      if (!sources) rules.set(diagnostic.ruleId, (sources = new Map<string, number>()));
      const id = findingKey(diagnostic);
      sources.set(id, (sources.get(id) ?? 0) + 1);
    }
    if (rules.size) next.set(file, rules);
  }
  return next;
}

/**
 * The rules an update records as run: those that `ran` now, those the previous baseline lists,
 * and those with entries in `next`, since a rule with recorded findings ran when they were
 * recorded. Undefined, as in a baseline written before onsystem recorded rules, when the
 * previous baseline does not list them and the update may have left out files it covers: the
 * run checked only a folder or files below the root (`wholeRoot` false), or `next` keeps
 * entries of files the run did not check. Whatever ran over those files was not recorded, so a
 * list built from this run could say a rule did not run where it did.
 */
export function rulesRun(
  previous: BaselineData | undefined,
  next: Entries,
  checked: ReadonlyMap<string, unknown>,
  ran: Iterable<string>,
  wholeRoot: boolean,
): string[] | undefined {
  if (
    previous &&
    !previous.rules &&
    (!wholeRoot || [...next.keys()].some((file) => !checked.has(file)))
  ) {
    return undefined;
  }
  const known = new Set<string>(RULE_IDS);
  const rules = new Set([...(previous?.rules ?? []), ...ran]);
  for (const byRule of next.values()) {
    for (const rule of byRule.keys()) if (known.has(rule)) rules.add(rule);
  }
  return [...rules];
}

/**
 * The baseline without the entries a run over `checked` (file → its findings) shows no longer
 * occur: a checked file keeps at most as many of each finding as it still has, plus its entries
 * for `disabled` rules, and files the run did not check keep theirs while they still exist under
 * `root` by the same spelling. Nothing is added, so a new finding stays new, unlike with
 * `updateBaseline`. A file of `moves` (new file → old file, from `findMoves`) takes the old
 * file's entries as its own.
 */
export function pruneBaseline(
  previous: Entries,
  checked: ReadonlyMap<string, Diagnostic[]>,
  root: string,
  disabled: (file: string) => ReadonlySet<string>,
  moves: ReadonlyMap<string, string> = new Map(),
): Entries {
  const files = new Map(previous);
  for (const [to, from] of moves) {
    const rules = previous.get(from);
    if (rules && !previous.has(to)) files.set(to, rules);
  }
  const next: Entries = new Map();
  for (const [file, rules] of files) {
    const diagnostics = checked.get(file);
    if (!diagnostics) {
      if (existsAs(root, file)) next.set(file, rules);
      continue;
    }
    const found = new Map<string, number>();
    for (const diagnostic of diagnostics) {
      const id = `${diagnostic.ruleId}\0${findingKey(diagnostic)}`;
      found.set(id, (found.get(id) ?? 0) + 1);
    }
    const off = disabled(file);
    const kept = new Map<string, Map<string, number>>();
    for (const [rule, sources] of rules) {
      if (off.has(rule)) {
        kept.set(rule, sources);
        continue;
      }
      const left = new Map<string, number>();
      for (const [source, count] of sources) {
        const still = Math.min(count, found.get(`${rule}\0${source}`) ?? 0);
        if (still) left.set(source, still);
      }
      if (left.size) kept.set(rule, left);
    }
    if (kept.size) next.set(file, kept);
  }
  return next;
}

/**
 * New findings of rules that did not run when the baseline was recorded, counted by rule: a
 * rule that starts to run (an upgrade that finds the tokens it needs, or a rule turned on)
 * reports what was in the code all along. Empty when the baseline does not say which rules ran.
 */
export function unrecordedRules(
  baseline: BaselineData,
  diagnostics: Iterable<Diagnostic>,
): Map<string, number> {
  const counts = new Map<string, number>();
  if (!baseline.rules) return counts;
  const rules = new Set<string>(RULE_IDS);
  for (const { ruleId } of diagnostics) {
    if (rules.has(ruleId) && !baseline.rules.has(ruleId)) {
      counts.set(ruleId, (counts.get(ruleId) ?? 0) + 1);
    }
  }
  return counts;
}

export function countBaseline(entries: Entries): { findings: number; files: number } {
  let findings = 0;
  for (const rules of entries.values()) {
    for (const sources of rules.values()) {
      for (const count of sources.values()) findings += count;
    }
  }
  return { findings, files: entries.size };
}

/**
 * Writes the baseline sorted at every level, so it diffs cleanly in review, with the onsystem
 * version and the rules that ran when given, and creates its folder.
 */
export function writeBaseline(
  file: string,
  entries: Entries,
  about: { onsystem?: string | undefined; rules?: Iterable<string> | undefined } = {},
): void {
  const sorted = <T>(map: Map<string, T>) =>
    [...map].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const files: Baseline['files'] = {};
  for (const [name, rules] of sorted(entries)) {
    const byRule: Record<string, Record<string, number>> = {};
    for (const [rule, sources] of sorted(rules)) {
      byRule[rule] = Object.fromEntries(sorted(sources));
    }
    // defineProperty: a file named `__proto__` must stay an ordinary key.
    Object.defineProperty(files, name, { value: byRule, enumerable: true, writable: true });
  }
  const baseline: Baseline = {
    version: 1,
    ...(about.onsystem === undefined ? {} : { onsystem: about.onsystem }),
    ...(about.rules === undefined ? {} : { rules: [...new Set(about.rules)].sort() }),
    files,
  };
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(baseline, null, 2)}\n`);
  } catch (error) {
    throw new ConfigError(`Could not write baseline ${file}: ${(error as Error).message}`);
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
