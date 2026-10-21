import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { main, type Io } from '../src/cli.js';
import { fixture } from './helpers.js';

// Baseline entries are keyed by path. A file that is renamed or moved (`git mv`, a folder of
// route groups reorganised) keeps its findings under a path the baseline does not know, and the
// file it was is gone: `check .` used to fail on every finding it had, with no word about the
// entries left behind.

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
const BILLING = [
  'export const Billing = () => (',
  '  <section className="bg-[#f7f7f7]">',
  '    <p className="text-slate-500">Plan</p>',
  '    <p className="text-slate-500">Seats</p>',
  '    <button>Upgrade</button>',
  '  </section>',
  ')',
  '',
].join('\n');
const project = (files: Record<string, string> = {}) =>
  fixture({
    'components/ui/button.tsx': BUTTON,
    'app/globals.css': ':root { --primary: oklch(0.205 0 0); --muted: #f4f4f5; }',
    'app/page.tsx': 'export default () => <p className="text-primary">Hi</p>',
    'app/legacy/old-billing.tsx': BILLING,
    ...files,
  });

interface BaselineFile {
  files: Record<string, Record<string, Record<string, number>>>;
}
const baselineOf = (root: string) =>
  JSON.parse(fs.readFileSync(path.join(root, 'onsystem.baseline.json'), 'utf8')) as BaselineFile;
const move = (root: string, from: string, to: string) => {
  fs.mkdirSync(path.dirname(path.join(root, to)), { recursive: true });
  fs.renameSync(path.join(root, from), path.join(root, to));
};

describe('a baseline after a file is renamed or moved', () => {
  it('accepts the findings recorded under the old path, says so, and --prune-baseline records the new one', async () => {
    const root = project();
    const recorded = await run(['check', '.', '--update-baseline', '--no-cache'], root);
    expect(recorded.stdout).toBe('Baseline: 4 findings in 1 file → onsystem.baseline.json');
    const entries = baselineOf(root).files['app/legacy/old-billing.tsx'];
    expect(entries).toBeDefined();

    move(root, 'app/legacy/old-billing.tsx', 'app/legacy/billing-v1.tsx');
    const checked = await run(['check', '.', '--no-cache'], root);
    expect(checked.code).toBe(0);
    expect(checked.stdout.split('\n')).toEqual([
      'No new problems in 2 files (4 in the baseline; 1 design-system file skipped).',
      'Baseline: app/legacy/billing-v1.tsx has the findings recorded for app/legacy/old-billing.tsx, which no longer exists, so they are accepted as moved. Run `check . --prune-baseline` to record the new path.',
    ]);
    const github = await run(['check', '.', '--no-cache', '--format', 'github'], root);
    expect(github.code).toBe(0);
    expect(github.stdout).toBe(
      '::notice title=onsystem baseline::Baseline: app/legacy/billing-v1.tsx has the findings recorded for app/legacy/old-billing.tsx, which no longer exists, so they are accepted as moved. Run `check . --prune-baseline` to record the new path.',
    );
    const json = await run(['check', '.', '--no-cache', '--format', 'json'], root);
    expect(
      (JSON.parse(json.stdout) as { file: string; baselined: number }[]).map((r) => [
        r.file,
        r.baselined,
      ]),
    ).toEqual([
      ['app/legacy/billing-v1.tsx', 4],
      ['app/page.tsx', 0],
    ]);

    // Pruning moves the entries to the new path, and accepts nothing new.
    const pruned = await run(['check', '.', '--prune-baseline', '--no-cache'], root);
    expect(pruned.code).toBe(0);
    expect(pruned.stdout.split('\n')).toEqual([
      'No new problems in 2 files (4 in the baseline; 1 design-system file skipped).',
      'Baseline: moved the findings of 1 file to its new path; 4 findings in 1 file → onsystem.baseline.json',
    ]);
    expect(baselineOf(root).files).toEqual({ 'app/legacy/billing-v1.tsx': entries });
    expect(await run(['check', '.', '--no-cache'], root)).toMatchObject({
      code: 0,
      stdout: 'No new problems in 2 files (4 in the baseline; 1 design-system file skipped).',
    });
  });

  it('accepts no more than were recorded: a finding the move adds is new', async () => {
    const root = project();
    await run(['check', '.', '--update-baseline', '--no-cache'], root);
    // Moved out of app/ with one of its colors changed.
    move(root, 'app/legacy/old-billing.tsx', 'features/billing/plan.tsx');
    const plan = path.join(root, 'features/billing/plan.tsx');
    fs.writeFileSync(
      plan,
      fs.readFileSync(plan, 'utf8').replace('text-slate-500">Seats', 'bg-[#f4f4f4]">Seats'),
    );

    const checked = await run(['check', '.', '--no-cache'], root);
    expect(checked.code).toBe(1);
    expect(checked.stdout).toContain('bg-[#f4f4f4]');
    expect(checked.stdout).toContain(
      '1 error, 0 warnings in 1 of 2 files checked (3 in the baseline; 1 design-system file skipped)',
    );
    // The second text-slate-500 it no longer has is what no longer occurs.
    expect(checked.stdout).toContain(
      '1 baseline finding no longer occurs: run `check . --prune-baseline` to drop it.',
    );
    expect(checked.stdout).toContain(
      'Baseline: features/billing/plan.tsx has the findings recorded for app/legacy/old-billing.tsx',
    );

    const pruned = await run(['check', '.', '--prune-baseline', '--no-cache'], root);
    expect(pruned.code).toBe(1);
    expect(pruned.stdout.split('\n').at(-1)).toBe(
      'Baseline: moved the findings of 1 file to its new path; dropped 1 finding that no longer occurs; 3 findings in 1 file → onsystem.baseline.json',
    );
    expect(Object.keys(baselineOf(root).files)).toEqual(['features/billing/plan.tsx']);
  });

  it('pairs each file that no longer exists with one file, and only when half the findings match', async () => {
    const root = project({
      'app/legacy/invoices.tsx': 'export const I = () => <p className="bg-[#eeeeee]">x</p>',
    });
    await run(['check', '.', '--update-baseline', '--no-cache'], root);
    // Two copies of the billing page and none of the original: one copy takes its entries.
    fs.writeFileSync(path.join(root, 'app/billing-a.tsx'), BILLING);
    fs.writeFileSync(path.join(root, 'app/billing-b.tsx'), BILLING);
    fs.rmSync(path.join(root, 'app/legacy/old-billing.tsx'));
    // The invoices page, rewritten under a new name: one finding of six matches.
    fs.rmSync(path.join(root, 'app/legacy/invoices.tsx'));
    fs.writeFileSync(
      path.join(root, 'app/invoices.tsx'),
      'export const I = () => <div className="bg-[#eeeeee] text-[#111111] text-[#222222] text-[#333333] text-[#444444] text-[#555555]">x</div>',
    );

    const checked = await run(['check', '.', '--no-cache'], root);
    expect(checked.code).toBe(1);
    expect(checked.stdout).toContain('app/billing-b.tsx');
    expect(checked.stdout).not.toMatch(/^app\/billing-a\.tsx$/m);
    expect(checked.stdout).toMatch(/^app\/invoices\.tsx$/m);
    expect(checked.stdout).toContain(
      '10 errors, 0 warnings in 2 of 4 files checked (4 in the baseline; 1 design-system file skipped)',
    );
    // The invoices page's entry is left over.
    expect(checked.stdout).toContain(
      '1 baseline finding no longer occurs: run `check . --prune-baseline` to drop it.',
    );
    expect(checked.stdout).toContain(
      'Baseline: app/billing-a.tsx has the findings recorded for app/legacy/old-billing.tsx',
    );
  });

  it('names several moves at once', async () => {
    const root = project({
      'app/legacy/invoices.tsx': 'export const I = () => <p className="bg-[#eeeeee]">x</p>',
    });
    await run(['check', '.', '--update-baseline', '--no-cache'], root);
    move(root, 'app/legacy/old-billing.tsx', 'app/(billing)/billing.tsx');
    move(root, 'app/legacy/invoices.tsx', 'app/(billing)/invoices.tsx');
    const checked = await run(['check', 'app', '--no-cache'], root);
    expect(checked.code).toBe(0);
    expect(checked.stdout.split('\n').at(-1)).toBe(
      'Baseline: 2 files have the findings recorded for files that no longer exist, so they are accepted as moved (app/legacy/old-billing.tsx → app/(billing)/billing.tsx and app/legacy/invoices.tsx → app/(billing)/invoices.tsx). Run `check app --prune-baseline` to record the new paths.',
    );
  });
});

describe('baseline entries of files that no longer exist', () => {
  it('are counted as no longer occurring when the run covers their folder', async () => {
    const root = project();
    await run(['check', '.', '--update-baseline', '--no-cache'], root);
    fs.rmSync(path.join(root, 'app/legacy/old-billing.tsx'));

    for (const [folder, skipped] of [
      ['.', '; 1 design-system file skipped'],
      ['app', ''],
    ] as const) {
      const checked = await run(['check', folder, '--no-cache'], root);
      expect(checked.code).toBe(0);
      expect(checked.stdout.split('\n')).toEqual([
        `No new problems in 1 file (0 in the baseline${skipped}).`,
        `4 baseline findings no longer occur: run \`check ${folder} --prune-baseline\` to drop them.`,
      ]);
    }
    // A run of one file says nothing about the rest of the baseline.
    expect((await run(['check', 'app/page.tsx', '--no-cache'], root)).stdout).toBe(
      'No new problems in 1 file (0 in the baseline).',
    );
    const pruned = await run(['check', '.', '--prune-baseline', '--no-cache'], root);
    expect(pruned.stdout.split('\n').at(-1)).toBe(
      'Baseline: dropped 4 findings that no longer occur; 0 findings in 0 files → onsystem.baseline.json',
    );
  });
});
