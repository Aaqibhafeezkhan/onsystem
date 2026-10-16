import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ESLint, type Linter } from 'eslint';
import { build } from 'tsdown';
import tseslint from 'typescript-eslint';
import { beforeAll, describe, expect, it } from 'vitest';

import { main, type Io } from '../src/cli.js';
import { DEFAULT_TEST_EXCLUDE } from '../src/config.js';
import { createServer } from '../src/server/index.js';
import { WorkspaceProjects } from '../src/server/projects.js';
import { silentLogger } from '../src/util/log.js';
import { coveredByGlob } from '../src/util/paths.js';
import { loadTarget } from '../src/workspace.js';
import { fixture, load } from './helpers.js';

// One `exclude`, one answer: `check` in a project, `check` at the monorepo root, the ESLint
// plugin, the Claude Code hook and check_ui leave out the same files, whichever way the pattern
// names a folder (`app/legacy`, `app/legacy/`, `./app/legacy`, `app\legacy`, `**/legacy`).

const REPO = path.resolve(import.meta.dirname, '..');
const HOOK = path.join(REPO, 'plugins/onsystem/hooks/check-ui.mjs');
// The ESLint plugin as it ships, with its worker as a real file (as in eslint.test.ts), in a
// folder of its own so the two test files can build at once.
const OUT = path.join(REPO, 'node_modules/.cache/onsystem-eslint-exclude-test');

let onsystem: { configs: { recommended: Linter.Config } };

beforeAll(async () => {
  await build({
    cwd: REPO,
    config: false,
    entry: { eslint: 'src/eslint/index.ts', 'eslint-worker': 'src/eslint/worker.ts' },
    outDir: OUT,
    format: 'esm',
    platform: 'node',
    target: 'node22.18',
    fixedExtension: false,
    dts: false,
    publint: false,
    clean: true,
    logLevel: 'silent',
  });
  ({ default: onsystem } = (await import(pathToFileURL(path.join(OUT, 'eslint.js')).href)) as {
    default: typeof onsystem;
  });
});

const json = (value: unknown) => JSON.stringify(value);
const BUTTON =
  'export function Button(props: React.ComponentProps<"button">) { return <button {...props} /> }';
const TOKENS = ':root {\n  --primary: oklch(0.55 0.2 260);\n}\n';
const RED = 'export default () => <button className="bg-[#ff0000]">Hi</button>\n';

/** A monorepo whose app, apps/web, has the given `exclude` and a legacy folder of red pages. */
function monorepo(exclude: string[]): { root: string; web: string } {
  const root = fixture({
    'package.json': json({ name: 'mono', private: true, workspaces: ['apps/*'] }),
    'apps/web/package.json': json({ name: 'web' }),
    'apps/web/onsystem.config.json': json({ exclude }),
    'apps/web/components/ui/button.tsx': BUTTON,
    'apps/web/app/globals.css': TOKENS,
    'apps/web/app/page.tsx': RED,
    'apps/web/app/page.stories.tsx': RED,
    'apps/web/app/legacy/old.tsx': RED,
    'apps/web/app/legacy/deep/older.tsx': RED,
    // Not in the folder, though its name starts the same.
    'apps/web/app/legacy-v2/page.tsx': RED,
  });
  return { root, web: path.join(root, 'apps/web') };
}

async function run(args: string[], cwd: string) {
  const out: string[] = [];
  const err: string[] = [];
  const io: Io = { cwd, color: false, stdout: (t) => out.push(t), stderr: (t) => err.push(t) };
  const code = await main(args, io);
  return { code, stdout: out.join('\n'), stderr: err.join('\n') };
}

/** The files `check --format json` reported on, relative to `cwd`. */
async function checked(cwd: string, args: string[]): Promise<string[]> {
  const { stdout } = await run(['check', ...args, '--format', 'json', '--no-cache'], cwd);
  return (JSON.parse(stdout) as { file: string }[]).map((r) => r.file).sort();
}

/** The files the ESLint plugin reported a finding in, relative to `cwd`. */
async function linted(cwd: string, files: string[]): Promise<string[]> {
  const eslint = new ESLint({
    cwd,
    overrideConfigFile: true,
    overrideConfig: [
      { files: ['**/*.{ts,tsx,js,jsx}'], languageOptions: { parser: tseslint.parser } },
      onsystem.configs.recommended,
    ],
  });
  const results = await eslint.lintFiles(files);
  return results
    .filter((r) => r.messages.length)
    .map((r) => path.relative(cwd, r.filePath).split(path.sep).join('/'))
    .sort();
}

describe('coveredByGlob', () => {
  it('matches a file the glob names, and every file in a folder it matches', () => {
    for (const pattern of ['app/legacy', 'app/legacy/', './app/legacy', 'app/legacy/**']) {
      expect(coveredByGlob('app/legacy/old.tsx', pattern), pattern).toBe(true);
      expect(coveredByGlob('app/legacy/deep/older.tsx', pattern), pattern).toBe(true);
      expect(coveredByGlob('app/legacy-v2/page.tsx', pattern), pattern).toBe(false);
      expect(coveredByGlob('app/page.tsx', pattern), pattern).toBe(false);
    }
    expect(coveredByGlob('app/legacy/deep/older.tsx', '**/legacy')).toBe(true);
    expect(coveredByGlob('app/legacy/deep/older.tsx', 'app/*/deep')).toBe(true);
    expect(coveredByGlob('app/page.stories.tsx', DEFAULT_TEST_EXCLUDE)).toBe(true);
    expect(coveredByGlob('app/page.tsx', 'app/page.tsx')).toBe(true);
    expect(coveredByGlob('app/page.tsx', 'app/*.ts')).toBe(false);
  });
});

describe('exclude: the same files left out everywhere', () => {
  // `exclude` adds to the defaults: the story stays out too.
  const kept = ['app/legacy-v2/page.tsx', 'app/page.tsx'];
  const patterns = [
    'app/legacy',
    'app/legacy/',
    './app/legacy',
    'app\\legacy',
    '.\\app\\legacy\\',
    '**/legacy',
    'app/legacy/**',
  ];

  for (const pattern of patterns) {
    it(`"${pattern}": check in the project, check at the root and ESLint agree`, async () => {
      const { root, web } = monorepo([pattern]);
      expect(await checked(web, ['.'])).toEqual(kept);
      expect(await checked(root, ['.'])).toEqual(kept.map((f) => `apps/web/${f}`));
      // The recommended config ignores stories itself.
      const findings = kept.filter((f) => !f.includes('.stories.'));
      expect(await linted(web, ['app'])).toEqual(findings);
      expect(await linted(root, ['apps'])).toEqual(findings.map((f) => `apps/web/${f}`));
    });
  }

  it('says what it left out the same way in the project and at the root', async () => {
    const { root, web } = monorepo(['app/legacy', DEFAULT_TEST_EXCLUDE]);
    const summary = async (cwd: string) =>
      (await run(['check', '.', '--no-cache'], cwd)).stdout.split('\n').at(-1);
    expect(await summary(web)).toBe(
      '2 errors, 2 warnings in 2 files (1 design-system file skipped; 1 test or story left out; 2 excluded files left out)',
    );
    expect(await summary(root)).toBe(await summary(web));
  });
});

describe('check --skip-excluded', () => {
  it('leaves out files named outright that exclude covers, in a project and at the root', async () => {
    const { root, web } = monorepo(['app/legacy', DEFAULT_TEST_EXCLUDE]);
    const named = ['app/legacy/old.tsx', 'app/page.stories.tsx'];
    // Without the flag, a file named outright is checked whatever exclude says.
    expect(await checked(web, named)).toEqual(
      ['app/page.stories.tsx', 'app/legacy/old.tsx'].sort(),
    );

    const skipped = await run(['check', ...named, '--skip-excluded', '--no-cache'], web);
    expect(skipped).toMatchObject({
      code: 0,
      stdout:
        'Nothing to check: 1 test or story left out; 1 excluded file left out. Pass --include-tests to check tests and stories.',
    });
    expect(await checked(web, [...named, '--skip-excluded'])).toEqual([]);
    expect(await checked(web, [...named, 'app/page.tsx', '--skip-excluded'])).toEqual([
      'app/page.tsx',
    ]);
    expect(await checked(web, [...named, '--skip-excluded', '--include-tests'])).toEqual([
      'app/page.stories.tsx',
    ]);

    const fromRoot = named.map((f) => `apps/web/${f}`);
    expect(await checked(root, [...fromRoot, '--skip-excluded'])).toEqual([]);
    expect((await run(['check', ...fromRoot, '--skip-excluded', '--no-cache'], root)).stdout).toBe(
      skipped.stdout,
    );
  });
});

// Stands in for the CLI: logs each run's arguments and folder, then answers with what the real
// CLI printed for them (STUB_ANSWER). With STUB_OLD, it is a CLI from before --skip-excluded.
const STUB = `import fs from 'node:fs';
const args = process.argv.slice(2);
fs.appendFileSync(process.env.STUB_LOG, JSON.stringify({ cwd: process.cwd(), args }) + '\\n');
if (process.env.STUB_OLD && args.includes('--skip-excluded')) {
  process.stderr.write("Unknown option '--skip-excluded'. To specify a positional argument starting with a '-', place it at the end of the command after '--', as in '-- \\"--skip-excluded\\"\\n\\nRun onsystem --help for usage.\\n");
  process.exit(2);
}
const answer = JSON.parse(fs.readFileSync(process.env.STUB_ANSWER, 'utf8'));
process.stdout.write(answer.stdout);
process.exit(answer.code);
`;

describe('the Claude Code hook', () => {
  const tools = fixture({ 'cli.mjs': STUB });
  const log = path.join(tools, 'log.jsonl');
  const answer = path.join(tools, 'answer.json');

  function spawnHook(cwd: string, file: string, reply = { stdout: '[]', code: 0 }, old = false) {
    fs.rmSync(log, { force: true });
    fs.writeFileSync(answer, JSON.stringify(reply));
    const { ONSYSTEM_BIN: _bin, DESIGN_SYSTEM_MCP_BIN: _legacy, ...env } = process.env;
    const hook = spawnSync(process.execPath, [HOOK], {
      input: JSON.stringify({
        session_id: randomUUID(),
        hook_event_name: 'PostToolUse',
        tool_name: 'Write',
        cwd,
        tool_input: { file_path: path.join(cwd, file) },
      }),
      encoding: 'utf8',
      env: {
        ...env,
        ONSYSTEM_BIN: path.join(tools, 'cli.mjs'),
        STUB_LOG: log,
        STUB_ANSWER: answer,
        ...(old ? { STUB_OLD: '1' } : {}),
      },
    });
    const runs = fs.existsSync(log)
      ? fs
          .readFileSync(log, 'utf8')
          .trim()
          .split('\n')
          .map((line) => JSON.parse(line) as { cwd: string; args: string[] })
      : [];
    return { code: hook.status, stderr: hook.stderr, runs };
  }

  /** The hook on a Write of `file`, answered by the real CLI for the command the hook runs. */
  async function hook(cwd: string, file: string, old = false) {
    const runs = spawnHook(cwd, file, undefined, old).runs;
    const last = runs.at(-1);
    if (!last) throw new Error('The hook did not run the CLI.');
    const real = await run([...last.args, '--no-cache'], last.cwd);
    return spawnHook(cwd, file, { stdout: real.stdout, code: real.code }, old);
  }

  it('leaves alone the files check . leaves out, and still blocks on the rest', async () => {
    const { root, web } = monorepo(['app/legacy', DEFAULT_TEST_EXCLUDE]);
    for (const cwd of [web, root]) {
      for (const file of [
        'app/legacy/old.tsx',
        'app/legacy/deep/older.tsx',
        'app/page.stories.tsx',
      ]) {
        const result = await hook(cwd, path.relative(cwd, path.join(web, file)));
        expect(result.runs.map((r) => r.args.includes('--skip-excluded'))).toEqual([true]);
        expect([file, result.code, result.stderr]).toEqual([file, 0, '']);
      }
      const page = await hook(cwd, path.relative(cwd, path.join(web, 'app/page.tsx')));
      expect(page.code).toBe(2);
      expect(page.stderr).toContain("this change breaks the project's design system");
    }
  });

  it('runs a CLI from before --skip-excluded without it, as before', async () => {
    const { web } = monorepo(['app/legacy']);
    const result = await hook(web, 'app/legacy/old.tsx', true);
    expect(result.runs.map((r) => r.args.includes('--skip-excluded'))).toEqual([true, false]);
    // That CLI checks a file named outright whatever exclude says.
    expect(result.code).toBe(2);
    expect(result.stderr).toMatch(/^app\/legacy\/old\.tsx: this change breaks/);
  });
});

describe('check_ui', () => {
  function text(result: unknown): string {
    const content = (result as CallToolResult).content[0];
    return content?.type === 'text' ? content.text : '';
  }

  async function connect(server: ReturnType<typeof createServer>) {
    const client = new Client({ name: 'test-client', version: '1.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    return client;
  }

  const SKIPPED = (pattern: string) =>
    `It is left out by "${pattern}" in the config's exclude, as in check, the ESLint plugin and the Claude Code hook.`;

  it("leaves out a path or filename in the project's exclude", async () => {
    const { web } = monorepo(['app/legacy', DEFAULT_TEST_EXCLUDE]);
    const ds = await load(web);
    const client = await connect(createServer({ getDesignSystem: () => Promise.resolve(ds) }));
    const call = (args: Record<string, unknown>) =>
      client.callTool({ name: 'check_ui', arguments: args });

    const byPath = await call({ path: 'app/legacy/old.tsx' });
    expect(text(byPath)).toBe(`app/legacy/old.tsx: not checked. ${SKIPPED('app/legacy')}`);
    expect(byPath.structuredContent).toMatchObject({
      file: 'app/legacy/old.tsx',
      ok: true,
      errorCount: 0,
      diagnostics: [],
      skipped: SKIPPED('app/legacy'),
    });
    expect(text(await call({ code: RED, filename: 'app/legacy/new.tsx' }))).toMatch(
      /^app\/legacy\/new\.tsx: not checked\./,
    );
    expect(text(await call({ code: RED, filename: 'app/page.stories.tsx' }))).toMatch(
      /^app\/page\.stories\.tsx: not checked\./,
    );
    // The rest is checked, and so is code without a filename.
    expect(text(await call({ path: 'app/legacy-v2/page.tsx' }))).toMatch(/: 1 error/);
    expect(text(await call({ code: RED, filename: 'app/new.tsx' }))).toMatch(/: 1 error/);
    expect(text(await call({ code: RED }))).toMatch(/: 1 error/);
    await client.close();
  });

  it('leaves them out at a monorepo root too, by each project’s own exclude', async () => {
    const { root } = monorepo(['app/legacy']);
    const { workspace } = await loadTarget({ cwd: root });
    if (!workspace) throw new Error('expected a workspace');
    const projects = new WorkspaceProjects(workspace, {
      cache: false,
      watch: false,
      logger: silentLogger,
    });
    const client = await connect(
      createServer({
        getDesignSystem: () => Promise.reject(new Error('not used')),
        getProjects: () => Promise.resolve(projects),
      }),
    );
    const call = (args: Record<string, unknown>) =>
      client.callTool({ name: 'check_ui', arguments: args });
    expect(text(await call({ path: 'apps/web/app/legacy/old.tsx' }))).toBe(
      `apps/web/app/legacy/old.tsx: not checked. ${SKIPPED('app/legacy')}`,
    );
    expect(text(await call({ code: RED, filename: 'apps/web/app/legacy/new.tsx' }))).toMatch(
      /^apps\/web\/app\/legacy\/new\.tsx: not checked\./,
    );
    expect(text(await call({ code: RED, filename: 'apps/web/app/new.tsx' }))).toMatch(/: 1 error/);
    projects.close();
    await client.close();
  });
});
