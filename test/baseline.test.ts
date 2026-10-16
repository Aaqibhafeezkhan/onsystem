import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { main, type Io } from '../src/cli.js';
import { VERSION } from '../src/version.js';
import { fixture } from './helpers.js';

async function run(args: string[], cwd: string) {
  const out: string[] = [];
  const err: string[] = [];
  const io: Io = {
    cwd,
    color: false,
    stdout: (t) => out.push(t),
    stderr: (t) => err.push(t),
    env: {},
  };
  const code = await main(args, io);
  return { code, stdout: out.join('\n'), stderr: err.join('\n') };
}

const BUTTON =
  'export function Button(props: React.ComponentProps<"button">) { return <button {...props} /> }';
const TOKENS = 'app/globals.css';
const page = (className: string) => `export default () => <p className="${className}">Hi</p>`;
const project = (files: Record<string, string> = {}) =>
  fixture({
    'components/ui/button.tsx': BUTTON,
    [TOKENS]: ':root { --primary: oklch(0.205 0 0); --destructive: #ef4444; }',
    'app/page.tsx': page('text-slate-500'),
    'app/form.tsx': 'export const Form = () => <button>Send</button>',
    ...files,
  });

interface BaselineFile {
  version: number;
  onsystem?: string;
  rules?: string[];
  files: Record<string, Record<string, Record<string, number>>>;
}
const read = (file: string) => JSON.parse(fs.readFileSync(file, 'utf8')) as BaselineFile;
const baselineOf = (root: string) => read(path.join(root, 'onsystem.baseline.json'));

describe('the hint for baseline findings that no longer occur', () => {
  // An error fixed and another added in the same change: the hint used to say
  // `check app --update-baseline`, which records the new error along with dropping the old one.
  it('suggests --prune-baseline, which drops what no longer occurs and accepts nothing new', async () => {
    const root = project();
    expect((await run(['check', 'app', '--update-baseline', '--no-cache'], root)).code).toBe(0);
    fs.writeFileSync(path.join(root, 'app/page.tsx'), page('text-red-500'));

    const checked = await run(['check', 'app', '--no-cache'], root);
    expect(checked.code).toBe(1);
    expect(checked.stdout).toContain('text-red-500');
    expect(checked.stdout.split('\n').at(-1)).toBe(
      '1 baseline finding no longer occurs: run `check app --prune-baseline` to drop it.',
    );
    expect(checked.stdout).not.toContain('--update-baseline');

    // Following the hint drops the fixed entry, still fails on the new error, and leaves it out.
    const pruned = await run(['check', 'app', '--prune-baseline', '--no-cache'], root);
    expect(pruned.code).toBe(1);
    expect(pruned.stdout).toContain('text-red-500');
    expect(pruned.stdout.split('\n').at(-1)).toBe(
      'Baseline: dropped 1 finding that no longer occurs; 1 finding in 1 file → onsystem.baseline.json',
    );
    expect(baselineOf(root).files).toEqual({
      'app/form.tsx': { 'prefer-design-system-component': { button: 1 } },
    });
    const after = await run(['check', 'app', '--no-cache'], root);
    expect(after.code).toBe(1);
    expect(after.stdout).toContain('text-red-500');
    expect(after.stdout).not.toContain('no longer');

    // With nothing left to drop, the file is not rewritten.
    const before = fs.readFileSync(path.join(root, 'onsystem.baseline.json'), 'utf8');
    const again = await run(['check', 'app', '--prune-baseline', '--no-cache'], root);
    expect(again.stdout.split('\n').at(-1)).toBe(
      'Baseline: nothing to drop; 1 finding in 1 file → onsystem.baseline.json',
    );
    expect(fs.readFileSync(path.join(root, 'onsystem.baseline.json'), 'utf8')).toBe(before);
  });

  it('keeps --baseline and the options that decide the findings, so it rewrites the same file', async () => {
    const root = project({ 'app/page.test.tsx': page('text-red-600') });
    const custom = path.join(root, 'ci/accepted.json');
    const options = ['--baseline', 'ci/accepted.json', '--include-tests', '--tokens', TOKENS];
    // The folder is created, as export --out does.
    const recorded = await run(
      ['check', 'app', '--update-baseline', ...options, '--no-cache'],
      root,
    );
    expect(recorded).toMatchObject({ code: 0, stderr: '' });
    expect(recorded.stdout).toBe(
      `Baseline: 3 findings in 3 files → ${path.join('ci', 'accepted.json')}`,
    );
    expect(Object.keys(read(custom).files)).toEqual([
      'app/form.tsx',
      'app/page.test.tsx',
      'app/page.tsx',
    ]);

    fs.writeFileSync(path.join(root, 'app/page.test.tsx'), page('text-primary'));
    const hint =
      '1 baseline finding no longer occurs: run `check app --tokens app/globals.css --baseline ci/accepted.json --include-tests --prune-baseline` to drop it.';
    const checked = await run(['check', 'app', ...options, '--no-cache'], root);
    expect(checked.stdout.split('\n').at(-1)).toBe(hint);
    const github = await run(
      ['check', 'app', ...options, '--no-cache', '--format', 'github'],
      root,
    );
    expect(github.stdout).toBe(`::notice title=onsystem baseline::${hint}`);

    expect(
      (await run(['check', 'app', ...options, '--prune-baseline', '--no-cache'], root)).code,
    ).toBe(0);
    expect(fs.existsSync(path.join(root, 'onsystem.baseline.json'))).toBe(false);
    expect(Object.keys(read(custom).files)).toEqual(['app/form.tsx', 'app/page.tsx']);
    expect((await run(['check', 'app', ...options, '--no-cache'], root)).stdout).toBe(
      'No new problems in 3 files (2 in the baseline).',
    );

    // From another folder, with --root and --config as given.
    fs.writeFileSync(path.join(root, 'onsystem.config.json'), JSON.stringify({ tokens: [TOKENS] }));
    await run(
      ['check', '.', '--update-baseline', '--root', '..', '--no-cache'],
      path.join(root, 'app'),
    );
    fs.writeFileSync(path.join(root, 'app/page.tsx'), page('text-primary'));
    const nested = await run(
      ['check', '.', '--root', '..', '--config', '../onsystem.config.json', '--no-cache'],
      path.join(root, 'app'),
    );
    expect(nested.stdout.split('\n').at(-1)).toBe(
      '1 baseline finding no longer occurs: run `check . --root .. --config ../onsystem.config.json --prune-baseline` to drop it.',
    );
  });

  it('keeps entries it cannot judge: files not checked, rules turned off, and adds nothing', async () => {
    const root = project({ 'app/other.tsx': page('bg-[#f7f7f7]') });
    await run(['check', 'app', '--update-baseline', '--no-cache'], root);
    fs.writeFileSync(
      path.join(root, 'onsystem.config.json'),
      JSON.stringify({ tokens: [TOKENS], rules: { 'prefer-design-system-component': 'off' } }),
    );
    fs.writeFileSync(path.join(root, 'app/page.tsx'), page('text-primary text-red-500'));
    fs.rmSync(path.join(root, 'app/other.tsx'));

    const pruned = await run(
      ['check', 'app/page.tsx', 'app/form.tsx', '--prune-baseline', '--no-cache'],
      root,
    );
    expect(pruned.code).toBe(1);
    // page.tsx's fixed color and the deleted file go; form.tsx's entry stays while its rule is off.
    expect(pruned.stdout.split('\n').at(-1)).toBe(
      'Baseline: dropped 2 findings that no longer occur; 1 finding in 1 file → onsystem.baseline.json',
    );
    expect(baselineOf(root).files).toEqual({
      'app/form.tsx': { 'prefer-design-system-component': { button: 1 } },
    });
  });

  it('refuses --prune-baseline without a baseline, or with --update-baseline or --ignore-baseline', async () => {
    const root = project();
    expect(await run(['check', 'app', '--prune-baseline', '--no-cache'], root)).toEqual({
      code: 2,
      stdout: '',
      stderr:
        'check --prune-baseline: no baseline to prune at onsystem.baseline.json. Pass --baseline <file> to prune another one, or record the current findings with `check app --update-baseline`.',
    });
    await run(['check', 'app', '--update-baseline', '--no-cache'], root);
    for (const other of ['--update-baseline', '--ignore-baseline']) {
      expect(await run(['check', 'app', '--prune-baseline', other], root)).toEqual({
        code: 2,
        stdout: '',
        stderr: `check: pass --prune-baseline or ${other}, not both`,
      });
    }
  });
});

describe('--update-baseline', () => {
  it('keeps stdout for the findings with --format json, sarif or github', async () => {
    const root = project();
    for (const format of ['json', 'sarif', 'github']) {
      const updated = await run(
        ['check', 'app', '--update-baseline', '--no-cache', '--format', format],
        root,
      );
      expect(updated).toEqual({
        code: 0,
        stdout: '',
        stderr: 'Baseline: 2 findings in 2 files → onsystem.baseline.json',
      });
    }
  });
});

describe('a baseline written before a rule ran', () => {
  const noColors = () => {
    const root = project();
    fs.rmSync(path.join(root, TOKENS));
    return root;
  };

  it('records the onsystem version and the rules that ran', async () => {
    const root = noColors();
    await run(['check', 'app', '--update-baseline', '--no-cache'], root);
    const baseline = baselineOf(root);
    expect(Object.keys(baseline)).toEqual(['version', 'onsystem', 'rules', 'files']);
    expect(baseline.version).toBe(1);
    expect(baseline.onsystem).toBe(VERSION);
    // No color tokens: no-hardcoded-color did not run.
    expect(baseline.rules).toEqual([
      'icon-button-accessible-name',
      'no-unknown-component',
      'no-unknown-prop',
      'no-unknown-variant',
      'prefer-design-system-component',
    ]);
  });

  it('says that its findings were not recorded rather than new, and what accepting them takes', async () => {
    const root = noColors();
    await run(['check', 'app', '--update-baseline', '--no-cache'], root);
    const baseline = baselineOf(root);
    fs.writeFileSync(
      path.join(root, 'onsystem.baseline.json'),
      JSON.stringify({ ...baseline, onsystem: '0.6.0' }),
    );
    // The theme is found now, as when an upgrade reads tokens an older version missed.
    fs.writeFileSync(path.join(root, TOKENS), ':root { --destructive: #ef4444; }');
    const line =
      'no-hardcoded-color did not run when the baseline was written (onsystem 0.6.0), so its 1 finding is new to the baseline, not necessarily to the code. To accept it, run `check app --update-baseline`.';
    const checked = await run(['check', 'app', '--no-cache'], root);
    expect(checked.code).toBe(1);
    expect(checked.stdout.split('\n').at(-1)).toBe(line);
    const github = await run(['check', 'app', '--no-cache', '--format', 'github'], root);
    expect(github.stdout.split('\n').at(-1)).toBe(`::notice title=onsystem baseline::${line}`);
    const json = await run(['check', 'app', '--no-cache', '--format', 'json'], root);
    expect(JSON.parse(json.stdout)).toHaveLength(2);
    expect(json.stderr).toBe(line);

    // A new finding of a rule that did run is counted apart, and named in what the update accepts.
    fs.appendFileSync(path.join(root, 'app/form.tsx'), '\nexport const More = () => <button />');
    const mixed = await run(['check', 'app', '--no-cache'], root);
    expect(mixed.stdout.split('\n').at(-1)).toBe(
      'no-hardcoded-color did not run when the baseline was written (onsystem 0.6.0), so its 1 finding is new to the baseline, not necessarily to the code. To accept it, run `check app --update-baseline`, which also accepts the 1 other new finding.',
    );

    // Recorded again: the rule ran, and the line goes.
    await run(['check', 'app', '--update-baseline', '--no-cache'], root);
    expect(baselineOf(root).rules).toContain('no-hardcoded-color');
    expect(await run(['check', 'app', '--no-cache'], root)).toMatchObject({
      code: 0,
      stdout: 'No new problems in 2 files (3 in the baseline).',
    });
  });

  it('escapes the line for GitHub with --format github', async () => {
    const root = noColors();
    const options = ['--baseline', 'ci/100%.json'];
    await run(['check', 'app', '--update-baseline', ...options, '--no-cache'], root);
    fs.writeFileSync(path.join(root, TOKENS), ':root { --destructive: #ef4444; }');
    const github = await run(
      ['check', 'app', ...options, '--no-cache', '--format', 'github'],
      root,
    );
    // `%` would otherwise be read as the start of an escape.
    expect(github.stdout.split('\n').at(-1)).toBe(
      `::notice title=onsystem baseline::no-hardcoded-color did not run when the baseline was written (onsystem ${VERSION}), so its 1 finding is new to the baseline, not necessarily to the code. To accept it, run \`check app --baseline "ci/100%25.json" --update-baseline\`.`,
    );
  });

  it('reads a baseline without the version or the rules as before, and says nothing about them', async () => {
    const root = noColors();
    await run(['check', 'app', '--update-baseline', '--no-cache'], root);
    const { files } = baselineOf(root);
    fs.writeFileSync(
      path.join(root, 'onsystem.baseline.json'),
      JSON.stringify({ version: 1, files }),
    );
    fs.writeFileSync(path.join(root, TOKENS), ':root { --destructive: #ef4444; }');
    const checked = await run(['check', 'app', '--no-cache'], root);
    expect(checked.code).toBe(1);
    expect(checked.stdout.split('\n').at(-1)).toBe(
      '1 error, 0 warnings in 1 of 2 files checked (1 in the baseline)',
    );
  });

  // A baseline as 0.6.0 writes it: no version, no rules.
  const legacy = (root: string) => {
    const { files } = baselineOf(root);
    fs.writeFileSync(
      path.join(root, 'onsystem.baseline.json'),
      JSON.stringify({ version: 1, files }),
    );
  };

  // apps/web has color tokens; apps/docs has none, so no-hardcoded-color runs only in apps/web.
  const workspace = (web: string) =>
    fixture({
      'pnpm-workspace.yaml': 'packages:\n  - apps/*\n',
      'package.json': JSON.stringify({ name: 'acme', private: true }),
      'apps/web/package.json': JSON.stringify({ name: '@acme/web' }),
      'apps/web/app/globals.css': ':root { --destructive: #ef4444; }',
      'apps/web/app/page.tsx': page(web),
      'apps/docs/package.json': JSON.stringify({ name: '@acme/docs' }),
      'apps/docs/app/page.tsx': 'export default () => <button><svg /></button>',
    });

  it('leaves the rules out when an update of part of such a baseline keeps entries it did not check', async () => {
    const root = workspace('text-slate-500');
    await run(['check', '.', '--update-baseline', '--no-cache'], root);
    legacy(root);

    // no-hardcoded-color did not run in apps/docs, but it did when apps/web's entry was recorded.
    await run(['check', 'apps/docs', '--update-baseline', '--no-cache'], root);
    const partial = baselineOf(root);
    expect(Object.keys(partial)).toEqual(['version', 'onsystem', 'files']);
    expect(partial.files).toEqual({
      'apps/docs/app/page.tsx': { 'icon-button-accessible-name': { button: 1 } },
      'apps/web/app/page.tsx': { 'no-hardcoded-color': { 'text-slate-500': 1 } },
    });

    // A new color in apps/web is a regression, not a rule that started to run.
    fs.writeFileSync(path.join(root, 'apps/web/app/page.tsx'), page('text-slate-500 text-red-500'));
    const checked = await run(['check', '.', '--no-cache'], root);
    expect(checked.code).toBe(1);
    expect(checked.stdout).toContain('text-red-500');
    expect(checked.stdout).not.toContain('did not run when the baseline was written');
    expect(checked.stdout).not.toContain('--update-baseline');
  });

  it('leaves them out after an update below the root, even where the rest has no entries', async () => {
    // apps/web is clean, so the update keeps no entries it did not check.
    const root = workspace('font-bold');
    await run(['check', '.', '--update-baseline', '--no-cache'], root);
    legacy(root);
    await run(['check', 'apps/docs', '--update-baseline', '--no-cache'], root);
    expect(baselineOf(root).rules).toBeUndefined();

    fs.writeFileSync(path.join(root, 'apps/web/app/page.tsx'), page('text-red-500'));
    const checked = await run(['check', '.', '--no-cache'], root);
    expect(checked.code).toBe(1);
    expect(checked.stdout).toContain('text-red-500');
    expect(checked.stdout).not.toContain('did not run when the baseline was written');

    // An update from the root records them.
    await run(['check', '.', '--update-baseline', '--no-cache'], root);
    expect(baselineOf(root).rules).toContain('no-hardcoded-color');
  });

  it('does the same when an override turns the rule off for the folder updated', async () => {
    const root = project({ 'app/docs/page.tsx': page('font-bold') });
    await run(['check', 'app', '--update-baseline', '--no-cache'], root);
    legacy(root);
    fs.writeFileSync(
      path.join(root, 'onsystem.config.json'),
      JSON.stringify({
        tokens: [TOKENS],
        overrides: [{ files: ['app/docs/**'], rules: { 'no-hardcoded-color': 'off' } }],
      }),
    );
    await run(['check', 'app/docs', '--update-baseline', '--no-cache'], root);
    expect(baselineOf(root).rules).toBeUndefined();

    fs.writeFileSync(path.join(root, 'app/page.tsx'), page('text-slate-500 text-red-500'));
    const checked = await run(['check', 'app', '--no-cache'], root);
    expect(checked.code).toBe(1);
    expect(checked.stdout).toContain('text-red-500');
    expect(checked.stdout).not.toContain('did not run when the baseline was written');
  });

  it('counts a rule with entries in the baseline as run, even when it is off for the update', async () => {
    const root = project();
    await run(['check', 'app', '--update-baseline', '--no-cache'], root);
    legacy(root);
    // Off everywhere: page.tsx's color entry is kept, and the rule ran when it was recorded.
    fs.writeFileSync(
      path.join(root, 'onsystem.config.json'),
      JSON.stringify({ tokens: [TOKENS], rules: { 'no-hardcoded-color': 'off' } }),
    );
    await run(['check', '.', '--update-baseline', '--no-cache'], root);
    const updated = baselineOf(root);
    expect(updated.rules).toContain('no-hardcoded-color');
    expect(updated.files['app/page.tsx']).toEqual({
      'no-hardcoded-color': { 'text-slate-500': 1 },
    });

    fs.rmSync(path.join(root, 'onsystem.config.json'));
    fs.writeFileSync(path.join(root, 'app/page.tsx'), page('text-slate-500 text-red-500'));
    const checked = await run(['check', 'app', '--no-cache'], root);
    expect(checked.code).toBe(1);
    expect(checked.stdout).toContain('text-red-500');
    expect(checked.stdout).not.toContain('did not run when the baseline was written');
  });

  it('keeps the version and the rules as they were when pruning', async () => {
    const root = noColors();
    await run(['check', 'app', '--update-baseline', '--no-cache'], root);
    const before = baselineOf(root);
    fs.writeFileSync(path.join(root, TOKENS), ':root { --destructive: #ef4444; }');
    fs.writeFileSync(path.join(root, 'app/form.tsx'), 'export const Form = () => <p />');
    await run(['check', 'app', '--prune-baseline', '--no-cache'], root);
    expect(baselineOf(root)).toEqual({ ...before, files: {} });
  });

  it('rejects a version or rules of the wrong type', async () => {
    const root = project();
    for (const extra of [{ onsystem: 6 }, { rules: 'no-hardcoded-color' }, { rules: [1] }]) {
      fs.writeFileSync(
        path.join(root, 'onsystem.baseline.json'),
        JSON.stringify({ version: 1, ...extra, files: {} }),
      );
      const checked = await run(['check', 'app', '--no-cache'], root);
      expect(checked.code).toBe(2);
      expect(checked.stderr).toContain('is not a valid onsystem baseline');
    }
  });
});
