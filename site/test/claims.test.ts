import fs from 'node:fs';
import path from 'node:path';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import BenchmarkPage from '@/app/benchmark/page';
import Home from '@/app/page';
import { docsPage } from '@/lib/docs';
import { llmsTxt } from '@/lib/llms';
import { pageMarkdown } from '@/lib/page-markdown';

// What the site says about how often onsystem is wrong, against corpus/: a false-positive rate
// only when a labelled sample can give one, and who made the labels.
const root = path.join(import.meta.dirname, '../..');
const site = path.join(root, 'site');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

interface Label {
  run: string;
  rule: string;
  verdict: 'TP' | 'FP' | 'D';
  sample: 'random' | 'audit';
  fingerprint: string;
  suggestion?: string | null;
}
interface Counts {
  errors: number;
  warnings: number;
}
interface Snapshot {
  runs: Record<string, { rules: Record<string, Counts>; added?: Record<string, Counts> }>;
  labels: Record<string, boolean>;
}
interface Repos {
  repos: { runs: { name: string; config?: string }[] }[];
}

/** The random sample in corpus/labels.json: what its labels cover, and what fixes took out of it. */
function randomSample() {
  const labels = JSON.parse(read('corpus/labels.json')) as Label[];
  const snapshot = JSON.parse(read('corpus/snapshot.json')) as Snapshot;
  const repos = JSON.parse(read('corpus/repos.json')) as Repos;
  // As labelKey in scripts/corpus-lib.ts: a label tied to a suggestion is keyed with it.
  const key = (l: Label) =>
    l.suggestion === undefined ? l.fingerprint : `${l.fingerprint}@${l.suggestion ?? 'none'}`;
  const random = labels.filter((l) => l.sample === 'random');
  // The labels whose findings the snapshot says are still reported.
  const sample = random.filter((l) => snapshot.labels[key(l)]);
  // A run with a config of its own checks the same files as another run: not counted twice.
  const rechecks = new Set(
    repos.repos.flatMap((r) => r.runs.filter((run) => run.config).map((run) => run.name)),
  );
  let distinct = 0;
  let covered = 0;
  // A run from a monorepo root counts only the findings it adds to the runs from its projects.
  for (const [run, { rules, added }] of Object.entries(snapshot.runs)) {
    if (rechecks.has(run)) continue;
    for (const [rule, counts] of Object.entries(added ?? rules)) {
      const n = counts.errors + counts.warnings;
      distinct += n;
      if (sample.some((l) => l.run === run && l.rule === rule)) covered += n;
    }
  }
  const fp = random.filter((l) => l.verdict === 'FP');
  return {
    repos: repos.repos.length,
    runs: Object.keys(snapshot.runs).length,
    distinct,
    coverage: covered / distinct,
    falsePositives: fp.length,
    fixed: fp.filter((l) => !sample.includes(l)).length,
    lost: random.length - sample.length,
  };
}

describe('the home page on how often onsystem is wrong', () => {
  const home = renderToStaticMarkup(createElement(Home));
  const paragraph = text(/<p[^>]*>\s*How often it is wrong[\s\S]*?<\/p>/.exec(home)?.[0] ?? '');

  it('quotes no false-positive rate until a random sample covers the findings and is intact', () => {
    expect(paragraph).not.toBe('');
    const { coverage, falsePositives, fixed, lost } = randomSample();
    // As CONTRIBUTING.md and test/readme.test.ts have it: labels where at least 80% of the
    // distinct findings are, and every label the sample was drawn with still reported.
    const quotable = coverage >= 0.8 && lost === 0;
    const state = `the random sample's labels cover ${(coverage * 100).toFixed(1)}% of the distinct findings, and ${String(lost)} of them are no longer reported`;
    console.info(`home page, corpus: ${state}`);
    expect(paragraph.match(/\d+(?:\.\d+)?\s?%/g) ?? [], `no rate to quote: ${state}`).toEqual([]);
    expect(
      quotable,
      `a random sample gives a rate now (${state}): quote it here with its interval and who labelled it`,
    ).toBe(false);
    // Why there is no rate, while it holds.
    expect(paragraph).toContain('do not give a false-positive rate for all findings yet');
    expect(paragraph).toContain('the runs and rules they cover hold under half of the findings');
    expect(coverage).toBeLessThan(0.5);
    expect(paragraph).toContain('most of the false positives they found have been fixed');
    expect(fixed * 2).toBeGreaterThan(falsePositives);
  });

  it('says an AI reviewer made the labels, and does not call them blind', () => {
    expect(paragraph).toContain('compares the findings with labels made by an AI reviewer');
    // The corpus labeller saw onsystem's finding; only bench/v2's sample was labelled blind.
    expect(paragraph).not.toMatch(/blind/i);
    expect(paragraph).not.toMatch(/measured, not guessed/);
  });
});

describe('the FAQ on how often onsystem is wrong', () => {
  // /docs/faq.md, built from the same entries as the page.
  const faq = pageMarkdown(docsPage('/docs/faq').page);
  const answer = /^## How often is it wrong\?\n\n(.+)$/m.exec(faq)?.[1] ?? '';

  it('counts the repositories, runs and distinct findings as corpus/ has them', () => {
    // It said "10 public repositories" while corpus/repos.json had 12.
    const { repos, runs, distinct } = randomSample();
    expect(answer).toContain(
      `on ${String(repos)} public repositories pinned by commit (${String(runs)} runs, ${distinct.toLocaleString('en-US')} distinct findings)`,
    );
  });

  it('quotes no false-positive rate until a random sample can give one, and says why', () => {
    const { coverage, falsePositives, fixed, lost } = randomSample();
    expect(coverage >= 0.8 && lost === 0, 'a sample gives a rate now: quote it here too').toBe(
      false,
    );
    expect(answer.match(/\d+(?:\.\d+)?\s?%/g) ?? []).toEqual([]);
    // It pointed at the README for a rate the README no longer quotes.
    expect(answer).not.toMatch(/README/);
    expect(answer).toContain('do not give a false-positive rate for all findings yet');
    expect(answer).toContain('the runs and rules they cover hold under half of the findings');
    expect(coverage).toBeLessThan(0.5);
    expect(answer).toContain('most of the false positives they found have been fixed');
    expect(fixed * 2).toBeGreaterThan(falsePositives);
  });

  it('says an AI reviewer made the labels, and does not call them blind', () => {
    expect(answer).toContain('compares the findings with labels made by an AI reviewer');
    expect(answer).not.toMatch(/blind/i);
  });
});

describe('the site’s copy', () => {
  // PR #98: the labels in corpus/labels.json were not all made by hand, and bench/v2's are an
  // AI reviewer's. test/readme.test.ts checks the README, CONTRIBUTING, docs/ and the FAQ.
  const WORDING = /hand[- ]label|label(?:l?ed)? by hand|human[- ]label/i;

  function sources(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) return sources(file);
      return /\.(?:tsx?|mjs|md)$/.test(entry.name) ? [file] : [];
    });
  }

  it('never says labels were made by hand or by people, in the source or on the pages', () => {
    const files = ['app', 'components', 'lib', 'scripts'].flatMap((dir) =>
      sources(path.join(site, dir)),
    );
    expect(files.length).toBeGreaterThan(50);
    const hits = files.flatMap((file) =>
      fs
        .readFileSync(file, 'utf8')
        .split('\n')
        .flatMap((line, i) =>
          WORDING.test(line) ? [`${path.relative(site, file)}:${String(i + 1)}`] : [],
        ),
    );
    expect(hits).toEqual([]);
    const pages = {
      '/': renderToStaticMarkup(createElement(Home)),
      '/benchmark': renderToStaticMarkup(createElement(BenchmarkPage)),
      '/llms.txt': llmsTxt(),
    };
    for (const [page, html] of Object.entries(pages)) expect(text(html), page).not.toMatch(WORDING);
  });
});
