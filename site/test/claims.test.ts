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

// What the site says about how often onsystem is wrong, against corpus/: the false-positive rate
// of the blind sample while it can give one, with its interval and who labelled it.
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
  sample: 'random' | 'audit' | 'blind';
  draw?: string;
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
  repos: {
    runs: { name: string; config?: string }[];
    install?: { folders: Record<string, Record<string, string>> };
  }[];
}

/** A 95% Wilson score interval, as corpus/<draw>/scripts/stats.py computes it. */
function wilson(k: number, n: number) {
  const z = 1.959964;
  const p = k / n;
  const d = 1 + (z * z) / n;
  const c = (p + (z * z) / (2 * n)) / d;
  const h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return [Math.max(0, c - h), Math.min(1, c + h)] as const;
}
/** One decimal, a tie to the even digit, as stats.py prints it: 9/80 is 11.2%. */
function tenths(x: number) {
  const t = x * 1000;
  const floor = Math.floor(t);
  return ((t - floor === 0.5 ? floor + (floor % 2) : Math.round(t)) / 10).toFixed(1);
}
const pct = (x: number) => `${tenths(x)}%`;

/**
 * corpus/sample-stale.json: a change since the draw added or took out findings. Until a fresh draw
 * replaces the sample and removes the file, the site and the README quote the sample with the
 * corpus it was drawn from (test/readme.test.ts reads it the same way).
 */
interface Stale {
  draw: string;
  asDrawn: { repos: number; runs: number };
}
const STALE = 'corpus/sample-stale.json';
const stale = (): Stale | undefined =>
  fs.existsSync(path.join(root, STALE)) ? (JSON.parse(read(STALE)) as Stale) : undefined;

/** The blind sample in corpus/labels.json, as test/readme.test.ts reads it, and the corpus size. */
function blindSample() {
  const labels = JSON.parse(read('corpus/labels.json')) as Label[];
  const snapshot = JSON.parse(read('corpus/snapshot.json')) as Snapshot;
  const repos = JSON.parse(read('corpus/repos.json')) as Repos;
  const marker = stale();
  // As labelKey in scripts/corpus-lib.ts: a label tied to a suggestion is keyed with it.
  const key = (l: Label) =>
    l.suggestion === undefined ? l.fingerprint : `${l.fingerprint}@${l.suggestion ?? 'none'}`;
  const blind = labels.filter((l) => l.sample === 'blind');
  const draws = [...new Set(blind.map((l) => l.draw))];
  expect(draws, 'one blind draw at a time').toHaveLength(1);
  const draw = draws[0] ?? '';
  // A run with a config of its own checks the same files as another run: not counted twice.
  const rechecks = new Set(
    repos.repos.flatMap((r) => r.runs.filter((run) => run.config).map((run) => run.name)),
  );
  const byRule = new Map<string, number>();
  if (marker) {
    // While the sample is stale: the findings it was drawn from, per rule, as its draw has them.
    expect(marker.draw).toBe(draw);
    const { allocation } = JSON.parse(read(`corpus/${draw}/allocation.json`)) as {
      allocation: { rule: string; population: number }[];
    };
    for (const { rule, population } of allocation) byRule.set(rule, population);
  } else {
    // A run from a monorepo root counts only the findings it adds to the runs from its projects.
    for (const [run, { rules, added }] of Object.entries(snapshot.runs)) {
      if (rechecks.has(run)) continue;
      for (const [rule, counts] of Object.entries(added ?? rules)) {
        byRule.set(rule, (byRule.get(rule) ?? 0) + counts.errors + counts.warnings);
      }
    }
  }
  const distinct = [...byRule.values()].reduce((a, b) => a + b, 0);
  const repoCount = marker ? marker.asDrawn.repos : repos.repos.length;
  const runs = marker ? marker.asDrawn.runs : Object.keys(snapshot.runs).length;
  const fps = (list: Label[]) => list.filter((l) => l.verdict === 'FP').length;
  const strata = [...byRule].map(([rule, size]) => {
    const stratum = blind.filter((l) => l.rule === rule);
    return { rule, size, n: stratum.length, fp: fps(stratum) };
  });
  const covered = strata.filter((s) => s.n > 0).reduce((n, s) => n + s.size, 0);
  const weighted = strata
    .filter((s) => s.n > 0)
    .reduce((rate, s) => rate + (s.size / covered) * (s.fp / s.n), 0);
  // The strict reading: the draw's own file says which values the project's design system uses.
  const { findings } = JSON.parse(read(`corpus/${draw}/sample-labelled.json`)) as {
    findings: { label: string; own_ds_value: boolean | null }[];
  };
  const strict = findings.filter((f) => f.label === 'FP' && f.own_ds_value !== true).length;
  const n = blind.length;
  const fp = fps(blind);
  const [low, high] = wilson(fp, n);
  const [strictLow, strictHigh] = wilson(strict, n);
  // The rule most false positives come from: most of them, as the copy says.
  const [top] = [...strata].sort((a, b) => b.fp - a.fp);
  expect((top?.fp ?? 0) * 2).toBeGreaterThan(fp);
  // Dependencies: only the repositories with an `install` get any, and each of those gets MUI.
  const installs = repos.repos.filter((r) => r.install);
  const mui = installs.filter((r) =>
    Object.values(r.install?.folders ?? {}).some((deps) => '@mui/material' in deps),
  );
  expect(mui).toEqual(installs);
  const words = ['no', 'one', 'two', 'three', 'four'];
  return {
    // The corpus size, and what runs without dependencies.
    size: `on ${String(repoCount)} public repositories pinned by commit (${String(runs)} runs, ${distinct.toLocaleString('en-US')} distinct findings), without their dependencies installed (the ${words[mui.length] ?? String(mui.length)} MUI apps get MUI).`,
    /** As the README's corpus paragraph has it too. */
    counted: `${String(runs)} runs, ${distinct.toLocaleString('en-US')} distinct findings)`,
    draw,
    top: { rule: top?.rule ?? '', sentence: `(${String(top?.fp)} of ${String(top?.n)} sampled).` },
    // As CONTRIBUTING.md and test/readme.test.ts have it: labels in rules holding at least 80%
    // of the distinct findings, and every label the sample was drawn with still reported.
    // A stale sample is quoted as it was measured, with the corpus it was drawn from.
    quotable:
      covered / distinct >= 0.8 &&
      (marker?.draw === draw || blind.every((l) => snapshot.labels[key(l)])),
    sentences: [
      `A seeded random sample of ${String(n)} of those findings, stratified by rule, was labelled from the code alone: blind labels by an AI reviewer (Claude Opus 5.5), not by a person.`,
      `${String(blind.filter((l) => l.verdict === 'TP').length)} are right, ${String(blind.filter((l) => l.verdict === 'D').length)} debatable and ${String(fp)} false positives: ${pct(fp / n)} (95% Wilson interval ${tenths(low)}-${pct(high)}), about the same when weighted by each rule's share of all findings (${pct(weighted)}).`,
      `Counting values a project's own design system already uses as debatable, ${String(strict)} of ${String(n)} are false positives (${pct(strict / n)}, ${tenths(strictLow)}-${pct(strictHigh)}).`,
    ],
    rates: [fp / n, high, weighted, strict / n, strictHigh].map(pct),
  };
}

describe('the home page on how often onsystem is wrong', () => {
  const home = renderToStaticMarkup(createElement(Home));
  const paragraph = text(/<p[^>]*>\s*How often it is wrong[\s\S]*?<\/p>/.exec(home)?.[0] ?? '');

  it('counts the repositories, runs and distinct findings as corpus/ has them', () => {
    expect(paragraph).toContain(blindSample().size);
  });

  it("quotes the blind sample's rate with its interval and who labelled it, and no other", () => {
    const { quotable, sentences, top, rates, draw } = blindSample();
    expect(quotable, 'the blind sample no longer gives a rate: take it out or draw again').toBe(
      true,
    );
    for (const sentence of sentences) expect(paragraph).toContain(sentence);
    expect(paragraph).toContain(`Most come from ${top.rule} ${top.sentence}`);
    // 95% is the interval's level, not a rate.
    expect(paragraph.match(/\d+(?:\.\d+)?%(?! Wilson)/g)).toEqual(rates);
    expect(home).toContain(`href="https://github.com/dgesteves/onsystem/tree/main/corpus/${draw}"`);
    expect(paragraph).not.toMatch(/measured, not guessed/);
  });
});

describe('the corpus size while the blind sample is stale', () => {
  // PR #174 review: the site counted 15,764 findings from the regenerated snapshot next to a rate
  // drawn from 14,539, while the README quoted 14,539.
  it('is the corpus the sample was drawn from, on the home page, in the FAQ and in the README', () => {
    const marker = stale();
    if (!marker) return;
    const { counted, size } = blindSample();
    const home = text(renderToStaticMarkup(createElement(Home)));
    const faq = pageMarkdown(docsPage('/docs/faq').page).replace(/\s+/g, ' ');
    const readme = read('README.md').replace(/\s+/g, ' ');
    expect(home).toContain(size);
    expect(faq).toContain(size);
    expect(readme).toContain(counted);
    const { populationTotal } = JSON.parse(read(`corpus/${marker.draw}/allocation.json`)) as {
      populationTotal: number;
    };
    expect(counted).toContain(`${populationTotal.toLocaleString('en-US')} distinct findings`);
  });
});

describe('the FAQ on how often onsystem is wrong', () => {
  // /docs/faq.md, built from the same entries as the page.
  const faq = pageMarkdown(docsPage('/docs/faq').page);
  const answer = /^## How often is it wrong\?\n\n(.+)$/m.exec(faq)?.[1] ?? '';

  it('counts the repositories, runs and distinct findings as corpus/ has them', () => {
    // It said "10 public repositories" while corpus/repos.json had 12.
    expect(answer).toContain(blindSample().size);
  });

  it("quotes the blind sample's rate with its interval and who labelled it, and no other", () => {
    const { quotable, sentences, top, rates, draw } = blindSample();
    expect(quotable, 'the blind sample no longer gives a rate: take it out or draw again').toBe(
      true,
    );
    for (const sentence of sentences) expect(answer.replace(/\s+/g, ' ')).toContain(sentence);
    expect(answer).toContain(`Most come from \`${top.rule}\` ${top.sentence}`);
    expect(answer.match(/\d+(?:\.\d+)?%(?! Wilson)/g)).toEqual(rates);
    expect(answer).toContain(`(https://github.com/dgesteves/onsystem/tree/main/corpus/${draw})`);
    // It pointed at the README for a rate the README no longer quoted.
    expect(answer).not.toMatch(/README/);
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
