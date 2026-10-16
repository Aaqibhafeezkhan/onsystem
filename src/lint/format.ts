import type { CheckResult } from '../types.js';
import { plural } from '../util/strings.js';
import { formatSarif } from './sarif.js';
import { paletteColor, parseUtility, withBase } from './tailwind.js';

export type OutputFormat = 'pretty' | 'json' | 'github' | 'sarif';

/** From this many findings, `pretty` ends with a summary: more than a screen to scroll back through. */
const SUMMARY_FROM = 50;
/** The palette classes the summary lists. */
const TOP_CLASSES = 10;

const color = (code: number) => (text: string, enabled: boolean) =>
  enabled ? `\u001b[${code}m${text}\u001b[39m` : text;
const red = color(31);
const yellow = color(33);
const dim = (text: string, enabled: boolean) => (enabled ? `\u001b[2m${text}\u001b[22m` : text);
const bold = (text: string, enabled: boolean) => (enabled ? `\u001b[1m${text}\u001b[22m` : text);

/**
 * Renders check results:
 * - `pretty`: grouped by file, for terminals and agents,
 * - `json`: the raw results,
 * - `github`: workflow commands that GitHub Actions turns into PR annotations,
 * - `sarif`: a SARIF 2.1.0 log, for GitHub code scanning and other SARIF consumers.
 */
export function formatDiagnostics(
  results: CheckResult[],
  format: OutputFormat,
  options: {
    color?: boolean;
    /** Findings a baseline accepted; set when a baseline was applied. */
    baselined?: number | undefined;
    /** Says that baseline entries no longer occur, and how to drop them. */
    fixedHint?: string | undefined;
    /** What the run left out: `5 design-system files skipped`, `12 tests and stories left out`. */
    notes?: readonly string[] | undefined;
    /**
     * `sarif` and `github`: a result's file as a path relative to the repository root, which
     * code scanning and workflow commands resolve locations against.
     */
    uri?: ((file: string) => string) | undefined;
  } = {},
): string {
  const { fixedHint } = options;
  if (format === 'json') return JSON.stringify(results, null, 2);
  if (format === 'sarif') return formatSarif(results, options.uri);
  if (format === 'github') {
    const lines = results.flatMap((result) => {
      const file = options.uri ? options.uri(result.file) : result.file;
      return result.diagnostics.map((d) => {
        const level = d.severity === 'error' ? 'error' : 'warning';
        const props = `file=${escapeProperty(file)},line=${d.line},col=${d.column},endLine=${d.endLine},endColumn=${d.endColumn},title=${escapeProperty(d.ruleId)}`;
        return `::${level} ${props}::${escapeData(d.message)}`;
      });
    });
    if (fixedHint) lines.push(`::notice title=onsystem baseline::${escapeData(fixedHint)}`);
    return lines.join('\n');
  }

  const useColor = options.color ?? false;
  const lines: string[] = [];
  let errors = 0;
  let warnings = 0;
  for (const result of results) {
    errors += result.errorCount;
    warnings += result.warningCount;
    if (!result.diagnostics.length) continue;
    lines.push(bold(result.file, useColor));
    const width = Math.max(...result.diagnostics.map((d) => `${d.line}:${d.column}`.length));
    for (const d of result.diagnostics) {
      const mark = d.severity === 'error' ? red('error', useColor) : yellow('warn ', useColor);
      lines.push(
        `  ${dim(`${d.line}:${d.column}`.padEnd(width), useColor)}  ${mark}  ${d.message}  ${dim(d.ruleId, useColor)}`,
      );
    }
    lines.push('');
  }
  const total = errors + warnings;
  if (total >= SUMMARY_FROM) lines.push(...summarize(results), '');
  const notes = [
    options.baselined === undefined
      ? ''
      : `${options.baselined.toLocaleString('en-US')} in the baseline`,
    ...(options.notes ?? []),
  ].filter(Boolean);
  const aside = notes.length ? ` (${notes.join('; ')})` : '';
  // "in 1 of 3 files checked", not "in 3 files", when the findings are in fewer.
  const flagged = results.filter((r) => r.diagnostics.length).length;
  const where =
    flagged === results.length
      ? plural(results.length, 'file')
      : `${flagged} of ${plural(results.length, 'file')} checked`;
  lines.push(
    total
      ? `${errors ? red(plural(errors, 'error'), useColor) : '0 errors'}, ${warnings ? yellow(plural(warnings, 'warning'), useColor) : '0 warnings'} in ${where}${aside}`
      : `${options.baselined === undefined ? 'No problems' : 'No new problems'} in ${plural(results.length, 'file')}${aside}.`,
  );
  if (fixedHint) lines.push(dim(fixedHint, useColor));
  return lines.join('\n');
}

/**
 * What a long run's findings add up to: the count per rule, as `init`'s dry run gives it, and
 * the Tailwind palette classes found most, each with the token to use. On a palette-heavy app
 * (Dub's web app, over 14,000 lines of findings) that reads as a plan for moving to the tokens.
 */
function summarize(results: readonly CheckResult[]): string[] {
  const byRule = new Map<string, number>();
  const pairs = new Map<string, { text: string; count: number }>();
  const paletteFiles = new Set<string>();
  let palette = 0;
  for (const result of results) {
    for (const d of result.diagnostics) {
      byRule.set(d.ruleId, (byRule.get(d.ruleId) ?? 0) + 1);
      if (d.ruleId !== 'no-hardcoded-color') continue;
      const utility = parseUtility(d.source);
      if (!paletteColor(utility.base)) continue;
      palette++;
      paletteFiles.add(result.file);
      // The fix's class, with the variants and modifier of the one it replaces; a suggestion
      // that is not applied names the bare class (or a variant, `variant="ghost"`).
      const fix = d.fix?.length === 1 ? d.fix[0]?.text : undefined;
      const to =
        fix ??
        (d.suggestion && /^[^\s"'=]+$/.test(d.suggestion)
          ? withBase(utility, d.suggestion)
          : d.suggestion);
      // `Nearest token`, not `Matches token`: another color, to check before replacing.
      const nearest = d.message.includes('. Nearest token ') ? ' (nearest token)' : '';
      const text = `${d.source} → ${to ? `${to}${nearest}` : 'no close token'}`;
      const pair = pairs.get(text) ?? { text, count: 0 };
      pair.count++;
      pairs.set(text, pair);
    }
  }
  const lines = [
    `By rule: ${[...byRule]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([rule, n]) => `${rule} ${n.toLocaleString('en-US')}`)
      .join(', ')}.`,
  ];
  const top = [...pairs.values()]
    .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text))
    .slice(0, TOP_CLASSES);
  if (top.length) {
    const width = Math.max(...top.map((pair) => pair.count.toLocaleString('en-US').length));
    lines.push(
      `Tailwind palette classes: ${palette.toLocaleString('en-US')} in ${plural(paletteFiles.size, 'file')}. The most common, with the token to use:`,
      ...top.map((pair) => `  ${pair.count.toLocaleString('en-US').padStart(width)}× ${pair.text}`),
    );
  }
  return lines;
}

/** Escapes a workflow command's message, so `%` and line breaks reach GitHub as written. */
export function escapeData(value: string): string {
  return value.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
}

function escapeProperty(value: string): string {
  return escapeData(value).replace(/:/g, '%3A').replace(/,/g, '%2C');
}
