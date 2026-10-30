import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { PassThrough } from 'node:stream';

import { describe, expect, it } from 'vitest';

import { main, type Io } from '../src/cli.js';
import { DEMO_ROOT, fixture } from './helpers.js';

// Edges of the CLI's options and of where it runs from: a warning cap of -1 or of an unset
// variable, an option of another command, Ctrl+D at one of init's questions, a run from a
// folder inside a project, and a design system that lacks color tokens.

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
        `check: --max-warnings expects a whole number (-1 for no limit), not "${value}"`,
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
    // `onsystem` alone is `serve`, which answers an MCP client: it does not start.
    expect(await run(['--format', 'json'])).toEqual({
      code: 2,
      stdout: '',
      stderr:
        'serve: --format is an option of check, inspect and export only. Run onsystem --help for usage.',
    });
    expect((await run(['inspect', '-y'])).stderr).toBe(
      'inspect: -y is an option of init only. Run onsystem --help for usage.',
    );
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
    // Nothing to find, so init asks where the components are.
    const root = fixture({ 'package.json': '{ "name": "app" }' });
    const { code, stderr } = await run(['init'], root, ctrlD);
    expect(stderr).toBe('init: cancelled; nothing after that question was done.');
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
    expect(inside.stderr).toBe('');
    expect(inside.code).toBe(1);

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
