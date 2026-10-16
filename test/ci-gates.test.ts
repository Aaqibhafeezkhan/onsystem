import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import config from '../vitest.config.js';

// What CI holds a change to besides passing tests: the coverage of src/ and action/ can't drop
// below the thresholds in vitest.config.ts (one job measures it, on Node 24, and writes it to the
// job summary; the other test jobs run without it, at full speed), the tests run on Node 22, 24
// and 26, and the package is packed, installed and run on Node 20.19, the oldest Node that
// package.json admits.

interface Step {
  name?: string;
  if?: string;
  uses?: string;
  run?: string;
  with?: Record<string, string | number>;
}

interface Job {
  name?: string;
  'runs-on'?: string;
  strategy?: { matrix?: Record<string, unknown[]> };
  steps: Step[];
}

const root = path.resolve(import.meta.dirname, '..');
const jobs = (
  parse(fs.readFileSync(path.join(root, '.github/workflows/ci.yml'), 'utf8')) as {
    jobs: Record<string, Job | undefined>;
  }
).jobs;
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as {
  engines: { node: string };
  scripts: Record<string, string>;
  devDependencies: Record<string, string>;
};
const coverage = config.test?.coverage;

/** The Node version a job's setup-node step (the first, or the one at `index`) installs. */
function nodeVersion(job: Job | undefined, index = 0): string | undefined {
  const setup = job?.steps.filter((step) => step.uses?.startsWith('actions/setup-node@'))[index];
  const version = setup?.with?.['node-version'];
  return version === undefined ? undefined : String(version);
}

/** The jobs that run the test suite, by the command they run it with. */
function testRuns(): { job: string; run: string }[] {
  return Object.entries(jobs).flatMap(([job, value]) =>
    (value?.steps ?? [])
      .map((step) => step.run?.trim() ?? '')
      .filter((run) => /^pnpm (test|vitest)\b/.test(run))
      .map((run) => ({ job, run })),
  );
}

describe('coverage', () => {
  it('is measured with Istanbul over src/ and action/, only when asked for', () => {
    expect(coverage?.provider).toBe('istanbul');
    expect(coverage?.include).toEqual(expect.arrayContaining(['src/**', 'action/**']));
    // `pnpm test` stays as fast as it was: coverage runs with `pnpm test:coverage`.
    expect(coverage?.enabled).not.toBe(true);
    expect(pkg.scripts.test).toBe('vitest run');
    expect(pkg.scripts['test:coverage']).toBe('vitest run --coverage');
    // The json-summary report is what CI writes to the job summary.
    expect(coverage?.reporter).toEqual(expect.arrayContaining(['json-summary']));
  });

  it('has a floor for lines, branches, functions and statements', () => {
    const thresholds = coverage?.thresholds;
    for (const metric of ['lines', 'branches', 'functions', 'statements'] as const) {
      expect(thresholds?.[metric], metric).toBeGreaterThan(0);
      expect(thresholds?.[metric], metric).toBeLessThanOrEqual(100);
    }
  });

  it('comes from the provider that matches the installed Vitest', () => {
    // Vitest refuses to mix versions with its coverage provider: they move together.
    expect(pkg.devDependencies['@vitest/coverage-istanbul']).toBe(pkg.devDependencies.vitest);
    const installed = (name: string) =>
      (
        JSON.parse(
          fs.readFileSync(path.join(root, 'node_modules', name, 'package.json'), 'utf8'),
        ) as { version: string }
      ).version;
    expect(installed('@vitest/coverage-istanbul')).toBe(installed('vitest'));
  });

  it('runs in one CI job, on Node 24 and Ubuntu, and every other test job runs without it', () => {
    expect(testRuns().filter(({ run }) => run.includes('coverage'))).toEqual([
      { job: 'coverage', run: 'pnpm test:coverage' },
    ]);
    expect(jobs.coverage?.['runs-on']).toBe('ubuntu-latest');
    expect(nodeVersion(jobs.coverage)).toBe('24');
    for (const job of ['test', 'os']) {
      expect(testRuns().filter((run) => run.job === job)).toEqual([{ job, run: 'pnpm test' }]);
    }
  });

  const summary = jobs.coverage?.steps.find((step) => step.run?.includes('GITHUB_STEP_SUMMARY'));
  const hasBash =
    process.platform !== 'win32' && spawnSync('sh', ['-c', 'command -v bash']).status === 0;

  /** Runs the summary step in bash, in a new folder holding `report` as the json-summary. */
  function writeSummary(report?: unknown) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'coverage-step-'));
    try {
      if (report !== undefined) {
        fs.mkdirSync(path.join(dir, 'coverage'));
        fs.writeFileSync(path.join(dir, 'coverage/coverage-summary.json'), JSON.stringify(report));
      }
      fs.writeFileSync(path.join(dir, 'step.sh'), summary?.run ?? 'exit 1');
      const file = path.join(dir, 'step-summary.md');
      const result = spawnSync('bash', ['--noprofile', '--norc', '-eo', 'pipefail', 'step.sh'], {
        cwd: dir,
        env: {
          PATH: `${path.dirname(process.execPath)}:/usr/bin:/bin`,
          GITHUB_STEP_SUMMARY: file,
        },
        encoding: 'utf8',
      });
      const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
      return { status: result.status, stderr: result.stderr, text };
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  it('writes the totals to the job summary, also when a threshold fails', () => {
    expect(summary?.if).toBe('${{ !cancelled() }}');
    const steps = jobs.coverage?.steps ?? [];
    const measure = steps.findIndex((step) => step.run === 'pnpm test:coverage');
    expect(measure).toBeGreaterThanOrEqual(0);
    expect(steps.indexOf(summary ?? {})).toBeGreaterThan(measure);
  });

  it.skipIf(!hasBash)('lists each metric with what is covered of the total', () => {
    const metric = (covered: number, total: number) => ({
      total,
      covered,
      skipped: 0,
      pct: Math.round((covered / total) * 10_000) / 100,
    });
    const { status, stderr, text } = writeSummary({
      total: {
        lines: metric(9342, 10_000),
        statements: metric(909, 1000),
        functions: metric(2, 3),
        branches: metric(7389, 8655),
      },
      'src/index.ts': { lines: metric(1, 1) },
    });
    expect(stderr).toBe('');
    expect(status).toBe(0);
    expect(text).toContain('| Lines | 93.42% | 9342 of 10000 |');
    expect(text).toContain('| Statements | 90.9% | 909 of 1000 |');
    expect(text).toContain('| Functions | 66.67% | 2 of 3 |');
    expect(text).toContain('| Branches | 85.37% | 7389 of 8655 |');
    expect(text).not.toContain('src/index.ts');
  });

  it.skipIf(!hasBash)('says there is no report when the tests failed before writing one', () => {
    const { status, text } = writeSummary();
    expect(status).toBe(0);
    expect(text).toMatch(/no coverage report/i);
  });
});

describe('Node versions', () => {
  it('runs the tests on Node 22, 24 and 26', () => {
    expect(jobs.test?.strategy?.matrix?.node).toEqual([22, 24, 26]);
  });

  it('packs, installs and runs the package on Node 20.19, the oldest version it admits', () => {
    expect(pkg.engines.node).toBe('>=20.19');
    const job = jobs.node20;
    const steps = job?.steps ?? [];
    expect(nodeVersion(job, 1)).toBe('20.19');
    const switched = steps.findIndex((step) => step.with?.['node-version'] === '20.19');
    const before = steps.slice(0, switched).map((step) => step.run);
    const after = steps.slice(switched + 1).map((step) => step.run ?? '');
    // Built on Node 24, since the build tools need it; only what the package ships runs on 20.19.
    expect(before).toContain('pnpm build');
    // pnpm itself needs a newer Node, so the pack test's scripts run with node, as `pnpm
    // pack-test` runs them.
    expect(after.filter((run) => /^pnpm\b/m.test(run))).toEqual([]);
    const packTest = pkg.scripts['pack-test']?.split(' && ') ?? [];
    expect(packTest).toEqual(['node scripts/pack-test.mjs', 'node scripts/pack-test-eslint8.mjs']);
    expect(after.filter((run) => packTest.includes(run))).toEqual(packTest);
  });
});
