import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import module from 'node:module';
import os from 'node:os';
import path from 'node:path';

import ts from 'typescript';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { detectProject, type DetectionStep } from '../src/detect.js';
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

/** Dates every file under `dir` a minute back: files that have not changed for a while. */
function settle(dir: string): void {
  const past = new Date(Date.now() - 60_000);
  for (const entry of fs.readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (entry.isFile()) fs.utimesSync(path.join(entry.parentPath, entry.name), past, past);
  }
}

describe('detection kept on disk', () => {
  let temp: string;
  let saved: string | undefined;
  beforeEach(() => {
    saved = process.env.TMPDIR;
    temp = fs.mkdtempSync(path.join(os.tmpdir(), 'onsystem-detect-test-'));
    process.env.TMPDIR = temp;
  });
  afterEach(() => {
    if (saved === undefined) delete process.env.TMPDIR;
    else process.env.TMPDIR = saved;
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

  it.runIf(posix)('is not read from a temp folder other users can write to', () => {
    const root = fixture(MONOREPO);
    const web = path.join(root, 'apps/web');
    settle(root);
    detectProject(web);
    mark();
    fs.chmodSync(folder(), 0o777);
    expect(detectProject(web)?.source).toBe('workspace package @acme/ui');
    // The folder is the user's again, with the detection just made in it.
    expect(fs.statSync(folder()).mode & 0o777).toBe(0o700);
    mark();
    expect(detectProject(web)?.source).toBe('KEPT');
  });
});

/** src/bin.ts as JavaScript, loading a stand-in for the CLI (main.js) instead of cli.js. */
function binScript(): string {
  const source = fs.readFileSync(path.join(REPO, 'src/bin.ts'), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  expect(outputText).toMatch(/import\((['"])\.\/cli\.js\1\)/);
  return outputText.replace(/import\((['"])\.\/cli\.js\1\)/, "import('./main.js')");
}

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

// Stands in for npx: logs its arguments before check, then runs the bin of the package it names
// from "npm's cache", as npx does.
const NPX = `import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const args = process.argv.slice(2);
fs.appendFileSync(process.env.NPX_LOG, JSON.stringify(args.slice(0, args.indexOf('check'))) + '\\n');
const at = args.findIndex((a) => a.startsWith('onsystem@'));
const bin = path.join(process.env.NPX_CACHE, 'node_modules', 'onsystem', 'dist', 'cli.js');
const run = spawnSync(process.execPath, [bin, ...args.slice(at + 1)], { stdio: 'inherit' });
process.exit(run.status ?? 1);
`;

describe('check-ui hook: the CLI npx started', () => {
  /** A project without onsystem installed, npm's cache with onsystem in it, and a temp folder. */
  function setup() {
    const project = fixture({ 'package.json': '{"name":"app"}', 'app/page.tsx': '' });
    const cache = fixture({
      'node_modules/onsystem/package.json': json({
        name: 'onsystem',
        version: VERSION,
        bin: { onsystem: 'dist/cli.js' },
      }),
      'node_modules/onsystem/dist/cli.js': binScript(),
      'node_modules/onsystem/dist/main.js': MAIN,
    });
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
    const edit = () =>
      spawnSync(process.execPath, [HOOK], {
        input: JSON.stringify({
          hook_event_name: 'PostToolUse',
          tool_name: 'Write',
          session_id: randomUUID(),
          cwd: project,
          tool_input: { file_path: path.join(project, 'app/page.tsx') },
        }),
        encoding: 'utf8',
        env: {
          ...env,
          TMPDIR: tmp,
          TMP: tmp,
          TEMP: tmp,
          ONSYSTEM_NPX: path.join(tools, 'npx.mjs'),
          NPX_LOG: npxLog,
          NPX_CACHE: cache,
          STUB_LOG: cliLog,
        },
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
    return { cache, own, script, edit, npxRuns, cliRuns };
  }

  it('runs it with Node directly on later edits, while it is still this release', () => {
    const { cache, own, script, edit, npxRuns, cliRuns } = setup();
    expect(edit()).toBe(0);
    expect(npxRuns()).toBe(1);
    const [first] = cliRuns();
    expect(first?.script).toBe(script);
    expect(path.dirname(first?.remember ?? '')).toBe(own);
    expect(fs.readFileSync(first?.remember ?? '', 'utf8')).toBe(script);

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
    fs.chmodSync(own, 0o700);
  });
});
