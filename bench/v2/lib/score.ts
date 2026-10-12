// Scoring behind bench/v2/run.mjs, kept free of I/O so test/bench-v2.test.ts covers it: which
// files a run changed, the `tsc` config that type-checks only those files in the project's own
// setup, which compiler diagnostics belong to them, and what onsystem's `check` reported.

export interface FileStamp {
  size: number;
  mtimeMs: number;
  hash: string;
}

export type Manifest = Record<string, FileStamp>;

export interface Changes {
  added: string[];
  modified: string[];
  deleted: string[];
}

/** Files added, modified or deleted between two manifests (path → size, mtime and hash). */
export function diffManifests(before: Manifest, after: Manifest): Changes {
  const added: string[] = [];
  const modified: string[] = [];
  for (const [file, stamp] of Object.entries(after)) {
    const old = before[file];
    if (!old) added.push(file);
    else if (old.hash !== stamp.hash) modified.push(file);
  }
  const deleted = Object.keys(before).filter((file) => !(file in after));
  return { added: added.sort(), modified: modified.sort(), deleted: deleted.sort() };
}

export interface TscDiagnostic {
  file: string;
  line: number;
  column: number;
  code: string;
  message: string;
}

/**
 * Parses `tsc --pretty false` output: `file(line,col): error TS1234: message`, with indented
 * continuation lines (elaborations) folded into the message. Global errors without a file
 * (`error TS5083: ...`) are kept with an empty file name.
 */
export function parseTscOutput(output: string): TscDiagnostic[] {
  const diagnostics: TscDiagnostic[] = [];
  const located = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.*)$/;
  const global = /^error (TS\d+): (.*)$/;
  for (const raw of output.split(/\r?\n/)) {
    if (!raw.trim()) continue;
    const at = located.exec(raw);
    if (at) {
      diagnostics.push({
        file: (at[1] ?? '').replace(/\\/g, '/'),
        line: Number(at[2]),
        column: Number(at[3]),
        code: at[4] ?? '',
        message: at[5] ?? '',
      });
      continue;
    }
    const g = global.exec(raw);
    if (g) {
      diagnostics.push({ file: '', line: 0, column: 0, code: g[1] ?? '', message: g[2] ?? '' });
      continue;
    }
    const last = diagnostics.at(-1);
    if (last && /^\s/.test(raw)) last.message += `\n${raw.trim()}`;
  }
  return diagnostics;
}

/** The diagnostics located in `files` (paths relative to the project, as tsc prints them). */
export function diagnosticsIn(
  diagnostics: readonly TscDiagnostic[],
  files: readonly string[],
): TscDiagnostic[] {
  const wanted = new Set(files.map(normalize));
  return diagnostics.filter((d) => wanted.has(normalize(d.file)));
}

/** Diagnostics that stop tsc from checking anything at all: global ones, and ones in a tsconfig. */
export function configErrors(diagnostics: readonly TscDiagnostic[]): TscDiagnostic[] {
  return diagnostics.filter((d) => !d.file || /(^|\/)tsconfig[^/]*\.json$/.test(d.file));
}

function normalize(file: string): string {
  return file.replace(/\\/g, '/').replace(/^\.\//, '');
}

export interface ScopeOptions {
  /** The project's own tsconfig, relative to the scope file (they sit side by side). */
  extends: string;
  /** Files to check, relative to the project. */
  files: readonly string[];
  /** The project's own `compilerOptions.paths`, read from its tsconfig. */
  basePaths?: Record<string, string[]> | undefined;
  /**
   * Extra path mappings, for workspace packages whose `exports` point at a build output that a
   * checkout without install scripts does not have (merged over basePaths).
   */
  extraPaths?: Record<string, string[]> | undefined;
}

/**
 * A tsconfig that extends the project's own and checks only the given files (plus their
 * imports, and the project's ambient `.d.ts` files), so a run's new component is type-checked
 * exactly as the project would check it, without paying for, or failing on, the rest of the
 * project.
 */
export function scopeTsconfig(options: ScopeOptions): Record<string, unknown> {
  const compilerOptions: Record<string, unknown> = {
    noEmit: true,
    incremental: false,
    composite: false,
  };
  if (options.extraPaths && Object.keys(options.extraPaths).length) {
    compilerOptions.paths = { ...(options.basePaths ?? {}), ...options.extraPaths };
  }
  return {
    extends: options.extends,
    compilerOptions,
    include: ['**/*.d.ts'],
    exclude: ['node_modules', '**/node_modules', '.next', 'dist', 'build'],
    files: [...options.files],
  };
}

export interface CheckDiagnostic {
  ruleId: string;
  severity: 'error' | 'warning';
  message: string;
  line: number;
  column: number;
  source?: string;
}

export interface Finding extends CheckDiagnostic {
  file: string;
}

export interface FindingSummary {
  errors: number;
  warnings: number;
  byRule: Record<string, number>;
  findings: Finding[];
}

/** Summarizes `onsystem check --format json` output: `[{ file, diagnostics: [...] }]`. */
export function summarizeCheck(json: unknown): FindingSummary {
  if (!Array.isArray(json)) throw new Error('onsystem check did not print a JSON array.');
  const findings: Finding[] = [];
  for (const entry of json as { file?: unknown; diagnostics?: unknown }[]) {
    if (typeof entry.file !== 'string' || !Array.isArray(entry.diagnostics)) continue;
    for (const d of entry.diagnostics as CheckDiagnostic[])
      findings.push({ file: entry.file, ...d });
  }
  const byRule: Record<string, number> = {};
  for (const f of findings) byRule[f.ruleId] = (byRule[f.ruleId] ?? 0) + 1;
  return {
    errors: findings.filter((f) => f.severity === 'error').length,
    warnings: findings.filter((f) => f.severity === 'warning').length,
    byRule,
    findings,
  };
}

/** UI files onsystem checks (`.tsx`/`.jsx`) and TypeScript files tsc checks, from a change list. */
export function classify(files: readonly string[]): { ui: string[]; typescript: string[] } {
  return {
    ui: files.filter((f) => /\.[jt]sx$/i.test(f)),
    typescript: files.filter((f) => /\.(tsx?|mts|cts)$/i.test(f) && !/\.d\.ts$/i.test(f)),
  };
}
