import { describe, expect, it } from 'vitest';

import { main, type Io } from '../src/cli.js';
import { DEFAULT_EXCLUDE, DEFAULT_TEST_EXCLUDE, loadConfig } from '../src/config.js';
import { fixture } from './helpers.js';

// `exclude` adds to the defaults (node_modules, .d.ts files, tests and stories) instead of
// replacing them. Before, `"exclude": ["components/signoff-ui/**"]`, the advice for a folder
// installed from a registry, left that folder out and started checking every test and story.

const json = (value: unknown) => JSON.stringify(value, null, 2);

const BUTTON =
  'export function Button(props: React.ComponentProps<"button">) { return <button {...props} /> }\n';
const TOKENS = ':root {\n  --primary: oklch(0.2 0 0);\n  --destructive: oklch(0.58 0.22 27);\n}\n';
const RED = 'export default () => <button className="bg-[#ff0000]">Hi</button>\n';

function app(exclude?: string[]): string {
  return fixture({
    'components/ui/button.tsx': BUTTON,
    'app/globals.css': TOKENS,
    'app/page.tsx': RED,
    'app/page.stories.tsx': RED,
    'app/__tests__/page.tsx': RED,
    'app/legacy/old.tsx': RED,
    'components/signoff-ui/diff-review.tsx': RED,
    ...(exclude ? { 'onsystem.config.json': json({ exclude }) } : {}),
  });
}

async function run(args: string[], cwd: string) {
  const out: string[] = [];
  const err: string[] = [];
  const io: Io = { cwd, color: false, stdout: (t) => out.push(t), stderr: (t) => err.push(t) };
  const code = await main(args, io);
  return { code, stdout: out.join('\n'), stderr: err.join('\n') };
}

async function checked(cwd: string, ...args: string[]): Promise<string[]> {
  const { stdout } = await run(['check', '.', ...args, '--format', 'json', '--no-cache'], cwd);
  return (JSON.parse(stdout) as { file: string; diagnostics: unknown[] }[])
    .filter((r) => r.diagnostics.length)
    .map((r) => r.file)
    .sort();
}

describe('exclude adds to the defaults', () => {
  it('keeps tests and stories out when a config leaves out a folder', async () => {
    const root = app(['components/signoff-ui/**', 'app/legacy']);
    expect((await loadConfig({ root })).exclude).toEqual([
      ...DEFAULT_EXCLUDE,
      'components/signoff-ui/**',
      'app/legacy',
    ]);
    expect(await checked(root)).toEqual(['app/page.tsx']);
    const summary = (await run(['check', '.', '--no-cache'], root)).stdout.split('\n').at(-1);
    expect(summary).toContain(
      '(1 design-system file skipped; 2 tests and stories left out; 2 excluded files left out)',
    );
    // --include-tests still checks them for one run.
    expect(await checked(root, '--include-tests')).toEqual([
      'app/__tests__/page.tsx',
      'app/page.stories.tsx',
      'app/page.tsx',
    ]);
  });

  it('repeats nothing for a config that lists the defaults, as configs had to before', async () => {
    const root = app([...DEFAULT_EXCLUDE, 'app/legacy']);
    expect((await loadConfig({ root })).exclude).toEqual([...DEFAULT_EXCLUDE, 'app/legacy']);
  });

  it('takes out a default that a pattern starting with "!" names', async () => {
    const root = app([`!${DEFAULT_TEST_EXCLUDE}`, 'components/signoff-ui']);
    const config = await loadConfig({ root });
    expect(config.exclude).toEqual([
      ...DEFAULT_EXCLUDE.filter((e) => e !== DEFAULT_TEST_EXCLUDE),
      'components/signoff-ui',
    ]);
    expect(config.warnings).toBeUndefined();
    // Stories are checked; the __tests__ folder, another default, stays out.
    expect(await checked(root)).toEqual([
      'app/legacy/old.tsx',
      'app/page.stories.tsx',
      'app/page.tsx',
    ]);
  });

  it('warns about a "!" pattern that names no default', async () => {
    const root = app(['!app/legacy']);
    const config = await loadConfig({ root });
    expect(config.exclude).toEqual(DEFAULT_EXCLUDE);
    expect(config.warnings).toEqual([
      `"!app/legacy" in "exclude" takes out none of the defaults, which are ${DEFAULT_EXCLUDE.map((d) => `"${d}"`).join(', ')}: a pattern that starts with "!" names one of them.`,
    ]);
  });

  it('leaves out the defaults with an empty list, as with none', async () => {
    expect((await loadConfig({ root: app([]) })).exclude).toEqual(DEFAULT_EXCLUDE);
    expect((await loadConfig({ root: app() })).exclude).toEqual(DEFAULT_EXCLUDE);
  });
});
