// The installed-types corpus (scripts/corpus.mjs --installed): the repositories bench/v2 installs,
// checked with their dependencies installed, as users run onsystem. Without them the corpus
// cannot see what types decide (which props and variants a component takes, whether a native
// element's attributes fit a design-system component), so its snapshot and samples say nothing
// about those findings. Its holdout is a frozen draw for a per-rule false-positive rate.
import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import {
  distinctFindings,
  drawHoldout,
  findings,
  fingerprint,
  installedRepos,
  ruleRates,
  typeDriven,
  wilson,
  type BenchRepo,
  type CheckFileResult,
  type CorpusRepo,
  type RuleCounts,
  type Snapshot,
} from '../scripts/corpus-lib.js';

const root = path.resolve(import.meta.dirname, '..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
const readJson = (file: string): unknown => JSON.parse(read(file));

const corpus = () => readJson('corpus/repos.json') as { repos: CorpusRepo[] };
const bench = () => readJson('bench/v2/config/repos.json') as { repos: BenchRepo[] };

const INSTALL = ['pnpm', 'install', '--frozen-lockfile', '--ignore-scripts'];

describe('installed-types corpus', () => {
  const repo: CorpusRepo = {
    name: 'dub',
    url: 'https://github.com/dubinc/dub',
    sha: 'abc',
    paths: ['apps/web', 'packages'],
    runs: [
      { name: 'dub-web', cwd: 'apps/web', check: ['.'] },
      { name: 'dub-ui', cwd: 'packages/ui', check: ['.'] },
      { name: 'dub-web-package', cwd: 'apps/web', init: ['packages/ui'], check: ['.'] },
      {
        name: 'dub-root',
        cwd: '.',
        check: ['.'],
        sameAs: { 'apps/web': 'dub-web', 'packages/ui': 'dub-ui' },
      },
      {
        name: 'dub-again',
        cwd: 'apps/web',
        check: ['.'],
        sameAs: { '.': 'dub-web-package' },
      },
    ],
  };

  it("repeats each bench repository's runs with the install bench/v2 runs, apart from init's copies", () => {
    const [installed] = installedRepos(
      { repos: [repo] },
      { repos: [{ name: 'dub', corpus: 'dub', install: INSTALL }] },
    );
    expect(installed).toMatchObject({
      name: 'dub',
      sha: 'abc',
      paths: ['apps/web', 'packages'],
      command: INSTALL,
    });
    expect(installed?.runs.map((r) => [r.name, r.plain])).toEqual([
      ['dub-web-installed', 'dub-web'],
      ['dub-ui-installed', 'dub-ui'],
      ['dub-root-installed', 'dub-root'],
      ['dub-again-installed', 'dub-again'],
    ]);
    // A root run compares with the installed runs; a comparison with a run left out goes.
    expect(installed?.runs[2]?.sameAs).toEqual({
      'apps/web': 'dub-web-installed',
      'packages/ui': 'dub-ui-installed',
    });
    expect(installed?.runs[3]).not.toHaveProperty('sameAs');
  });

  it('installs from the lockfile with scripts off, or not at all', () => {
    const with_ =
      (install: string[], over: Partial<CorpusRepo> = {}) =>
      () =>
        installedRepos(
          { repos: [{ ...repo, ...over }] },
          { repos: [{ name: 'dub', corpus: 'dub', install }] },
        );
    expect(with_(['npm', 'install', '--frozen-lockfile', '--ignore-scripts'])).toThrow(
      'dub: the installed corpus runs pnpm install, not npm.',
    );
    expect(with_(['pnpm', 'install', '--ignore-scripts'])).toThrow(
      'dub: the install must pass --frozen-lockfile.',
    );
    expect(with_(['pnpm', 'install', '--frozen-lockfile'])).toThrow(
      'dub: the install must pass --ignore-scripts.',
    );
    expect(with_(INSTALL, { install: { before: '2026-08-13', folders: {} } })).toThrow(
      'has pinned packages of its own',
    );
    expect(() =>
      installedRepos(
        { repos: [repo] },
        { repos: [{ name: 'gone', corpus: 'nowhere', install: INSTALL }] },
      ),
    ).toThrow('gone: corpus/repos.json has no repository named nowhere.');
  });

  it("covers the five repositories bench/v2 installs, with bench/v2's own command", () => {
    const repos = installedRepos(corpus(), bench());
    expect(repos.map((r) => r.name)).toEqual([
      'saas-starter',
      'chatbot',
      'shadcn-ui',
      'openstatus',
      'dub',
    ]);
    for (const r of repos) {
      const benchRepo = bench().repos.find((b) => b.corpus === r.name);
      expect(r.command).toEqual(benchRepo?.install);
      const plain = corpus().repos.find((c) => c.name === r.name);
      expect(r.sha).toBe(plain?.sha);
      expect(r.runs.map((run) => run.plain)).toEqual(
        plain?.runs.filter((run) => !run.init).map((run) => run.name),
      );
    }
  });

  it('records a snapshot of the installed runs, apart from the plain one', () => {
    // On main before this change only the two MUI apps got packages, and no snapshot recorded a
    // run with a repository's own dependencies installed. The weekly job keeps this one current,
    // so these tests read it on its own, not against the plain snapshot's latest counts.
    const repos = installedRepos(corpus(), bench());
    const installed = readJson('corpus/snapshot-installed.json') as Snapshot & { version: string };
    const names = Object.keys(installed.runs);
    for (const repo of repos) {
      expect(
        repo.runs.some((run) => names.includes(run.name)),
        repo.name,
      ).toBe(true);
    }
    for (const name of names) expect(name).toMatch(/-installed$/);
    const plain = readJson('corpus/snapshot.json') as Snapshot;
    expect(Object.keys(plain.runs).filter((name) => name.endsWith('-installed'))).toEqual([]);
  });

  it('sees what types decide, which the plain snapshot cannot', () => {
    const runs = installedRepos(corpus(), bench()).flatMap((r) => r.runs);
    const plainName = (name: string) => runs.find((r) => r.name === name)?.plain ?? name;
    const installed = readJson('corpus/snapshot-installed.json') as Snapshot;
    const plain = readJson('corpus/snapshot.json') as Snapshot;
    const rows = typeDriven(installed.runs, plain.runs, plainName);
    const total = (c: RuleCounts | undefined) => (c ? c.errors + c.warnings : 0);
    // Props a component does not take: only its types say which it does.
    expect(rows.some((r) => r.rule === 'no-unknown-prop' && total(r.with) > total(r.without))).toBe(
      true,
    );
    // A native element's fix to a design-system component, once the types show its attributes fit.
    expect(
      rows.some(
        (r) =>
          r.rule === 'prefer-design-system-component' &&
          (r.with?.fixes ?? 0) > (r.without?.fixes ?? 0),
      ),
    ).toBe(true);
  });

  it('lists what installing changes, run by run and rule by rule', () => {
    const counts = (errors: number, fixes = 0): RuleCounts => ({ errors, warnings: 0, fixes });
    const rows = typeDriven(
      {
        'web-installed': {
          rules: { 'no-hardcoded-color': counts(3), 'no-unknown-prop': counts(2) },
        },
        'new-installed': { rules: { 'no-hardcoded-color': counts(1) } },
      },
      {
        web: { rules: { 'no-hardcoded-color': counts(3), 'no-unknown-variant': counts(1) } },
      },
      (name) => name.replace(/-installed$/, ''),
    );
    expect(rows).toEqual([
      { run: 'web-installed', rule: 'no-unknown-prop', without: undefined, with: counts(2) },
      { run: 'web-installed', rule: 'no-unknown-variant', without: counts(1), with: undefined },
    ]);
  });

  it('runs once a week in CI, from the pinned installs, and reports to the job summary', () => {
    interface Step {
      run?: string;
      uses?: string;
    }
    interface Workflow {
      on: { schedule: { cron: string }[] };
      jobs: Record<string, { if?: string; steps: Step[] }>;
    }
    const workflow = parse(read('.github/workflows/corpus.yml')) as Workflow;
    const weekly = workflow.on.schedule.map((s) => s.cron).find((cron) => /\* \* \d$/.test(cron));
    expect(weekly).toBeDefined();
    const job = workflow.jobs.installed;
    expect(job?.if).toContain(`github.event.schedule == '${weekly ?? ''}'`);
    expect(job?.if).toContain("github.event_name == 'workflow_dispatch'");
    // The daily job does not run again on the weekly schedule.
    expect(workflow.jobs.corpus?.if).toBe(`github.event.schedule != '${weekly ?? ''}'`);
    const runs = (job?.steps ?? []).map((s) => s.run ?? '');
    expect(runs).toContain('pnpm --silent corpus fetch --installed');
    expect(runs.some((r) => r.includes('pnpm --silent corpus --installed'))).toBe(true);
    expect(runs.some((r) => r.includes('GITHUB_STEP_SUMMARY'))).toBe(true);
  });
});

describe('a holdout drawn for a rate per rule', () => {
  const at = (file: string, ...diagnostics: [string, string, number][]): CheckFileResult => ({
    file,
    diagnostics: diagnostics.map(([ruleId, source, line]) => ({
      ruleId,
      severity: 'error',
      message: `${source} is wrong`,
      line,
      source,
    })),
  });

  it('draws from distinct findings: no re-check with a config, only what a root run adds', () => {
    const web = findings('web', [at('app/a.tsx', ['no-hardcoded-color', 'red', 1])]);
    const root = findings('root', [
      at('apps/web/app/a.tsx', ['no-hardcoded-color', 'red', 1]),
      at('tools/b.tsx', ['no-hardcoded-color', 'blue', 2]),
    ]);
    const configured = findings('configured', [at('app/a.tsx', ['no-hardcoded-color', 'red', 1])]);
    const population = distinctFindings(
      [
        { name: 'web' },
        { name: 'root', sameAs: { 'apps/web': 'web' } },
        { name: 'configured', config: 'configs/web.json' },
      ],
      { web, root, configured },
    );
    expect(population.map((f) => `${f.run} ${f.file}`)).toEqual([
      'web app/a.tsx',
      'root tools/b.tsx',
    ]);
    expect(() => distinctFindings([{ name: 'missing' }], {})).toThrow(
      'missing: no findings to draw from',
    );
  });

  it('takes up to k findings of each rule, all of a smaller rule, the same for the same seed', () => {
    const population = [
      ...Array.from({ length: 50 }, (_, i) => ({
        id: `c${String(i).padStart(2, '0')}`,
        rule: 'color',
      })),
      ...Array.from({ length: 3 }, (_, i) => ({ id: `p${String(i)}`, rule: 'prop' })),
    ];
    const id = (f: { id: string }) => f.id;
    const first = drawHoldout(population, { seed: 7, perRule: 10, id });
    expect(first.strata).toEqual([
      { rule: 'color', population: 50, sampled: 10, weight: 5 },
      { rule: 'prop', population: 3, sampled: 3, weight: 1 },
    ]);
    expect(first.picks).toHaveLength(13);
    expect(new Set(first.picks.map(id)).size).toBe(13);
    // The order of the population does not matter, the seed does.
    const again = drawHoldout([...population].reverse(), { seed: 7, perRule: 10, id });
    expect(again.picks.map(id)).toEqual(first.picks.map(id));
    expect(drawHoldout(population, { seed: 8, perRule: 10, id }).picks.map(id)).not.toEqual(
      first.picks.map(id),
    );
    // Shuffled: the three props are not the last three picks, as the per-rule draw left them.
    expect(first.picks.slice(-3).every((f) => f.rule === 'prop')).toBe(false);
    expect(() => drawHoldout(population, { seed: 7, perRule: 0, id })).toThrow('perRule');
    expect(() =>
      drawHoldout([...population, { id: 'c00', rule: 'color' }], { seed: 7, perRule: 1, id }),
    ).toThrow('two findings share an id');
  });

  it("gives each rule's false-positive rate with a Wilson interval", () => {
    // As corpus/fp-sample-20261016/scripts/stats.py computes it: 9 of 80 is 11.2% (6.0-20.0%).
    const [low, high] = wilson(9, 80);
    expect(low).toBeCloseTo(0.0601, 3);
    expect(high).toBeCloseTo(0.2, 3);
    expect(wilson(0, 0)).toEqual([0, 1]);
    const rates = ruleRates([
      { rule: 'prop', label: 'TP' },
      { rule: 'color', label: 'FP' },
      { rule: 'color', label: 'TP' },
      { rule: 'color', label: 'debatable' },
      { rule: 'color', label: 'TP' },
    ]);
    expect(rates.map(({ rule, n, tp, fp, d, rate }) => ({ rule, n, tp, fp, d, rate }))).toEqual([
      { rule: 'color', n: 4, tp: 2, fp: 1, d: 1, rate: 0.25 },
      { rule: 'prop', n: 1, tp: 1, fp: 0, d: 0, rate: 0 },
    ]);
    expect(rates[1]?.high).toBeGreaterThan(0.5);
  });

  describe('the frozen holdout in corpus/', () => {
    const holdouts = fs
      .readdirSync(path.join(root, 'corpus'), { withFileTypes: true })
      .filter(
        (e) =>
          e.isDirectory() && fs.existsSync(path.join(root, 'corpus', e.name, 'allocation.json')),
      )
      .map((e) => e.name)
      .filter(
        (name) =>
          (readJson(`corpus/${name}/allocation.json`) as { corpus?: string }).corpus ===
          'installed',
      );

    interface Drawn {
      sampleNo: string;
      id: string;
      repo: string;
      run: string;
      file: string;
      line: number;
      rule: string;
      source: string;
      occurrence: number;
      fingerprint: string;
      message: string;
      excerpt: string;
    }
    interface Allocation {
      seed: number;
      perRule: number;
      n: number;
      populationTotal: number;
      onsystem: { commit: string; version: string };
      allocation: { rule: string; population: number; sampled: number }[];
    }

    it('has one drawn from the installed corpus', () => {
      expect(holdouts).toContain('installed-holdout-20261016');
    });

    for (const name of holdouts) {
      const folder = `corpus/${name}`;
      const allocation = readJson(`${folder}/allocation.json`) as Allocation;
      const sample = readJson(`${folder}/sample-unlabelled.json`) as {
        n: number;
        findings: Drawn[];
      };

      it(`${name}: draws up to perRule findings of each rule, as allocation.json says`, () => {
        const total = allocation.allocation.reduce((n, a) => n + a.population, 0);
        expect(total).toBe(allocation.populationTotal);
        for (const a of allocation.allocation) {
          expect(a.sampled).toBe(Math.min(allocation.perRule, a.population));
          expect(sample.findings.filter((f) => f.rule === a.rule)).toHaveLength(a.sampled);
        }
        expect(sample.findings).toHaveLength(allocation.n);
        expect(sample.n).toBe(allocation.n);
        expect(sample.findings.map((f) => f.sampleNo)).toEqual(
          sample.findings.map((_, i) => `H${String(i + 1).padStart(3, '0')}`),
        );
        expect(allocation.onsystem.commit).toMatch(/^[0-9a-f]{40}$/);
      });

      it(`${name}: keys each finding as the installed runs report it`, () => {
        const runs = new Map(
          installedRepos(corpus(), bench()).flatMap((r) => r.runs.map((run) => [run.name, run])),
        );
        for (const f of sample.findings) {
          const run = runs.get(f.run);
          expect(run, f.run).toBeDefined();
          const prefix = run?.cwd === '.' ? '' : `${run?.cwd ?? ''}/`;
          expect(f.file.startsWith(prefix), f.id).toBe(true);
          const file = f.file.slice(prefix.length);
          expect(f.fingerprint, f.id).toBe(
            fingerprint(f.run, file, f.rule, f.source, f.occurrence),
          );
          expect(f.excerpt.split('\n').filter((l) => l.startsWith('>'))).toHaveLength(1);
        }
      });

      it(`${name}: shows the labeller no fix, severity or label`, () => {
        for (const f of sample.findings) {
          for (const field of ['suggestion', 'fix', 'severity', 'hasFix', 'label', 'verdict']) {
            expect(f, f.id).not.toHaveProperty(field);
          }
        }
        // The labelling brief keeps the key, the allocation and every other label out of sight.
        const brief = read(`${folder}/BRIEF.md`);
        for (const file of [
          'sample-key.json',
          'allocation.json',
          'corpus/labels.json',
          'corpus/snapshot.json',
          'corpus/snapshot-installed.json',
          'corpus/fp-sample-20261016',
        ]) {
          expect(brief, file).toContain(file);
        }
        expect(brief).toContain('blind labels by an AI reviewer');
      });

      it(`${name}: once labelled, labels the same findings in the same order`, () => {
        const labelled = path.join(root, folder, 'sample-labelled.json');
        if (!fs.existsSync(labelled)) return;
        const done = readJson(`${folder}/sample-labelled.json`) as {
          findings: (Drawn & { label: string; reason: string })[];
        };
        expect(done.findings.map((f) => f.fingerprint)).toEqual(
          sample.findings.map((f) => f.fingerprint),
        );
        for (const f of done.findings) {
          expect(['TP', 'FP', 'debatable'], f.id).toContain(f.label);
          expect(f.reason, f.id).toMatch(/\S/);
        }
        // Its labels stay in its folder: corpus/labels.json holds the plain corpus's blind draw.
        const drawn = new Set(sample.findings.map((f) => f.fingerprint));
        const labels = readJson('corpus/labels.json') as { fingerprint: string }[];
        expect(labels.filter((l) => drawn.has(l.fingerprint))).toEqual([]);
      });
    }
  });
});
