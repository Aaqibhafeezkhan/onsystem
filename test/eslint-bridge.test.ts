import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { ESLint, type Linter } from 'eslint';
import { build } from 'tsdown';
import tseslint from 'typescript-eslint';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { main } from '../src/cli.js';
import { load, looking, type LoadRequest } from '../src/eslint/worker.js';
import { loadTarget } from '../src/workspace.js';
import { fixture } from './helpers.js';

// Counted, so that a test can see whether the worker's look at the project began before a lint
// had its answer: that work is synchronous at first, and no timing in a test would show it.
vi.mock('../src/workspace.js', async (importOriginal) => {
  const workspace = await importOriginal<typeof import('../src/workspace.js')>();
  return { ...workspace, loadTarget: vi.fn(workspace.loadTarget) };
});

// What the ESLint plugin carries over from the project and from ESLint's config in a process that
// runs on, as an editor's ESLint server does: config edits, rule options and suppression typos,
// and a design system that is looked at again without holding up a lint. Built as it ships, as in
// eslint.test.ts, into a folder of its own, since test files run in parallel.
const REPO = path.resolve(import.meta.dirname, '..');
const OUT = path.join(REPO, 'node_modules/.cache/onsystem-eslint-bridge-test');

let onsystem: { rules: Record<string, unknown>; configs: { recommended: Linter.Config } };

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

/** The recommended config with typescript-eslint's parser, then `extra` after it. */
function eslintFor(cwd: string, extra: Linter.Config = {}): ESLint {
  return new ESLint({
    cwd,
    overrideConfigFile: true,
    overrideConfig: [
      { files: ['**/*.{ts,tsx,js,jsx}'], languageOptions: { parser: tseslint.parser } },
      onsystem.configs.recommended,
      extra,
    ],
  });
}

/**
 * `file:line:column rule` for each finding, as `checkJson` gives them. Not the severity: ESLint's
 * config sets it, where check reports a color of a hue no token has as a warning.
 */
async function lint(eslint: ESLint, cwd: string, files: string[]): Promise<string[]> {
  const results = await eslint.lintFiles(files);
  return results.flatMap((r) =>
    r.messages.map(
      (m) =>
        `${path.relative(cwd, r.filePath).split(path.sep).join('/')}:${m.line}:${m.column} ${m.ruleId ?? 'fatal'}`,
    ),
  );
}

async function checkJson(cwd: string, args: string[]) {
  const out: string[] = [];
  await main(['check', ...args, '--format', 'json', '--no-cache'], {
    cwd,
    color: false,
    stdout: (t) => out.push(t),
    stderr: () => undefined,
  });
  const results = JSON.parse(out.join('\n')) as {
    file: string;
    diagnostics: { ruleId: string; line: number; column: number }[];
  }[];
  return results.flatMap((r) =>
    r.diagnostics.map((d) => `${r.file}:${d.line}:${d.column} onsystem/${d.ruleId}`),
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const BUTTON =
  'export function Button(props: React.ComponentProps<"button">) { return <button {...props} /> }';
const RED = 'export default () => <div className="bg-[#ff0000]">Hi</div>\n';
/** Color tokens, so no-hardcoded-color has something to compare against. */
const TOKENS = ':root {\n  --primary: oklch(0.55 0.2 260);\n}\n';

describe("the project's config in a process that runs on", () => {
  // An editor's ESLint server keeps one process: an edit to the config must reach it without a
  // restart, for a JSON config and for one written in code, which Node.js caches once imported.
  it.each([
    ['onsystem.config.json', (rules: object) => JSON.stringify({ rules })],
    [
      'onsystem.config.mjs',
      (rules: object) =>
        `export default ${JSON.stringify({ overrides: [{ files: ['app/**'], rules }] })};\n`,
    ],
  ])('turns a rule off when %s turns it off between two lints', async (name, write) => {
    const root = fixture({
      'components/ui/button.tsx': BUTTON,
      'app/globals.css': TOKENS,
      [name]: write({}),
      'app/page.tsx': RED,
    });
    const eslint = eslintFor(root);
    const reported = () => lint(eslint, root, ['app/page.tsx']);
    expect(await reported()).toEqual(['app/page.tsx:1:38 onsystem/no-hardcoded-color']);
    fs.writeFileSync(path.join(root, name), write({ 'no-hardcoded-color': 'off' }));
    await sleep(2100);
    await expect.poll(reported, { timeout: 10_000, interval: 100 }).toEqual([]);
  });

  it('says why once the config breaks, and checks again once it is fixed', async () => {
    const root = fixture({
      'components/ui/button.tsx': BUTTON,
      'app/globals.css': TOKENS,
      'onsystem.config.json': '{}',
      'app/page.tsx': RED,
    });
    const eslint = eslintFor(root);
    const messages = async () =>
      (await eslint.lintFiles(['app/page.tsx'])).flatMap((r) =>
        r.messages.map((m) => m.message.split(':')[0]?.split('.')[0]),
      );
    const color = 'Hardcoded color `bg-[#ff0000]`';
    expect(await messages()).toEqual([color]);
    fs.writeFileSync(path.join(root, 'onsystem.config.json'), '{ "components": 42 }');
    await sleep(2100);
    await expect
      .poll(messages, { timeout: 10_000, interval: 100 })
      .toEqual(['onsystem could not check this file']);
    fs.writeFileSync(path.join(root, 'onsystem.config.json'), '{}');
    await sleep(2100);
    await expect.poll(messages, { timeout: 10_000, interval: 100 }).toEqual([color]);
  });

  // One process can lint the same project with two configs (two ESLint configs, or runs from two
  // folders): each gets the design system and rules of its own, not the other's.
  it('keeps two configs of the same project apart', async () => {
    const root = fixture({
      'components/ui/button.tsx': BUTTON,
      'app/globals.css': TOKENS,
      'configs/loud.json': JSON.stringify({ rules: {} }),
      'configs/quiet.json': JSON.stringify({ rules: { 'no-hardcoded-color': 'off' } }),
      'app/page.tsx': RED,
    });
    const lintWith = (config: string) =>
      lint(eslintFor(root, { settings: { onsystem: { root: '.', config } } }), root, [
        'app/page.tsx',
      ]);
    const color = ['app/page.tsx:1:38 onsystem/no-hardcoded-color'];
    expect(await lintWith('configs/loud.json')).toEqual(color);
    expect(await lintWith('configs/quiet.json')).toEqual([]);
    expect(await lintWith('configs/loud.json')).toEqual(color);
  });
});

describe('rule options and suppression comments', () => {
  const PAGE = 'export default () => <div className="bg-[#ff0000] text-[#00ff00]">Hi</div>\n';

  it("takes a rule's options from ESLint's config, over the project's", async () => {
    const root = fixture({
      'components/ui/button.tsx': BUTTON,
      'app/globals.css': TOKENS,
      'onsystem.config.json': JSON.stringify({
        rules: { 'no-hardcoded-color': ['error', { allow: ['#00ff00'] }] },
        overrides: [{ files: 'app/legacy/**', rules: { 'no-hardcoded-color': 'off' } }],
      }),
      'app/page.tsx': PAGE,
      'app/legacy/old.tsx': PAGE,
    });
    // The project's config allows the green, as check does.
    const red = 'app/page.tsx:1:38 onsystem/no-hardcoded-color';
    expect(await checkJson(root, ['app'])).toEqual([red]);
    expect(await lint(eslintFor(root), root, ['app'])).toEqual([red]);
    // ESLint's config allows the red instead: its `allow` takes the place of the project's for
    // that rule. A file the project's config turns the rule off for stays off.
    const allowRed = eslintFor(root, {
      rules: { 'onsystem/no-hardcoded-color': ['error', { allow: ['#FF0000'] }] },
    });
    expect(await lint(allowRed, root, ['app'])).toEqual([
      'app/page.tsx:1:51 onsystem/no-hardcoded-color',
    ]);
  });

  it('rejects an option the rules do not take, as the config does', async () => {
    const root = fixture({ 'components/ui/button.tsx': BUTTON, 'app/page.tsx': RED });
    const eslint = eslintFor(root, {
      rules: { 'onsystem/no-hardcoded-color': ['error', { alow: ['#ff0000'] }] },
    });
    await expect(eslint.lintFiles(['app/page.tsx'])).rejects.toThrow(/alow/);
  });

  it('reports a misspelled rule in a suppression comment, as check does', async () => {
    const root = fixture({
      'components/ui/button.tsx': BUTTON,
      'app/globals.css': TOKENS,
      'app/page.tsx': `// onsystem-disable-next-line no-hardcoded-colour\n${RED}`,
    });
    const expected = [
      'app/page.tsx:1:31 onsystem/suppression',
      'app/page.tsx:2:38 onsystem/no-hardcoded-color',
    ];
    expect((await checkJson(root, ['app'])).sort()).toEqual(expected);
    expect((await lint(eslintFor(root), root, ['app'])).sort()).toEqual(expected);
    // A warning, with check's message.
    const [result] = await eslintFor(root).lintFiles(['app/page.tsx']);
    expect(result?.messages.find((m) => m.ruleId === 'onsystem/suppression')).toMatchObject({
      severity: 1,
      message:
        'Unknown rule "no-hardcoded-colour" in onsystem-disable-next-line, so nothing is suppressed for it. Did you mean "no-hardcoded-color"?',
    });
    // Turned off like any other rule.
    const quiet = eslintFor(root, { rules: { 'onsystem/suppression': 'off' } });
    expect(await lint(quiet, root, ['app'])).toEqual([expected[1]]);
  });

  // ESLint runs the rules in the order the config lists them. A file that could not be checked
  // is said so by the first rule that runs, but not by `suppression`: it would be a warning about
  // a comment.
  it('leaves a file that could not be checked to the other rules, with suppression first', async () => {
    const root = fixture({
      'components/ui/button.tsx': BUTTON,
      'onsystem.config.json': '{ "components": 42 }',
      'app/page.tsx': RED,
    });
    const eslint = new ESLint({
      cwd: root,
      overrideConfigFile: true,
      overrideConfig: [
        { files: ['**/*.{ts,tsx,js,jsx}'], languageOptions: { parser: tseslint.parser } },
        {
          files: ['**/*.tsx'],
          plugins: { onsystem: onsystem as unknown as ESLint.Plugin },
          rules: { 'onsystem/suppression': 'warn' },
        },
        onsystem.configs.recommended,
      ],
    });
    const [result] = await eslint.lintFiles(['app/page.tsx']);
    expect(result?.messages.map((m) => [m.ruleId, m.severity, m.message.split(':')[0]])).toEqual([
      ['onsystem/no-hardcoded-color', 2, 'onsystem could not check this file'],
    ]);
  });
});

describe('the loader worker', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  /** Whether `promise` is still pending once the promises already settled have run. */
  async function pending(promise: Promise<unknown>): Promise<boolean> {
    const marker = Symbol('pending');
    return (await Promise.race([promise, Promise.resolve(marker)])) === marker;
  }

  const button = (variants: string) =>
    `export function Button(props: { variant?: ${variants} }) { return <button {...props} /> }\n`;

  // An editor lints the file in front of it after each pause. Each such lint waited while the
  // worker looked at the design system again, longer the larger it is; now the lint gets the
  // design system already loaded, and the worker looks again in the background once the lint has
  // its answer.
  it('answers ten lints after pauses before looking again, on 400 components', async () => {
    const files: Record<string, string> = {
      'components/ui/button.tsx': button('"default" | "outline"'),
      'app/page.tsx':
        'import { Button } from "../components/ui/button"\nexport default () => <Button variant="ghost" />\n',
    };
    for (let i = 0; i < 400; i++) {
      files[`components/ui/part-${i}.tsx`] =
        `export function Part${i}(props: { tone?: "quiet" | "loud" }) { return <div {...props} /> }\n`;
    }
    const root = fixture(files);
    vi.useFakeTimers({ toFake: ['Date'] });
    const request: LoadRequest = { cwd: root, file: path.join(root, 'app/page.tsx'), known: {} };
    const first = await load(request);
    if (!('version' in first)) throw new Error(`not loaded: ${JSON.stringify(first)}`);
    expect(first.data?.model.components).toHaveLength(401);
    const { version } = first;
    const known = { [first.root]: version };

    const looks = () => vi.mocked(loadTarget).mock.calls.length;
    for (let i = 0; i < 10; i++) {
      vi.setSystemTime(Date.now() + 2500);
      const before = looks();
      const response = await load({ ...request, known });
      // The design system it holds, which the plugin has: no data to send. The look it started
      // has not begun yet: not one part of it ran before the answer.
      expect(response).toEqual({ root: first.root, version });
      expect(looks()).toBe(before);
      expect(await pending(looking())).toBe(true);
      await looking();
      expect(looks()).toBe(before + 1);
    }

    // A change is answered at first with what the worker holds, then from what the look found.
    fs.writeFileSync(
      path.join(root, 'components/ui/button.tsx'),
      button('"default" | "outline" | "ghost"'),
    );
    vi.setSystemTime(Date.now() + 2500);
    expect(await load({ ...request, known })).toEqual({ root: first.root, version });
    await looking();
    const after = await load({ ...request, known });
    if (!('version' in after)) throw new Error(`not loaded: ${JSON.stringify(after)}`);
    expect(after.version).not.toBe(version);
    const updated = after.data?.model.components.find((c) => c.name === 'Button');
    expect(JSON.stringify(updated?.props)).toContain('"ghost"');
  }, 60_000);

  it('sends the config again when only its rules change', async () => {
    const root = fixture({
      'components/ui/button.tsx': BUTTON,
      'onsystem.config.json': JSON.stringify({ rules: {} }),
      'app/page.tsx': RED,
    });
    vi.useFakeTimers({ toFake: ['Date'] });
    const request: LoadRequest = { cwd: root, file: path.join(root, 'app/page.tsx'), known: {} };
    const first = await load(request);
    if (!('version' in first)) throw new Error(`not loaded: ${JSON.stringify(first)}`);
    const known = { [first.root]: first.version };
    fs.writeFileSync(
      path.join(root, 'onsystem.config.json'),
      JSON.stringify({ rules: { 'no-hardcoded-color': 'off' } }),
    );
    vi.setSystemTime(Date.now() + 2500);
    expect(await load({ ...request, known })).toEqual({ root: first.root, version: first.version });
    await looking();
    const after = await load({ ...request, known });
    if (!('version' in after)) throw new Error(`not loaded: ${JSON.stringify(after)}`);
    expect(after.version).not.toBe(first.version);
    expect(after.data?.config.rules['no-hardcoded-color'].severity).toBe('off');
    // The same model: nothing it is built from changed.
    expect(after.data?.model).toEqual(first.data?.model);
  });
});
