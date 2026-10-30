import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import module from 'node:module';
import os from 'node:os';
import path from 'node:path';

import ts from 'typescript';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { main, type Io } from '../src/cli.js';
import { loadConfig } from '../src/config.js';
import { codeStampOf, detectProject, type DetectionStep } from '../src/detect.js';
import { untrustedFolder } from '../src/util/own-folder.js';
import { fixture } from './helpers.js';

// Each edit an agent makes runs `check` through the Claude Code hook in a new process. Three
// things it used to do again on every edit: start npm (npx), compile the CLI and TypeScript, and
// follow the design-system package's barrels to its components, parsing each file.

const REPO = path.resolve(import.meta.dirname, '..');
const HOOK = path.join(REPO, 'plugins/onsystem/hooks/check-ui.mjs');
const { version: VERSION } = JSON.parse(
  fs.readFileSync(path.join(REPO, 'package.json'), 'utf8'),
) as { version: string };
const posix = process.platform !== 'win32';
const user = process.getuid ? `-${String(process.getuid())}` : '';

const json = (value: unknown) => JSON.stringify(value, null, 2);
const component = (name: string) =>
  `export function ${name}(props: { tone?: "calm" | "loud" }) {\n  return <div data-tone={props.tone} />;\n}\n`;

/** An npm monorepo whose app uses a design-system package that exports its components from a barrel. */
const MONOREPO = {
  'package.json': json({ name: 'mono', private: true, workspaces: ['apps/*', 'packages/*'] }),
  'apps/web/package.json': json({ name: 'web', dependencies: { '@acme/ui': '*' } }),
  'apps/web/app/page.tsx': 'export default function Page() {\n  return null;\n}\n',
  'packages/ui/package.json': json({ name: '@acme/ui', exports: { '.': './src/index.ts' } }),
  'packages/ui/src/index.ts':
    "export * from './button';\nexport * from './card';\nexport * from './badge';\n",
  'packages/ui/src/button.tsx': component('Button'),
  'packages/ui/src/card.tsx': component('Card'),
  'packages/ui/src/badge.tsx': component('Badge'),
};

/** Dates every file and folder under `dir` a minute back: files that have not changed for a while. */
function settle(dir: string): void {
  const past = new Date(Date.now() - 60_000);
  for (const entry of fs.readdirSync(dir, { recursive: true, withFileTypes: true })) {
    fs.utimesSync(path.join(entry.parentPath, entry.name), past, past);
  }
}

/** Runs the CLI in this process, from `cwd`. */
async function cli(args: string[], cwd: string) {
  const out: string[] = [];
  const io: Io = { cwd, color: false, stdout: (t) => out.push(t), stderr: () => {} };
  const code = await main(args, io);
  return { code, stdout: out.join('\n') };
}

describe('detection kept on disk', () => {
  // The system temp folder, as os.tmpdir() reads it: TMPDIR, or TEMP and TMP on Windows.
  const TEMP_VARS = ['TMPDIR', 'TEMP', 'TMP'];
  let temp: string;
  let saved: (string | undefined)[] = [];
  beforeEach(() => {
    saved = TEMP_VARS.map((name) => process.env[name]);
    temp = fs.mkdtempSync(path.join(os.tmpdir(), 'onsystem-detect-test-'));
    for (const name of TEMP_VARS) process.env[name] = temp;
  });
  afterEach(() => {
    TEMP_VARS.forEach((name, i) => {
      const value = saved[i];
      if (value === undefined) Reflect.deleteProperty(process.env, name);
      else process.env[name] = value;
    });
    fs.rmSync(temp, { recursive: true, force: true });
  });

  const folder = () => path.join(temp, `onsystem${user}`);
  /** The detections kept in the user's temp folder (the fixtures are in it too). */
  function kept(): string[] {
    if (!fs.existsSync(folder())) return [];
    return fs
      .readdirSync(folder())
      .filter((name) => name.endsWith('.detection.json'))
      .map((name) => path.join(folder(), name));
  }
  /** Marks the one kept detection, so that a detection read from it shows. */
  function mark(): void {
    const [file, ...more] = kept();
    expect(more).toEqual([]);
    const data = JSON.parse(fs.readFileSync(file ?? '', 'utf8')) as { detection: object };
    data.detection = { ...data.detection, source: 'KEPT' };
    fs.writeFileSync(file ?? '', JSON.stringify(data));
  }
  const files = (web: string) =>
    detectProject(web)
      ?.components.map((c) => path.basename(c))
      .sort();

  it("reads a design system found in a package's exports from disk while nothing it read changes", () => {
    const root = fixture(MONOREPO);
    const web = path.join(root, 'apps/web');
    settle(root);
    const first = detectProject(web);
    expect(first?.source).toBe('workspace package @acme/ui');
    expect(first?.components.map((c) => path.basename(c)).sort()).toEqual([
      'badge.tsx',
      'button.tsx',
      'card.tsx',
    ]);
    mark();
    expect(detectProject(web)?.source).toBe('KEPT');
    // The agent's edits to the app do not change what was read.
    fs.writeFileSync(path.join(web, 'app/page.tsx'), 'export default function Page() {}\n');
    fs.writeFileSync(path.join(web, 'app/new.tsx'), 'export default function New() {}\n');
    expect(detectProject(web)?.source).toBe('KEPT');
    // inspect --explain traces every candidate again.
    const steps: DetectionStep[] = [];
    expect(detectProject(web, undefined, steps)?.source).toBe('workspace package @acme/ui');
    expect(steps.some((s) => s.candidate === 'workspace package @acme/ui' && s.accepted)).toBe(
      true,
    );
  });

  it('detects again when a file in the package changes, and keeps that once it settles', () => {
    const root = fixture(MONOREPO);
    const web = path.join(root, 'apps/web');
    settle(root);
    detectProject(web);
    mark();
    // A new component exported from the barrel.
    fs.writeFileSync(path.join(root, 'packages/ui/src/dialog.tsx'), component('Dialog'));
    fs.appendFileSync(path.join(root, 'packages/ui/src/index.ts'), "export * from './dialog';\n");
    expect(files(web)).toEqual(['badge.tsx', 'button.tsx', 'card.tsx', 'dialog.tsx']);
    expect(detectProject(web)?.source).toBe('workspace package @acme/ui');
    settle(root);
    expect(files(web)).toEqual(['badge.tsx', 'button.tsx', 'card.tsx', 'dialog.tsx']);
    mark();
    expect(detectProject(web)?.source).toBe('KEPT');
    // A file rewritten at the same size.
    const card = path.join(root, 'packages/ui/src/card.tsx');
    fs.writeFileSync(card, fs.readFileSync(card, 'utf8').replace('calm', 'cool'));
    expect(detectProject(web)?.source).toBe('workspace package @acme/ui');
    // A barrel removed.
    settle(root);
    detectProject(web);
    mark();
    fs.writeFileSync(path.join(root, 'packages/ui/src/index.ts'), "export * from './button';\n");
    expect(detectProject(web)).toBeUndefined();
  });

  it("detects again when the app's package.json or components.json changes, or a dependency appears", () => {
    const root = fixture({
      ...MONOREPO,
      'apps/web/package.json': json({
        name: 'web',
        dependencies: { '@acme/ui': '*', '@acme/design-system': '*' },
      }),
    });
    const web = path.join(root, 'apps/web');
    settle(root);
    expect(detectProject(web)?.source).toBe('workspace package @acme/ui');
    mark();
    // @acme/design-system, not in the workspace before, now is.
    fs.mkdirSync(path.join(root, 'packages/design-system/src'), { recursive: true });
    fs.writeFileSync(
      path.join(root, 'packages/design-system/package.json'),
      json({ name: '@acme/design-system', exports: { './*': './src/*.tsx' } }),
    );
    for (const name of ['Alert', 'Tabs', 'Toast']) {
      fs.writeFileSync(
        path.join(root, `packages/design-system/src/${name.toLowerCase()}.tsx`),
        component(name),
      );
    }
    expect(detectProject(web)?.designSystems?.map((d) => d.source)).toEqual([
      'workspace package @acme/ui',
      'workspace package @acme/design-system',
    ]);

    for (const file of kept()) fs.rmSync(file);
    const app = fixture(MONOREPO);
    const other = path.join(app, 'apps/web');
    settle(app);
    detectProject(other);
    mark();
    fs.writeFileSync(path.join(other, 'components.json'), json({ aliases: {} }));
    expect(detectProject(other)?.source).toBe('workspace package @acme/ui');
    fs.rmSync(path.join(other, 'components.json'));
    fs.writeFileSync(path.join(other, 'package.json'), json({ name: 'web' }));
    expect(detectProject(other)).toBeUndefined();
  });

  it("keeps nothing whose files just changed, or that read the app's own code", () => {
    // Written within the same tick of the file system's clock, a change can keep its mtime.
    const fresh = fixture(MONOREPO);
    expect(detectProject(path.join(fresh, 'apps/web'))?.source).toBe('workspace package @acme/ui');
    expect(kept()).toEqual([]);
    // A package without exports is read from the paths the app imports.
    const byPath = fixture({
      ...MONOREPO,
      'packages/ui/package.json': json({ name: '@acme/ui' }),
      'apps/web/app/page.tsx':
        'import { Button } from "@acme/ui/src/button";\n\nexport default function Page() {\n  return <Button />;\n}\n',
    });
    settle(byPath);
    expect(detectProject(path.join(byPath, 'apps/web'))?.source).toBe(
      'workspace package @acme/ui, imported by path',
    );
    expect(kept()).toEqual([]);
  });

  it('keeps it in node_modules when the app has one', () => {
    const root = fixture({ ...MONOREPO, 'apps/web/node_modules/.keep': '' });
    const web = path.join(root, 'apps/web');
    settle(root);
    detectProject(web);
    expect(kept()).toEqual([]);
    const file = path.join(web, 'node_modules/.cache/onsystem/detection.json');
    expect(
      (JSON.parse(fs.readFileSync(file, 'utf8')) as { detection: { source: string } }).detection
        .source,
    ).toBe('workspace package @acme/ui');
  });

  it.runIf(posix)('is neither read from nor kept in a temp folder other users can write to', () => {
    const root = fixture(MONOREPO);
    const web = path.join(root, 'apps/web');
    settle(root);
    detectProject(web);
    mark();
    const [file = ''] = kept();
    const marked = fs.readFileSync(file, 'utf8');
    fs.chmodSync(folder(), 0o777);
    expect(detectProject(web)?.source).toBe('workspace package @acme/ui');
    expect(detectProject(web)?.source).toBe('workspace package @acme/ui');
    // Refused, not closed and trusted: a file put in it before would stay.
    expect(fs.statSync(folder()).mode & 0o777).toBe(0o777);
    expect(fs.readFileSync(file, 'utf8')).toBe(marked);
    fs.chmodSync(folder(), 0o700);
    expect(detectProject(web)?.source).toBe('KEPT');
  });

  it('is neither read nor kept with --no-cache', async () => {
    const root = fixture(MONOREPO);
    const web = path.join(root, 'apps/web');
    settle(root);
    detectProject(web);
    mark();
    const [file = ''] = kept();
    const marked = fs.readFileSync(file, 'utf8');
    expect((await loadConfig({ root: web })).detected).toBe('KEPT');
    expect((await loadConfig({ root: web, cache: false })).detected).toBe(
      'workspace package @acme/ui',
    );
    // From the CLI, as scripts/corpus.mjs and scripts/perf.mjs run it.
    expect((await cli(['inspect'], web)).stdout).toContain('detected KEPT');
    const fresh = await cli(['inspect', '--no-cache'], web);
    expect(fresh.stdout).toContain('detected workspace package @acme/ui');
    expect(fresh.stdout).not.toContain('KEPT');
    expect(fs.readFileSync(file, 'utf8')).toBe(marked);
  });

  it('is not read by another build of onsystem', () => {
    const root = fixture(MONOREPO);
    const web = path.join(root, 'apps/web');
    settle(root);
    detectProject(web);
    mark();
    const [file = ''] = kept();
    const data = JSON.parse(fs.readFileSync(file, 'utf8')) as { key: string };
    // The key holds a stamp of the code running, here every file in src/.
    const key = JSON.parse(data.key) as unknown[];
    expect(key[1]).toBe(codeStampOf(path.join(REPO, 'src')));
    key[1] = 'another build';
    fs.writeFileSync(file, JSON.stringify({ ...data, key: JSON.stringify(key) }));
    expect(detectProject(web)?.source).toBe('workspace package @acme/ui');

    // The stamp changes with any file of the build, not only with the module's own.
    const build = fixture({ 'detect.js': 'a', 'chunks/package-source.js': 'b' });
    const before = codeStampOf(build);
    fs.writeFileSync(path.join(build, 'chunks/package-source.js'), 'c');
    expect(codeStampOf(build)).not.toBe(before);
  });

  it('is not kept while a folder it read just changed', () => {
    // A file removed while detection ran would be in the detection but not in the stamp taken
    // after it, with every file left in the stamp older than SETTLED_MS: the mtime of its folder,
    // which a removal changes, holds it back.
    const root = fixture({ ...MONOREPO, 'packages/ui/src/notes.md': 'Old notes.\n' });
    const web = path.join(root, 'apps/web');
    settle(root);
    fs.rmSync(path.join(root, 'packages/ui/src/notes.md'));
    expect(files(web)).toEqual(['badge.tsx', 'button.tsx', 'card.tsx']);
    expect(kept()).toEqual([]);
    settle(root);
    expect(files(web)).toEqual(['badge.tsx', 'button.tsx', 'card.tsx']);
    expect(kept()).toHaveLength(1);
  });

  it('remembers a package with too many files to watch, and does not walk it on each run', () => {
    const many: Record<string, string> = {};
    for (let i = 0; i <= 5000; i++) many[`packages/ui/assets/icon-${String(i)}.svg`] = '';
    const root = fixture({ ...MONOREPO, ...many });
    const web = path.join(root, 'apps/web');
    settle(root);
    expect(detectProject(web)?.source).toBe('workspace package @acme/ui');
    const [file = ''] = kept();
    const { crowded } = JSON.parse(fs.readFileSync(file, 'utf8')) as {
      crowded: { dirs: string[] };
    };
    expect(crowded.dirs.map((d) => fs.realpathSync(d))).toEqual([
      fs.realpathSync(path.join(root, 'packages/ui')),
    ]);
    // Read, and not written again.
    const { ino, mtimeMs } = fs.statSync(file);
    expect(detectProject(web)?.source).toBe('workspace package @acme/ui');
    expect(fs.statSync(file)).toMatchObject({ ino, mtimeMs });
    // Until the package's folder changes.
    fs.rmSync(path.join(root, 'packages/ui/assets'), { recursive: true });
    settle(root);
    expect(detectProject(web)?.source).toBe('workspace package @acme/ui');
    mark();
    expect(detectProject(web)?.source).toBe('KEPT');
  });
});

describe("the user's own temp folder on Windows", () => {
  // Windows has no owner to check: the folder counts as the user's inside their home folder.
  let temp: string;
  const saved = { HOME: process.env.HOME, TMPDIR: process.env.TMPDIR };
  const platform = Object.getOwnPropertyDescriptor(process, 'platform');
  beforeEach(() => {
    temp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'onsystem-windows-test-')));
    Object.defineProperty(process, 'platform', { value: 'win32' });
  });
  afterEach(() => {
    if (platform) Object.defineProperty(process, 'platform', platform);
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) Reflect.deleteProperty(process.env, name);
      else process.env[name] = value;
    }
    fs.rmSync(temp, { recursive: true, force: true });
  });

  it.runIf(posix)('is trusted only inside the home folder', () => {
    // os.homedir() reads HOME on Linux and macOS.
    const dir = path.join(temp, 'Temp', 'onsystem');
    process.env.HOME = path.join(temp, 'elsewhere');
    fs.mkdirSync(process.env.HOME);
    expect(untrustedFolder(dir, true)).toBe(`${dir} is outside your home folder`);
    process.env.HOME = temp;
    expect(untrustedFolder(dir, true)).toBeUndefined();
    // Not through a link, inside the home folder or not.
    const link = path.join(temp, 'link');
    fs.symlinkSync(dir, link);
    expect(untrustedFolder(link)).toBe(`${link} is not a folder`);
  });
});

/** A module of src/ as JavaScript. */
function transpile(file: string): string {
  const source = fs.readFileSync(path.join(REPO, 'src', file), 'utf8');
  return ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
}

/**
 * The files of an onsystem package whose bin is src/bin.ts as JavaScript, loading a stand-in for
 * the CLI (main.js) instead of cli.js.
 */
function binPackage(manifest: object = {}): Record<string, string> {
  const bin = transpile('bin.ts');
  expect(bin).toMatch(/import\((['"])\.\/cli\.js\1\)/);
  return {
    'package.json': json({
      name: 'onsystem',
      version: VERSION,
      bin: { onsystem: 'dist/cli.js' },
      ...manifest,
    }),
    'dist/cli.js': bin.replace(/import\((['"])\.\/cli\.js\1\)/, "import('./main.js')"),
    'dist/util/own-folder.js': transpile('util/own-folder.ts'),
    'dist/main.js': MAIN,
  };
}

/** `files` under `dir`. */
const under = (dir: string, files: Record<string, string>) =>
  Object.fromEntries(Object.entries(files).map(([file, text]) => [`${dir}/${file}`, text]));

// Stands in for the CLI bin.ts loads: logs how it was started, and finds nothing in the file.
const MAIN = `import fs from 'node:fs';
import module from 'node:module';
export async function main(args) {
  fs.appendFileSync(process.env.STUB_LOG, JSON.stringify({
    script: process.argv[1],
    compileCache: module.getCompileCacheDir?.() ?? null,
    remember: process.env.ONSYSTEM_REMEMBER_CLI ?? null,
  }) + '\\n');
  console.log(JSON.stringify([{ file: args[args.indexOf('check') + 1], diagnostics: [] }]));
  return 0;
}
`;

// Stands in for npx: logs its arguments before check, then runs the bin of the package it names:
// the project's own install of it when there is one, else the one in "npm's cache", as npx does.
const NPX = `import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const args = process.argv.slice(2);
fs.appendFileSync(process.env.NPX_LOG, JSON.stringify(args.slice(0, args.indexOf('check'))) + '\\n');
const at = args.findIndex((a) => a.startsWith('onsystem@'));
const own = path.join(process.cwd(), 'node_modules', 'onsystem', 'dist', 'cli.js');
const bin = fs.existsSync(own)
  ? own
  : path.join(process.env.NPX_CACHE, 'node_modules', 'onsystem', 'dist', 'cli.js');
const run = spawnSync(process.execPath, [bin, ...args.slice(at + 1)], { stdio: 'inherit' });
process.exit(run.status ?? 1);
`;

describe('check-ui hook: the CLI npx started', () => {
  /** A project without onsystem installed, npm's cache with onsystem in it, and a temp folder. */
  function setup() {
    const project = fixture({ 'package.json': '{"name":"app"}', 'app/page.tsx': '' });
    const cache = fixture(under('node_modules/onsystem', binPackage()));
    const tools = fixture({ 'npx.mjs': NPX });
    const tmp = fixture({});
    const script = fs.realpathSync(path.join(cache, 'node_modules/onsystem/dist/cli.js'));
    const own = path.join(tmp, `onsystem${user}`);
    const npxLog = path.join(tools, 'npx.log');
    const cliLog = path.join(tools, 'cli.log');
    fs.writeFileSync(npxLog, '');
    fs.writeFileSync(cliLog, '');
    const {
      ONSYSTEM_BIN: _bin,
      DESIGN_SYSTEM_MCP_BIN: _legacy,
      NODE_COMPILE_CACHE: _cache,
      NODE_DISABLE_COMPILE_CACHE: _off,
      ...env
    } = process.env;
    const environment = {
      ...env,
      TMPDIR: tmp,
      TMP: tmp,
      TEMP: tmp,
      ONSYSTEM_NPX: path.join(tools, 'npx.mjs'),
      NPX_LOG: npxLog,
      NPX_CACHE: cache,
      STUB_LOG: cliLog,
    };
    /** An edit to `app/page.tsx` in `dir`, by the hook run with `node` options and `more` env. */
    const edit = (dir = project, node: string[] = [], more: Record<string, string> = {}) =>
      spawnSync(process.execPath, [...node, HOOK], {
        input: JSON.stringify({
          hook_event_name: 'PostToolUse',
          tool_name: 'Write',
          session_id: randomUUID(),
          cwd: dir,
          tool_input: { file_path: path.join(dir, 'app/page.tsx') },
        }),
        encoding: 'utf8',
        env: { ...environment, ...more },
      }).status;
    const lines = (file: string) =>
      fs
        .readFileSync(file, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line) as unknown);
    const npxRuns = () => lines(npxLog).length;
    const cliRuns = () =>
      (
        lines(cliLog) as { script: string; compileCache: string | null; remember: string | null }[]
      ).map((run) => ({ ...run, script: fs.realpathSync(run.script) }));
    return { cache, own, script, tmp, environment, edit, npxRuns, cliRuns };
  }

  it('runs it with Node directly on later edits, while it is still this release', () => {
    const { cache, own, script, edit, npxRuns, cliRuns } = setup();
    expect(edit()).toBe(0);
    expect(npxRuns()).toBe(1);
    const [first] = cliRuns();
    expect(first?.script).toBe(script);
    expect(path.dirname(first?.remember ?? '')).toBe(own);
    expect(fs.readFileSync(first?.remember ?? '', 'utf8')).toBe(script);
    if (posix) expect(fs.statSync(first?.remember ?? '').mode & 0o777).toBe(0o600);

    // npm is not started again.
    expect(edit()).toBe(0);
    expect(edit()).toBe(0);
    expect(npxRuns()).toBe(1);
    expect(cliRuns().map((r) => [r.script, r.remember])).toEqual([
      [script, first?.remember],
      [script, null],
      [script, null],
    ]);

    // Another release in npm's cache under that path: npx runs again.
    const manifest = path.join(cache, 'node_modules/onsystem/package.json');
    fs.writeFileSync(manifest, json({ name: 'onsystem', version: '0.0.1', bin: 'dist/cli.js' }));
    expect(edit()).toBe(0);
    expect(edit()).toBe(0);
    expect(npxRuns()).toBe(3);
    // And when it is gone (npm's cache cleaned).
    fs.writeFileSync(manifest, json({ name: 'onsystem', version: VERSION, bin: 'dist/cli.js' }));
    expect(edit()).toBe(0);
    expect(npxRuns()).toBe(3);
    fs.renameSync(script, `${script}.gone`);
    edit();
    expect(npxRuns()).toBe(4);
  });

  it('remembers it for the project npx ran in, not for others', () => {
    // A project's own install that the hook does not find (its exports hide its package.json),
    // which npx runs: it is that project's, and other projects still go through npx.
    const { script, edit, npxRuns, cliRuns } = setup();
    const local = fixture({
      'package.json': '{"name":"local"}',
      'app/page.tsx': '',
      ...under('node_modules/onsystem', binPackage({ exports: { '.': './dist/index.js' } })),
    });
    const localScript = fs.realpathSync(path.join(local, 'node_modules/onsystem/dist/cli.js'));
    expect(edit(local)).toBe(0);
    expect(edit(local)).toBe(0);
    expect(npxRuns()).toBe(1);
    // The project's own copy, remembered for it.
    expect(edit()).toBe(0);
    expect(npxRuns()).toBe(2);
    expect(edit()).toBe(0);
    expect(edit(local)).toBe(0);
    expect(npxRuns()).toBe(2);
    expect(cliRuns().map((r) => r.script)).toEqual([
      localScript,
      localScript,
      script,
      script,
      localScript,
    ]);
  });

  it.runIf(posix)('does not run what a link or a file others can write to names', () => {
    const { own, edit, npxRuns, cliRuns } = setup();
    expect(edit()).toBe(0);
    const remember = cliRuns()[0]?.remember ?? '';
    // A link in place of the file the CLI wrote.
    const elsewhere = path.join(own, 'elsewhere');
    fs.renameSync(remember, elsewhere);
    fs.symlinkSync(elsewhere, remember);
    expect(edit()).toBe(0);
    expect(npxRuns()).toBe(2);
    // The CLI npx started replaced the link with a file of its own, rather than writing through it.
    expect(fs.lstatSync(remember).isFile()).toBe(true);
    expect(edit()).toBe(0);
    expect(npxRuns()).toBe(2);
    // The file, writable by others.
    fs.chmodSync(remember, 0o622);
    expect(edit()).toBe(0);
    expect(npxRuns()).toBe(3);
  });

  it.runIf(posix)("writes its path only to the hook's file in its own folder", () => {
    const { own, script, tmp, environment } = setup();
    const outside = path.join(tmp, 'outside');
    fs.writeFileSync(outside, 'kept');
    const run = (remember: string) =>
      spawnSync(process.execPath, [script, 'check', 'x.tsx'], {
        encoding: 'utf8',
        env: { ...environment, ONSYSTEM_REMEMBER_CLI: remember },
      }).status;
    const key = 'npx-cli-0123456789abcdef';
    // Anywhere else, or under another name, nothing is written.
    expect(run(path.join(tmp, key))).toBe(0);
    expect(fs.existsSync(path.join(tmp, key))).toBe(false);
    expect(run(path.join(own, 'model.json'))).toBe(0);
    expect(fs.existsSync(path.join(own, 'model.json'))).toBe(false);
    // A link in its place is replaced, not written through.
    fs.symlinkSync(outside, path.join(own, key));
    expect(run(path.join(own, key))).toBe(0);
    expect(fs.readFileSync(outside, 'utf8')).toBe('kept');
    expect(fs.lstatSync(path.join(own, key)).isFile()).toBe(true);
    expect(fs.readFileSync(path.join(own, key), 'utf8')).toBe(script);
    expect(fs.statSync(path.join(own, key)).mode & 0o777).toBe(0o600);
    // Written whole, then renamed into place: nothing else is left beside it.
    expect(fs.readdirSync(own).filter((name) => name !== 'compile-cache')).toEqual([key]);
  });

  // Node.js 22.1 and later.
  const compileCache = 'getCompileCacheDir' in module;
  it.runIf(compileCache)("turns on Node's compile cache in the user's own temp folder", () => {
    const { own, edit, cliRuns } = setup();
    expect(edit()).toBe(0);
    const [run] = cliRuns();
    expect(path.dirname(run?.compileCache ?? '')).toBe(path.join(own, 'compile-cache'));
    if (posix) expect(fs.statSync(own).mode & 0o777).toBe(0o700);
  });

  it.runIf(posix)('neither remembers nor caches in a temp folder other users can write to', () => {
    const { own, edit, npxRuns, cliRuns } = setup();
    fs.mkdirSync(own, { mode: 0o700 });
    fs.chmodSync(own, 0o777);
    expect(edit()).toBe(0);
    expect(edit()).toBe(0);
    expect(npxRuns()).toBe(2);
    expect(cliRuns().map((r) => [r.remember, r.compileCache])).toEqual([
      [null, null],
      [null, null],
    ]);
    expect(fs.readdirSync(own)).toEqual([]);
    expect(fs.statSync(own).mode & 0o777).toBe(0o777);
    fs.chmodSync(own, 0o700);
  });

  it.runIf(posix)('on Windows, remembers it only in a temp folder inside the home folder', () => {
    // Windows has no owner to check: the hook, made to think it runs there, trusts the folder only
    // inside the home folder (HOME, here), where Windows keeps each user's temp folder.
    const { tmp, edit, npxRuns, cliRuns } = setup();
    const windows = ['--import', `data:text/javascript,${encodeURIComponent(WINDOWS)}`];
    const away = fixture({});
    expect(edit(undefined, windows, { HOME: away })).toBe(0);
    expect(edit(undefined, windows, { HOME: away })).toBe(0);
    expect(npxRuns()).toBe(2);
    expect(cliRuns().map((r) => r.remember)).toEqual([null, null]);
    expect(edit(undefined, windows, { HOME: tmp })).toBe(0);
    expect(edit(undefined, windows, { HOME: tmp })).toBe(0);
    expect(npxRuns()).toBe(3);
  });
});

// Makes the hook take its platform for Windows.
const WINDOWS = "Object.defineProperty(process, 'platform', { value: 'win32' });";
