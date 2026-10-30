import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline/promises';
import { PassThrough } from 'node:stream';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { main, type Io } from '../src/cli.js';
import { DEMO_ROOT, fixture } from './helpers.js';

// Edges of the CLI's options and of where it runs from: a warning cap of -1 or of an unset
// variable, an option of another command, Ctrl+D at one of init's questions, a run from a
// folder inside a project, and a design system that lacks color tokens.

afterEach(() => {
  vi.restoreAllMocks();
});

async function run(args: string[], cwd = DEMO_ROOT, prompt?: Io['prompt']) {
  const out: string[] = [];
  const err: string[] = [];
  const io: Io = {
    cwd,
    color: false,
    stdout: (t) => out.push(t),
    stderr: (t) => err.push(t),
    ...(prompt ? { prompt } : {}),
  };
  const code = await main(args, io);
  return { code, stdout: out.join('\n'), stderr: err.join('\n') };
}

/**
 * The demo's files with its design system under `dir` (`src/components/ui`), its stylesheet at
 * `css` and its settings pages in `pages`, named through `alias` (`@/components/ui`) by
 * components.json and tsconfig.json, as a Next.js project with a src folder, or a React Router
 * one with app, has them.
 */
function demoUnder(layout: {
  dir: string;
  alias: string;
  css: string;
  pages: string;
}): Record<string, string> {
  const { dir, alias, css, pages } = layout;
  const read = (file: string) =>
    fs.readFileSync(path.join(DEMO_ROOT, file), 'utf8').replaceAll('"@/', `"${alias}/`);
  const files: Record<string, string> = {
    'package.json': read('package.json'),
    'components.json': read('components.json').replace('"app/globals.css"', `"${css}"`),
    'tsconfig.json': JSON.stringify({
      compilerOptions: {
        jsx: 'react-jsx',
        strict: true,
        paths: { [`${alias}/*`]: [`./${dir}/*`] },
      },
    }),
    [css]: read('app/globals.css'),
    [`${dir}/lib/utils.ts`]: read('lib/utils.ts'),
    [`${pages}/danger-zone.tsx`]: read('app/settings/danger-zone.tsx'),
  };
  for (const name of fs.readdirSync(path.join(DEMO_ROOT, 'components/ui'))) {
    files[`${dir}/components/ui/${name}`] = read(`components/ui/${name}`);
  }
  return files;
}

const WARN_ONLY = [
  '--config',
  path.join(import.meta.dirname, 'fixtures/warn-only.config.json'),
  '--root',
  DEMO_ROOT,
];

describe('--max-warnings', () => {
  it('takes -1 as no limit, as ESLint does', async () => {
    const clean = await run([
      'check',
      'app/settings/members.tsx',
      '--no-cache',
      '--max-warnings=-1',
    ]);
    expect(clean.stderr).not.toContain('Too many warnings');
    expect(clean.code).toBe(0);
    const warned = await run([
      'check',
      'app/settings/danger-zone.tsx',
      '--no-cache',
      ...WARN_ONLY,
      '--max-warnings=-1',
    ]);
    expect(warned.stdout).toContain('0 errors, 11 warnings');
    expect(warned.code).toBe(0);
  });

  it('rejects an empty value, from an unset variable, rather than read it as 0', async () => {
    for (const value of ['', ' ', 'many', '1.5', '0x10']) {
      const { code, stderr } = await run([
        'check',
        'app/settings/danger-zone.tsx',
        '--no-cache',
        ...WARN_ONLY,
        `--max-warnings=${value}`,
      ]);
      expect(code, value).toBe(2);
      expect(stderr).toBe(
        `check: --max-warnings expects a whole number (--max-warnings=-1 for no limit), not "${value}"`,
      );
    }
  });
});

describe('options of another command', () => {
  it('are rejected rather than ignored', async () => {
    const dir = fixture({});
    const out = await run(['check', 'app', '--out', path.join(dir, 'report.json')]);
    expect(out.code).toBe(2);
    expect(out.stderr).toBe(
      'check: --out is an option of export only. Run onsystem --help for usage.',
    );
    expect(fs.existsSync(path.join(dir, 'report.json'))).toBe(false);
    expect(out.stdout).toBe('');

    expect((await run(['check', 'app', '--explain'])).stderr).toBe(
      'check: --explain is an option of inspect only. Run onsystem --help for usage.',
    );
    expect((await run(['inspect', '--max-warnings=0'])).stderr).toBe(
      'inspect: --max-warnings is an option of check only. Run onsystem --help for usage.',
    );
    expect((await run(['init', '--no-watch'])).stderr).toBe(
      'init: --no-watch is an option of serve only. Run onsystem --help for usage.',
    );
    expect((await run(['inspect', '-y'])).stderr).toBe(
      'inspect: -y is an option of init only. Run onsystem --help for usage.',
    );
  });

  it('are named and ignored by the server, which still starts', async () => {
    // A stale flag in an MCP client's args (`npx onsystem -y`) left the client with a server
    // that exited 2 at once.
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    const err: string[] = [];
    const io: Io = {
      cwd: DEMO_ROOT,
      color: false,
      stdout: () => {},
      stderr: (t) => err.push(t),
      transport: serverSide,
    };
    const args = ['-y', '--format', 'json', '--format=sarif', '--no-watch', '--no-cache'];
    expect(await main(args, io)).toBe(0);
    expect(err).toEqual([
      'serve: -y is an option of init only, so it is ignored.',
      'serve: --format is an option of check, inspect and export only, so it is ignored.',
    ]);
    const client = new Client({ name: 'test', version: '1.0.0' });
    await client.connect(clientSide);
    try {
      const { tools } = await client.listTools();
      expect(tools.map((t) => t.name)).toContain('check_ui');
    } finally {
      await client.close();
    }
  });

  it('still leaves an unknown command to say so', async () => {
    expect((await run(['lint', '--out', 'x'])).stderr).toBe(
      'Unknown command "lint". Run onsystem --help for usage.',
    );
  });
});

describe('init in a terminal', () => {
  /** A terminal question answered with Ctrl+D, as `askInTerminal` asks it. */
  const ctrlD = async (question: string) => {
    const input = new PassThrough();
    const rl = readline.createInterface({ input, output: new PassThrough(), terminal: true });
    try {
      const answer = rl.question(question);
      input.write('\u0004');
      return await answer;
    } finally {
      rl.close();
    }
  };

  it('says that Ctrl+D cancelled it, without a stack trace', async () => {
    // Nothing to find, so init asks where the components are. The cursor is still on the
    // question's line: the message starts a line of its own.
    const root = fixture({ 'package.json': '{ "name": "app" }' });
    const { code, stderr } = await run(['init'], root, ctrlD);
    expect(stderr).toBe('\ninit: cancelled; nothing after that question was done.');
    expect(code).toBe(130);
    expect(fs.existsSync(path.join(root, 'onsystem.config.json'))).toBe(false);
  });
});

describe('a run from a folder inside a project', () => {
  it('checks against the project around it, as from its root', async () => {
    const settings = path.join(DEMO_ROOT, 'app/settings');
    const inside = await run(
      ['check', 'danger-zone.tsx', '--format', 'json', '--no-cache'],
      settings,
    );
    const fromRoot = await run([
      'check',
      'app/settings/danger-zone.tsx',
      '--format',
      'json',
      '--no-cache',
    ]);
    type Results = { file: string; diagnostics: unknown[] }[];
    const results = JSON.parse(inside.stdout) as Results;
    expect(results[0]?.diagnostics).toHaveLength(11);
    expect(results.map((r) => r.diagnostics)).toEqual(
      (JSON.parse(fromRoot.stdout) as Results).map((r) => r.diagnostics),
    );
    expect(results[0]?.file).toBe('danger-zone.tsx');
    // Which project, on stderr, so the JSON on stdout still parses.
    expect(inside.stderr).toBe('Checking the project in ../..');
    expect(inside.code).toBe(1);
    const pretty = await run(['check', 'danger-zone.tsx', '--no-cache'], settings);
    expect(pretty.stdout.split('\n')[0]).toBe('Checking the project in ../..');
    expect(pretty.stdout.match(/Checking the project/g)).toHaveLength(1);
    // Not from the root, nor for a hook, which prints nothing when there is nothing to say.
    expect(fromRoot.stderr).toBe('');
    const hook = await run(
      ['check', 'danger-zone.tsx', '--no-cache', '--quiet-without-design-system'],
      settings,
    );
    expect(hook.stdout).not.toContain('Checking the project');

    const inspect = await run(['inspect', '--no-cache'], settings);
    expect(inspect.stdout.split('\n')[0]).toBe(`root     ${DEMO_ROOT}`);
  });

  it('keeps the folder as the root when --root says so, or when a run from there recorded a baseline', async () => {
    const files = {
      'package.json': '{ "name": "app" }',
      'components/ui/button.tsx':
        'export function Button(props: { children?: unknown }) { return <button /> }\n',
      'app/legacy/page.tsx': 'export default () => <div className="p-[13px]" />;\n',
    };
    const root = fixture(files);
    const legacy = path.join(root, 'app/legacy');
    const rootLine = async (args: string[]) =>
      (await run(['inspect', '--no-cache', ...args], legacy)).stdout.split('\n')[0];
    expect(await rootLine([])).toBe(`root     ${root}`);
    expect(await rootLine(['--root', '.'])).toBe(`root     ${legacy}`);
    fs.writeFileSync(path.join(legacy, 'onsystem.baseline.json'), '{}');
    expect(await rootLine([])).toBe(`root     ${legacy}`);
  });

  it('keeps a folder with a design system of its own and no package.json', async () => {
    // A stray package.json above it is not its project.
    const outer = fixture({
      'package.json': '{ "name": "stray" }',
      'ds/components/ui/button.tsx':
        'export function Button(props: { children?: unknown }) { return <button /> }\n',
      'ds/src/components/ui/card.tsx': 'export function Card() { return <div /> }\n',
      'other/src/components/ui/card.tsx': 'export function Card() { return <div /> }\n',
    });
    for (const dir of ['ds', 'other']) {
      const cwd = path.join(outer, dir);
      const { stdout } = await run(['inspect', '--no-cache'], cwd);
      expect(stdout.split('\n')[0], dir).toBe(`root     ${cwd}`);
    }
  });

  it("goes up from the project's src or app folder, which holds the components it reads", async () => {
    // From src in a src layout, or from app in a React Router one, the folder's components/ui
    // kept it as the root, where components.json and the tsconfig paths were not read: findings
    // were lost (4 errors rather than 8 from src, 1 from app, with no color tokens).
    const layouts = [
      { dir: 'src', alias: '@', css: 'src/app/globals.css', pages: 'src/app/settings' },
      { dir: 'app', alias: '~', css: 'app/app.css', pages: 'app/settings' },
    ];
    for (const layout of layouts) {
      const { dir, pages } = layout;
      const root = fixture(demoUnder(layout), { nodeModules: true });
      const page = `${pages}/danger-zone.tsx`;
      const diagnostics = async (cwd: string) => {
        const file = path.relative(cwd, path.join(root, page)).split(path.sep).join('/');
        const { stdout, stderr } = await run(
          ['check', file, '--format', 'json', '--no-cache'],
          cwd,
        );
        const results = JSON.parse(stdout) as { diagnostics: { ruleId: string }[] }[];
        return { stderr, found: results.flatMap((r) => r.diagnostics) };
      };
      const fromRoot = await diagnostics(root);
      expect(
        fromRoot.found.map((d) => d.ruleId),
        dir,
      ).toEqual(
        expect.arrayContaining(['no-unknown-component', 'no-unknown-prop', 'no-hardcoded-color']),
      );
      const fromDir = await diagnostics(path.join(root, dir));
      expect(fromDir.stderr, dir).toBe('Checking the project in ..');
      expect(fromDir.found, dir).toEqual(fromRoot.found);
      const fromSettings = await diagnostics(path.join(root, pages));
      expect(fromSettings.found, dir).toEqual(fromRoot.found);
    }
  });

  it('never goes up to the home folder, or above it', async () => {
    // A stray ~/package.json, or one above the home folder, is not the project.
    const outer = fixture({
      'package.json': '{ "name": "stray" }',
      'home/me/package.json': '{ "name": "dotfiles" }',
      'home/me/code/notes/page.tsx': 'export default () => <div />;\n',
    });
    const home = path.join(outer, 'home/me');
    // Windows compares paths without case, as findProjectRoot does.
    vi.spyOn(os, 'homedir').mockReturnValue(
      process.platform === 'win32' ? home.toUpperCase() : home,
    );
    const rootLine = async (cwd: string) =>
      (await run(['inspect', '--no-cache'], cwd)).stdout.split('\n')[0];
    const notes = path.join(home, 'code/notes');
    expect(await rootLine(notes)).toBe(`root     ${notes}`);
    fs.rmSync(path.join(home, 'package.json'));
    expect(await rootLine(notes)).toBe(`root     ${notes}`);
    // Run from the home folder itself, it does not look above it.
    expect(await rootLine(home)).toBe(`root     ${home}`);
  });

  it('names the project in the notices relative to the working directory', async () => {
    const app = fixture({
      'package.json': '{ "name": "app" }',
      'app/settings/page.tsx': 'export default () => <div className="p-[13px]" />;\n',
    });
    const one = await run(['check', 'page.tsx', '--no-cache'], path.join(app, 'app/settings'));
    expect(one.stdout).toContain(
      'No design system found in ../.. (no components or color tokens): only the accessibility rule',
    );
    // At a monorepo root, the root's own files were said to be `in .`, from tools/scripts.
    const monorepo = fixture({
      'package.json': '{ "name": "acme", "private": true, "workspaces": ["apps/*"] }',
      'apps/web/package.json': '{ "name": "web" }',
      'apps/web/components/ui/button.tsx':
        'export function Button(props: { children?: unknown }) { return <button /> }\n',
      'tools/scripts/preview.tsx': 'export default () => <div className="p-[13px]" />;\n',
    });
    const scripts = path.join(monorepo, 'tools/scripts');
    const many = await run(['check', 'preview.tsx', '--no-cache'], scripts);
    expect(many.stdout.split('\n')[0]).toBe('Checking the project in ../..');
    expect(many.stdout).toContain(
      'No design system found in ../.. (no components or color tokens)',
    );
    expect(many.stdout).not.toContain('found in . ');
  });
});

describe('init from a folder inside a project', () => {
  it('names the config and the baseline it writes relative to the working directory', async () => {
    const root = fixture({
      'package.json': '{ "name": "app" }',
      'components/ui/button.tsx':
        'export function Button(props: { children?: unknown }) { return <button /> }\n',
      'app/globals.css': ':root { --primary: oklch(0.2 0 0); }\n',
      'app/settings/page.tsx': 'export default () => <div className="bg-[#123456]" />;\n',
    });
    const { code, stdout } = await run(
      ['init', '-y', '--no-cache'],
      path.join(root, 'app/settings'),
    );
    expect(code).toBe(0);
    expect(stdout).toContain('Wrote ../../onsystem.config.json.');
    expect(stdout).toMatch(
      /^Baseline: 1 finding in 1 file → \.\.\/\.\.\/onsystem\.baseline\.json$/m,
    );
    expect(fs.existsSync(path.join(root, 'onsystem.baseline.json'))).toBe(true);
  });
});

describe('a design system without color tokens', () => {
  it('is named in inspect, before a check says so', async () => {
    const root = fixture({
      'package.json': '{ "name": "app" }',
      'components/ui/button.tsx':
        'export function Button(props: { children?: unknown }) { return <button /> }\n',
    });
    const { code, stdout } = await run(['inspect', '--no-cache'], root);
    expect(code).toBe(0);
    expect(stdout).toContain(
      'Tokens (0)\n\nNo color tokens found: check will not run no-hardcoded-color. See https://onsystem.vercel.app/docs/configuration',
    );
    const themed = fixture({
      'package.json': '{ "name": "app" }',
      'components/ui/button.tsx':
        'export function Button(props: { children?: unknown }) { return <button /> }\n',
      'app/globals.css': ':root { --primary: oklch(0.2 0 0); }\n',
    });
    expect((await run(['inspect', '--no-cache'], themed)).stdout).not.toContain('found: check');
  });
});
