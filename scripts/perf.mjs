// How long onsystem takes and what it installs: the "Performance and footprint" table in
// docs/how-it-works.md.
//
//   node scripts/perf.mjs            measure, and print the table
//   node scripts/perf.mjs --write    measure, and write the table into docs/how-it-works.md
//
// Run `pnpm build` first, and `pnpm corpus fetch --only chatbot --only midday` (same --dir or
// CORPUS_DIR as here) for the two apps it checks. It measures on this machine, so the numbers
// change with it: the table names the machine, and each time is the median of --runs runs.
// Other work on the machine slows the runs: it prints the load average as it starts, and warns
// when the load is high or a run from the cache is slower than the run without it.
//
// - `check` with the built CLI on two corpus apps, as the corpus checks them: every file, with
//   the design system read again (--no-cache) and from the cache, then one file, which gives
//   the time per file after the first. The checkouts have no node_modules (nothing in them is
//   installed), so the types of the libraries their components wrap are not read: reading the
//   design system takes longer in a project with its dependencies installed.
// - The Claude Code hook (plugins/onsystem/hooks/check-ui.mjs) on one edit of the demo, which
//   has its dependencies installed: with the built CLI as the project's install, and through
//   npx with onsystem@<version> from npm, as the plugin runs it in a project without an install.
//   npx gets an npm cache of its own, filled by a first run that is not counted.
// - The MCP server (the built CLI) on midday's dashboard, over stdio: the `initialize` answer,
//   the first tool call, which waits for the design system to be read, then check_ui on the
//   app's largest file, search_components and get_component.
// - The package as npm has it (onsystem@<version>): its unpacked size and dependencies, an
//   install with npm into an empty folder (--ignore-scripts), and its provenance.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import * as prettier from 'prettier';

const ROOT = path.resolve(import.meta.dirname, '..');
const CLI = path.join(ROOT, 'dist', 'cli.js');
const HOOK = path.join(ROOT, 'plugins', 'onsystem', 'hooks', 'check-ui.mjs');
const DEMO = path.join(ROOT, 'examples', 'shadcn-demo');
const DEMO_FILE = 'app/settings/danger-zone.tsx';
const DOC = path.join(ROOT, 'docs', 'how-it-works.md');
/** The section the table is in: from its "Measured with" line to the next heading. */
const SECTION = '\n## Performance and footprint\n';
const MEASURED = '\nMeasured with onsystem ';
/** The corpus runs it checks, by name in corpus/repos.json. */
const APPS = ['chatbot', 'midday-dashboard'];
/** The run the MCP server is measured on. */
const SERVER_APP = 'midday-dashboard';

const { values } = parseArgs({
  options: {
    write: { type: 'boolean', default: false },
    runs: { type: 'string', default: '5' },
    dir: { type: 'string' },
  },
});
const RUNS = Number(values.runs);
const corpusDir = path.resolve(
  values.dir ?? process.env.CORPUS_DIR ?? path.join(os.tmpdir(), 'onsystem-corpus'),
);
const { version } = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
/** A folder for this run's npm cache, install and hook markers, removed at the end. */
let scratch;
const cores = os.cpus().length;
/** A 1-minute load average above this, half the cores, means other work competed for the CPU. */
const BUSY = cores / 2;
/** The highest 1-minute load average seen after a batch of timed runs. */
let peakLoad = 0;

try {
  if (!Number.isInteger(RUNS) || RUNS < 1) fail('--runs expects a whole number of 1 or more.');
  if (!fs.existsSync(CLI)) fail('dist/cli.js is missing: run `pnpm build` first.');
  const apps = corpusApps();
  scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'onsystem-perf-'));
  const machine = describeMachine();
  console.error(
    `Measuring onsystem ${version} on ${machine}, ${RUNS} ${RUNS === 1 ? 'run' : 'runs'} each${loadAverage()}.`,
  );
  const checks = apps.map(measureCheck);
  const hook = measureHook();
  const server = await measureServer(checks.find((c) => c.name === SERVER_APP));
  const pkg = measurePackage();
  if (peakLoad > BUSY) {
    warn(
      `the 1-minute load average reached ${peakLoad.toFixed(2)} on ${cores} cores while it measured: other work may have slowed these times. Run it again when the machine is idle.`,
    );
  }
  const table = render({ machine, checks, hook, server, pkg });
  console.log(table);
  if (values.write) {
    const doc = fs.readFileSync(DOC, 'utf8');
    const section = doc.indexOf(SECTION);
    const start = section === -1 ? -1 : doc.indexOf(MEASURED, section);
    const end = doc.indexOf('\n## ', start + 1);
    if (start === -1 || end === -1 || doc.indexOf('\n## ', section + 1) < start) {
      fail('docs/how-it-works.md has no "Measured with onsystem" paragraph under its heading.');
    }
    // Prettier lays the table out, as `pnpm format` would.
    const next = `${doc.slice(0, start + 1)}${table}${doc.slice(end)}`;
    const options = { ...(await prettier.resolveConfig(DOC)), filepath: DOC };
    fs.writeFileSync(DOC, await prettier.format(next, options));
    console.error('Wrote the table into docs/how-it-works.md.');
  }
} catch (error) {
  if (!(error instanceof Failure)) throw error;
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (scratch) fs.rmSync(scratch, { recursive: true, force: true });
}

/** The corpus runs it checks, each with its folder in the corpus checkouts. */
function corpusApps() {
  const repos = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'repos.json'), 'utf8')).repos;
  const runs = repos.flatMap((repo) => repo.runs.map((run) => ({ ...run, repo })));
  return APPS.map((name) => {
    const run = runs.find((r) => r.name === name);
    if (!run) fail(`corpus/repos.json has no run named ${name}.`);
    const cwd = path.join(corpusDir, run.repo.name, run.cwd);
    if (!fs.existsSync(cwd)) {
      fail(
        `${cwd} is missing: run \`pnpm corpus fetch --only ${run.repo.name}\` with the same --dir.`,
      );
    }
    return { ...run, folder: run.cwd, cwd };
  });
}

// ─── Measuring ─────────────────────────────────────────────────────────────────

/** `check` on every file the run checks, read again and from the cache, and on one file. */
function measureCheck(app) {
  const args = ['check', ...app.check, ...(app.args ?? []), '--format', 'json'];
  const all = run(process.execPath, [CLI, ...args], { cwd: app.cwd, codes: [0, 1] });
  const files = JSON.parse(all.stdout).map((r) => r.file);
  const one = files[0];
  const cold = median(times(() => cli([...args, '--no-cache'], app.cwd)));
  // The first run above wrote the cache: in node_modules/.cache/onsystem, or in the system temp
  // folder for a checkout without node_modules.
  const warm = median(times(() => cli(args, app.cwd)));
  if (warm > cold) {
    warn(
      `on ${app.name}, \`check\` from the cache (${seconds(warm)}) was slower than with --no-cache (${seconds(cold)}): other work on the machine may have slowed it. Run it again when the machine is idle.`,
    );
  }
  const single = median(times(() => cli(['check', one, '--format', 'json'], app.cwd)));
  const largest = files
    .map((file) => ({ file, size: fs.statSync(path.resolve(app.cwd, file)).size }))
    .sort((a, b) => b.size - a.size || a.file.localeCompare(b.file))[0].file;
  return {
    name: app.name,
    repo: app.repo,
    cwd: app.cwd,
    folder: app.folder,
    paths: app.check,
    files: files.length,
    cold,
    warm,
    single,
    perFile: (warm - single) / (files.length - 1),
    largest,
  };
}

/** One edit through the hook: with the project's install, then through npx. */
function measureHook() {
  const file = path.join(DEMO, DEMO_FILE);
  const payload = JSON.stringify({
    session_id: 'perf',
    hook_event_name: 'PostToolUse',
    tool_name: 'Write',
    tool_input: { file_path: file, content: fs.readFileSync(file, 'utf8') },
    cwd: DEMO,
  });
  const tmp = path.join(scratch, 'hook-tmp');
  fs.mkdirSync(tmp);
  const env = (extra) => ({ ...process.env, TMPDIR: tmp, TEMP: tmp, TMP: tmp, ...extra });
  const edit = (extra) =>
    run(process.execPath, [HOOK], { cwd: DEMO, input: payload, env: env(extra), codes: [2] });
  const installed = median(times(() => edit({ ONSYSTEM_BIN: CLI })));
  // npx installs onsystem@<version> from npm into a cache of its own; the first run fills it.
  const npxEnv = {
    npm_config_cache: path.join(scratch, 'npm-cache'),
    npm_config_ignore_scripts: 'true',
    npm_config_update_notifier: 'false',
  };
  const npx = run(process.execPath, [HOOK], {
    cwd: DEMO,
    input: payload,
    env: env(npxEnv),
    codes: [0, 2],
  });
  if (npx.status !== 2)
    fail(`the hook could not run onsystem@${version} through npx:\n${npx.stderr}`);
  const throughNpx = median(times(() => edit(npxEnv)));
  return { installed, npx: throughNpx, file: DEMO_FILE };
}

/** The MCP server on one app, over stdio, with check_ui on the largest file its check covers. */
async function measureServer(app) {
  const started = performance.now();
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [CLI, '--root', app.cwd, '--no-watch', '--no-cache'],
    stderr: 'pipe',
  });
  const client = new Client({ name: 'onsystem-perf', version: '1.0.0' });
  try {
    await client.connect(transport);
    const initialize = performance.now() - started;
    const list = await client.callTool({ name: 'list_components', arguments: {} });
    const firstCall = performance.now() - started;
    const components = list.structuredContent?.components ?? [];
    const call = async (name, args) => {
      const samples = [];
      for (let i = 0; i < Math.max(RUNS, 10); i++) {
        const t = performance.now();
        const result = await client.callTool({ name, arguments: args });
        samples.push(performance.now() - t);
        if (result.isError) fail(`${name} failed: ${JSON.stringify(result.content)}`);
      }
      sampleLoad();
      return median(samples);
    };
    const lines = fs.readFileSync(path.resolve(app.cwd, app.largest), 'utf8').split('\n').length;
    const checkUi = await call('check_ui', { path: app.largest });
    const search = await call('search_components', { query: 'confirm a destructive action' });
    const component = components.some((c) => c.name === 'Button') ? 'Button' : components[0]?.name;
    const getComponent = await call('get_component', { name: component });
    return {
      name: app.name,
      repo: app.repo,
      folder: app.folder,
      components: components.length,
      initialize,
      firstCall,
      checkUi,
      lines,
      search,
      getComponent,
      component,
    };
  } finally {
    await client.close();
  }
}

/** onsystem@<version> as npm has it, and installed with npm into an empty folder. */
function measurePackage() {
  const spec = `onsystem@${version}`;
  const npm = (args, cwd) =>
    run(process.execPath, [npmScript(), ...args], {
      cwd,
      env: {
        ...process.env,
        npm_config_cache: path.join(scratch, 'npm-cache'),
        npm_config_update_notifier: 'false',
      },
      codes: [0],
    });
  const view = JSON.parse(npm(['view', spec, 'dist', 'dependencies', '--json'], scratch).stdout);
  const project = path.join(scratch, 'install');
  fs.mkdirSync(project);
  fs.writeFileSync(path.join(project, 'package.json'), '{ "private": true }\n');
  npm(['install', spec, '--ignore-scripts', '--no-audit', '--no-fund'], project);
  const lock = JSON.parse(fs.readFileSync(path.join(project, 'package-lock.json'), 'utf8'));
  const packages = Object.keys(lock.packages).filter((key) => key.startsWith('node_modules/'));
  const modules = path.join(project, 'node_modules');
  const provenance = view.dist?.attestations?.provenance?.predicateType;
  return {
    spec,
    unpacked: view.dist?.unpackedSize,
    fileCount: view.dist?.fileCount,
    dependencies: Object.keys(view.dependencies ?? {}).length,
    packages: packages.length,
    size: folderSize(modules),
    typescript: folderSize(path.join(modules, 'typescript')),
    provenance,
  };
}

// ─── Output ────────────────────────────────────────────────────────────────────

function render({ machine, checks, hook, server, pkg }) {
  const date = new Date().toISOString().slice(0, 10);
  const app = (c) =>
    `[${c.repo.url.replace('https://github.com/', '')}](${c.repo.url}) \`${c.repo.sha.slice(0, 7)}\``;
  const where = (c) => (c.folder === '.' ? '' : `\`${c.folder}\`, `);
  const rows = [
    ...checks.map((c) => [
      `\`check\` on ${app(c)} (${c.paths.map((p) => `\`${path.posix.join(c.folder, p)}\``).join(' and ')}: ${c.files} files)`,
      `${seconds(c.warm)}, or ${seconds(c.cold)} with \`--no-cache\`. One file: ${ms(c.single)}, then ${ms(c.perFile)} for each other file`,
    ]),
    [
      `The Claude Code hook on one edit (the demo's \`${hook.file}\`), with onsystem installed in the project`,
      ms(hook.installed),
    ],
    [
      `The same edit through npx, as the plugin runs it in a project without an install (\`${pkg.spec}\` in npm's cache)`,
      ms(hook.npx),
    ],
    [
      `The MCP server on ${app(server)} (${where(server)}${server.components} components): \`initialize\` answered`,
      `${ms(server.initialize)} after it starts`,
    ],
    [
      'Its first tool call, which waits for the design system to be read (`--no-cache`)',
      `${seconds(server.firstCall)} after it starts`,
    ],
    [
      `\`check_ui\` on the app's largest file (${server.lines.toLocaleString('en-US')} lines)`,
      ms(server.checkUi),
    ],
    [
      `\`search_components\`, \`get_component\` (\`${server.component}\`)`,
      `${ms(server.search)}, ${ms(server.getComponent)}`,
    ],
    [
      `The package (\`${pkg.spec}\` on npm)`,
      `${megabytes(pkg.unpacked)} unpacked, ${pkg.fileCount} files, ${pkg.dependencies} dependencies`,
    ],
    [
      'Installed with npm into an empty project',
      `${pkg.packages} packages, ${megabytes(pkg.size)} on disk (${megabytes(pkg.typescript)} of it TypeScript, which reads the components)`,
    ],
    [
      'Provenance',
      pkg.provenance
        ? `Signed npm provenance (${pkg.provenance.replace(/^https:\/\//, '')}): npm shows the workflow run and commit each release was built from`
        : 'None on npm',
    ],
  ];
  return [
    `Measured with onsystem ${version} on ${machine}, on ${date}, with \`node scripts/perf.mjs\`: each time is the median of ${RUNS} ${RUNS === 1 ? 'run' : 'runs'}. The corpus checkouts have no \`node_modules\`, so the types of the libraries their components wrap are not read: in a project with its dependencies installed, reading the design system takes longer. The demo, where the hook is measured, has its dependencies installed.`,
    '',
    table(['Measured', 'Result'], rows),
    '',
  ].join('\n');
}

function table(header, rows) {
  const line = (cells) => `| ${cells.join(' | ')} |`;
  return [line(header), line(header.map(() => '---')), ...rows.map(line)].join('\n');
}

function ms(value) {
  if (value >= 1000) return seconds(value);
  return value < 10 ? `${value.toFixed(1)} ms` : `${Math.round(value)} ms`;
}

function seconds(value) {
  return `${(value / 1000).toFixed(2)} s`;
}

function megabytes(bytes) {
  return `${(bytes / 1e6).toFixed(1)} MB`;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function describeMachine() {
  const cpus = os.cpus();
  const model = (cpus[0]?.model ?? 'unknown CPU').trim();
  const memory = Math.round(os.totalmem() / 2 ** 30);
  const system =
    process.platform === 'darwin'
      ? `macOS ${spawnSync('sw_vers', ['-productVersion'], { encoding: 'utf8' }).stdout.trim()}`
      : `${os.type()} ${os.release()}`;
  return `${model} (${cpus.length} cores, ${memory} GB), ${system}, Node.js ${process.versions.node}`;
}

function cli(args, cwd) {
  run(process.execPath, [CLI, ...args], { cwd, codes: [0, 1] });
}

/** The wall time of `fn`, one untimed run first, then RUNS timed ones. */
function times(fn) {
  fn();
  const samples = [];
  for (let i = 0; i < RUNS; i++) {
    const t = performance.now();
    fn();
    samples.push(performance.now() - t);
  }
  sampleLoad();
  return samples;
}

/** `, load average 1.52 1.80 2.01` (1, 5 and 15 minutes), or '' on Windows, which has none. */
function loadAverage() {
  if (process.platform === 'win32') return '';
  sampleLoad();
  return `, load average ${os
    .loadavg()
    .map((n) => n.toFixed(2))
    .join(' ')}`;
}

/** Keeps the highest 1-minute load average, read after each batch of timed runs. */
function sampleLoad() {
  peakLoad = Math.max(peakLoad, os.loadavg()[0]);
}

/** A warning on stderr, which the table on stdout and the doc it writes do not carry. */
function warn(text) {
  console.error(`Warning: ${text}`);
}

function median(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function run(command, args, { cwd, input, env, codes }) {
  const result = spawnSync(command, args, {
    cwd,
    input,
    env: env ?? process.env,
    encoding: 'utf8',
    maxBuffer: 256 * 2 ** 20,
    shell: false,
  });
  if (result.error) fail(`${command} ${args.join(' ')}: ${result.error.message}`);
  if (!codes.includes(result.status)) {
    fail(`${path.basename(command)} ${args.join(' ')} exited ${result.status}\n${result.stderr}`);
  }
  return result;
}

/** npm's CLI script, run with this Node, as the hook runs npx: no shell, on Windows too. */
function npmScript() {
  const dir = path.dirname(process.execPath);
  const script = [
    path.join(dir, 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    path.join(dir, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
  ].find((f) => fs.existsSync(f));
  if (!script) fail('npm was not found next to this Node.js.');
  return script;
}

function folderSize(dir) {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) total += folderSize(file);
    else if (entry.isFile()) total += fs.statSync(file).size;
  }
  return total;
}

/** An error that ends the run with its message alone. */
class Failure extends Error {}

function fail(message) {
  throw new Failure(message);
}
