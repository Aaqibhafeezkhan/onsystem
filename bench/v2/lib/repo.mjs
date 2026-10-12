// Repositories for bench/v2: fetched at the commit corpus/repos.json pins, installed once with
// lifecycle scripts off, checked once (the onsystem baseline and the tsc controls), then copied
// for each run. A run's copy shares the prepared node_modules through symlinks, so it costs the
// sources' size, not the dependencies'.
//
// The repositories are untrusted. Nothing in them runs: installs pass --ignore-scripts, the
// agent has file tools and no shell, tsc only type-checks, and onsystem refuses a config written
// in code. Child processes get a minimal environment, never the API keys.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

import { exec } from './agent.mjs';
import { minimalEnv } from './mcp.mjs';
import {
  classify,
  configErrors,
  diagnosticsIn,
  diffManifests,
  parseTscOutput,
  scopeTsconfig,
  summarizeCheck,
} from './score.ts';

const require = createRequire(import.meta.url);

/** What the CLI reads plus what an install needs; the same as scripts/corpus.mjs fetches. */
const EXTENSIONS = [
  'tsx',
  'ts',
  'jsx',
  'js',
  'mjs',
  'cjs',
  'mts',
  'cts',
  'json',
  'css',
  'md',
  'mdx',
];
const MANIFESTS = [
  'package.json',
  'tsconfig*.json',
  'jsconfig*.json',
  'components.json',
  '.gitignore',
];
const SKIP = new Set(['node_modules', '.git']);
export const SCOPE_TSCONFIG = 'tsconfig.onsystem-bench.json';
const CONTROL_FILE = '__onsystem_bench_control__.tsx';

/**
 * @typedef {{ name: string, corpus: string, project: string, install: string[], designSystem: string,
 *   control: { import: string, component: string, valid: string, invalid: string },
 *   reference: string[], tscPaths?: Record<string, string[]>,
 *   url: string, sha: string, paths?: string[] }} Repo
 */

/** bench/v2/config/repos.json joined with the URL, commit and folders corpus/repos.json pins. */
export function loadRepos(benchConfig, corpusConfig) {
  return benchConfig.repos.map((repo) => {
    const pinned = corpusConfig.repos.find((r) => r.name === repo.corpus);
    if (!pinned)
      throw new Error(`${repo.name}: corpus/repos.json has no repository named ${repo.corpus}.`);
    return { ...repo, url: pinned.url, sha: pinned.sha, paths: pinned.paths };
  });
}

export function repoDirs(work, name) {
  const base = path.join(work, 'repos', name);
  return {
    base,
    src: path.join(base, 'src'),
    meta: path.join(base, 'meta.json'),
    baseline: path.join(base, 'onsystem.baseline.json'),
    manifest: path.join(base, 'manifest.json'),
  };
}

/**
 * Fetches, installs and checks one repository; idempotent (a finished step is not redone).
 * @param {Repo} repo
 * @param {{ work: string, cli: string, log: (line: string) => void, force?: boolean }} options
 */
export async function prepareRepo(repo, { work, cli, log, force = false }) {
  const dirs = repoDirs(work, repo.name);
  const want = JSON.stringify({
    url: repo.url,
    sha: repo.sha,
    paths: repo.paths ?? null,
    install: repo.install,
  });
  const stamp = path.join(dirs.base, 'stamp.json');
  if (force || !fs.existsSync(stamp) || fs.readFileSync(stamp, 'utf8') !== want) {
    fs.rmSync(dirs.base, { recursive: true, force: true });
    fs.mkdirSync(dirs.src, { recursive: true });
    log(`${repo.name}: fetching ${repo.url} at ${repo.sha.slice(0, 7)}`);
    await git(dirs.src, ['init', '--quiet']);
    await git(dirs.src, ['remote', 'add', 'origin', repo.url]);
    await git(
      dirs.src,
      ['sparse-checkout', 'set', '--no-cone', '--stdin'],
      `${sparsePatterns(repo.paths).join('\n')}\n`,
    );
    await git(dirs.src, [
      'fetch',
      '--quiet',
      '--depth=1',
      '--filter=blob:none',
      '--no-tags',
      'origin',
      repo.sha,
    ]);
    await git(dirs.src, ['checkout', '--quiet', '--detach', 'FETCH_HEAD']);
    log(`${repo.name}: ${repo.install.join(' ')}`);
    const [command, ...args] = repo.install;
    const install = await exec(/** @type {string} */ (command), args, {
      cwd: dirs.src,
      env: { ...installEnv(), CI: '1' },
      timeoutMs: 30 * 60_000,
    });
    if (install.status !== 0) {
      throw new Error(
        `${repo.name}: the install failed (exit ${install.status}):\n${tail(install.stderr || install.stdout)}`,
      );
    }
    fs.writeFileSync(stamp, want);
  }

  const project = path.join(dirs.src, repo.project);
  log(`${repo.name}: recording the onsystem baseline`);
  const baseline = await exec(
    process.execPath,
    [cli, 'check', '.', '--update-baseline', '--baseline', dirs.baseline, '--no-cache'],
    { cwd: project, env: minimalEnv(), timeoutMs: 10 * 60_000 },
  );
  if (baseline.status !== 0)
    throw new Error(
      `${repo.name}: onsystem check --update-baseline failed:\n${tail(baseline.stderr)}`,
    );
  const inspect = await exec(process.execPath, [cli, 'inspect'], {
    cwd: project,
    env: minimalEnv(),
  });

  log(`${repo.name}: checking that tsc and onsystem score the controls as expected`);
  const controls = await runControls(repo, project, { cli, baseline: dirs.baseline });
  fs.writeFileSync(dirs.manifest, JSON.stringify(manifest(dirs.src)));
  const meta = {
    name: repo.name,
    url: repo.url,
    sha: repo.sha,
    preparedAt: new Date().toISOString(),
    typescript: typescriptVersion(project),
    inspect: inspect.stdout.split('\n').slice(0, 8).join('\n'),
    controls,
  };
  fs.writeFileSync(dirs.meta, JSON.stringify(meta, null, 2));
  return meta;
}

/**
 * The scorers' calibration, per repository: existing files and a correct use of a design-system
 * component must type-check and pass onsystem; the same component with an invented variant must
 * fail both. A repository that fails this cannot be scored and stops the run.
 */
async function runControls(repo, project, { cli, baseline }) {
  const control = path.join(project, CONTROL_FILE);
  const source = (jsx) =>
    `${repo.control.import}\n\nexport function OnsystemBenchControl() {\n  return ${jsx};\n}\n`;
  const results = {};
  try {
    for (const kind of /** @type {const} */ (['valid', 'invalid'])) {
      fs.writeFileSync(control, source(repo.control[kind]));
      const tsc = await typecheck(project, [CONTROL_FILE], repo.tscPaths);
      const check = await onsystemCheck(cli, project, [CONTROL_FILE], baseline);
      results[kind] = {
        tscErrors: tsc.errors.length,
        tscFirst: tsc.errors[0]?.message ?? null,
        onsystemErrors: check.errors,
        rules: check.byRule,
      };
    }
  } finally {
    fs.rmSync(control, { force: true });
  }
  const reference = await typecheck(project, repo.reference, repo.tscPaths);
  results.reference = {
    files: repo.reference,
    tscErrors: reference.errors.length,
    first: reference.errors[0] ?? null,
  };
  const problems = [];
  if (results.valid.tscErrors)
    problems.push(
      `the valid control has ${results.valid.tscErrors} tsc error(s): ${results.valid.tscFirst}`,
    );
  if (results.valid.onsystemErrors)
    problems.push(`the valid control has onsystem errors: ${JSON.stringify(results.valid.rules)}`);
  if (!results.invalid.tscErrors) problems.push('tsc does not catch the invented variant');
  if (!results.invalid.onsystemErrors)
    problems.push('onsystem does not catch the invented variant');
  if (results.reference.tscErrors)
    problems.push(`existing files have tsc errors: ${JSON.stringify(results.reference.first)}`);
  if (problems.length)
    throw new Error(`${repo.name}: the scorers cannot be trusted here: ${problems.join('; ')}.`);
  return results;
}

/** Sparse-checkout patterns: root files, every manifest, and the sources of the listed folders. */
export function sparsePatterns(folders) {
  const patterns = ['/*', '!/*/', ...MANIFESTS.map((name) => `/**/${name}`)];
  for (const folder of folders ?? ['']) {
    const base = folder ? `/${folder.replace(/^\/+|\/+$/g, '')}` : '';
    for (const ext of EXTENSIONS) patterns.push(`${base}/**/*.${ext}`);
  }
  return [...patterns, '!/**/.env*'];
}

/** The install's environment: the user's, without the benchmark's API keys. */
function installEnv() {
  const keys = new Set(['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'GEMINI_API_KEY']);
  return /** @type {Record<string, string>} */ (
    Object.fromEntries(Object.entries(process.env).filter(([name]) => !keys.has(name)))
  );
}

async function git(cwd, args, input) {
  const result = await exec('git', ['-c', 'core.hooksPath=/dev/null', ...args], {
    cwd,
    input,
    env: { ...installEnv(), GIT_LFS_SKIP_SMUDGE: '1', GIT_TERMINAL_PROMPT: '0' },
    timeoutMs: 10 * 60_000,
  });
  if (result.status !== 0)
    throw new Error(`git ${args.join(' ')} failed in ${cwd}:\n${tail(result.stderr)}`);
  return result.stdout;
}

function tail(text, lines = 20) {
  return text.trim().split('\n').slice(-lines).join('\n');
}

// ─── Per-run workspaces ───────────────────────────────────────────────────────

/** Path → sha1 of every file outside node_modules and .git. */
export function manifest(root) {
  /** @type {Record<string, { size: number, mtimeMs: number, hash: string }>} */
  const out = {};
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (SKIP.has(e.name)) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.isFile()) {
        const data = fs.readFileSync(full);
        const stat = fs.statSync(full);
        out[path.relative(root, full).split(path.sep).join('/')] = {
          size: stat.size,
          mtimeMs: stat.mtimeMs,
          hash: createHash('sha1').update(data).digest('hex'),
        };
      }
    }
  };
  walk(root);
  return out;
}

/**
 * Copies the prepared sources to `dest` and mirrors every node_modules folder one level deep:
 * a link to a workspace package keeps its relative target, so it resolves to the run's own copy
 * of that package (and tools report paths inside the run); everything else links to the
 * prepared install, so a run copies sources only.
 */
export function createWorkspace(src, dest) {
  fs.rmSync(dest, { recursive: true, force: true });
  const folders = [];
  fs.cpSync(src, dest, {
    recursive: true,
    // Keep in-repository symlinks relative, pointing inside the copy.
    verbatimSymlinks: true,
    filter: (from) => {
      const name = path.basename(from);
      if (name === '.git') return false;
      if (name === 'node_modules') {
        folders.push(from);
        return false;
      }
      return true;
    },
  });
  for (const from of folders) mirrorModules(src, from, path.join(dest, path.relative(src, from)));
}

function mirrorModules(src, from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name);
    const target = path.join(to, entry.name);
    if (entry.name.startsWith('@') && entry.isDirectory()) {
      mirrorModules(src, source, target);
      continue;
    }
    if (entry.isSymbolicLink()) {
      const link = fs.readlinkSync(source);
      const resolved = path.resolve(path.dirname(source), link);
      const inside = path.relative(src, resolved);
      const workspacePackage =
        !path.isAbsolute(link) &&
        !inside.startsWith('..') &&
        !inside.split(path.sep).includes('node_modules');
      fs.symlinkSync(workspacePackage ? link : resolved, target, 'junction');
      continue;
    }
    fs.symlinkSync(source, target, 'junction');
  }
}

/** The files a run added, changed or deleted, against the prepared manifest. */
export function workspaceChanges(dest, before) {
  return diffManifests(before, manifest(dest));
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

/** `tsc` on `files` (relative to the project) in the project's own setup; only their diagnostics count. */
export async function typecheck(project, files, extraPaths) {
  if (!files.length) return { errors: [], ran: false };
  const tsconfig = readTsconfig(path.join(project, 'tsconfig.json'));
  const scope = scopeTsconfig({
    extends: './tsconfig.json',
    files,
    basePaths: tsconfig?.compilerOptions?.paths,
    extraPaths,
  });
  const file = path.join(project, SCOPE_TSCONFIG);
  fs.writeFileSync(file, JSON.stringify(scope, null, 2));
  try {
    const tsc = tscBin(project);
    const result = await exec(process.execPath, [tsc, '-p', SCOPE_TSCONFIG, '--pretty', 'false'], {
      cwd: project,
      env: minimalEnv(),
      timeoutMs: 10 * 60_000,
    });
    const all = parseTscOutput(result.stdout);
    const broken = configErrors(all);
    if (broken.length || (result.status !== 0 && result.status !== 1 && result.status !== 2)) {
      throw new Error(
        `tsc could not check ${files.join(', ')}: ${broken[0]?.message ?? tail(result.stderr || result.stdout, 5)}`,
      );
    }
    return { errors: diagnosticsIn(all, files), ran: true };
  } finally {
    fs.rmSync(file, { force: true });
  }
}

/** `onsystem check` on `files` (relative to the project) against the prepared baseline. */
export async function onsystemCheck(cli, project, files, baseline) {
  if (!files.length) return { errors: 0, warnings: 0, byRule: {}, findings: [] };
  const result = await exec(
    process.execPath,
    [cli, 'check', ...files, '--format', 'json', '--no-cache', '--baseline', baseline],
    { cwd: project, env: minimalEnv(), timeoutMs: 5 * 60_000 },
  );
  if (result.status !== 0 && result.status !== 1)
    throw new Error(`onsystem check failed (exit ${result.status}): ${tail(result.stderr, 5)}`);
  return summarizeCheck(JSON.parse(result.stdout || '[]'));
}

/** Scores one finished run: what it changed, whether the file exists, tsc and onsystem on it. */
export async function scoreWorkspace({ repo, task, dest, before, cli, baseline }) {
  const changes = workspaceChanges(dest, before);
  const touched = [...changes.added, ...changes.modified];
  const projectPrefix = repo.project === '.' ? '' : `${repo.project.replace(/\/+$/, '')}/`;
  const inProject = touched
    .filter((f) => f.startsWith(projectPrefix))
    .map((f) => f.slice(projectPrefix.length));
  const { ui, typescript } = classify(inProject);
  const created = fs.existsSync(path.join(dest, task.file));
  let tsc = { errors: /** @type {import('./score.ts').TscDiagnostic[]} */ ([]), ran: false };
  if (created || typescript.length) {
    try {
      tsc = await typecheck(path.join(dest, repo.project), typescript, repo.tscPaths);
    } catch (error) {
      // tsc could not run. When the run changed a manifest or a tsconfig, that is the run's
      // doing and counts as a failure; otherwise the harness is at fault and the run is an error.
      if (!touched.some((f) => /(^|\/)(package\.json|tsconfig[^/]*\.json)$/.test(f))) throw error;
      const message = error instanceof Error ? error.message : String(error);
      tsc = { errors: [{ file: '', line: 0, column: 0, code: 'config', message }], ran: true };
    }
  }
  const check = await onsystemCheck(cli, path.join(dest, repo.project), ui, baseline);
  return {
    changes,
    created,
    outOfScope: [...touched, ...changes.deleted].filter((f) => f !== task.file).length,
    tsc: { ran: tsc.ran, pass: created ? tsc.errors.length === 0 : false, errors: tsc.errors },
    onsystem: check,
  };
}

function readTsconfig(file) {
  const ts = require('typescript');
  const { config } = ts.readConfigFile(file, ts.sys.readFile);
  return config;
}

function tscBin(project) {
  const manifestPath = require.resolve('typescript/package.json', { paths: [project] });
  const pkg = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.tsc;
  if (!bin) throw new Error(`${manifestPath} has no tsc bin.`);
  return path.join(path.dirname(manifestPath), bin);
}

function typescriptVersion(project) {
  try {
    return JSON.parse(
      fs.readFileSync(require.resolve('typescript/package.json', { paths: [project] }), 'utf8'),
    ).version;
  } catch {
    return null;
  }
}
