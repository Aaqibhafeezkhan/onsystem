import fs from 'node:fs';
import path from 'node:path';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { alt as cardAlt } from '@/app/benchmark/opengraph-image';
import BenchmarkPage, { metadata } from '@/app/benchmark/page';
import Home from '@/app/page';
import sitemap from '@/app/sitemap';
import { NAV } from '@/components/site-header';
import { headlineShort } from '@/lib/benchmark';
import { benchmark } from '@/lib/data';
import { llmsTxt } from '@/lib/llms';

// /benchmark against the files bench/v2's `report` wrote, read here directly rather than through
// generated/benchmark.json: a number on the page that differs from them fails.
const results = path.join(import.meta.dirname, '../../bench/v2/results/standard');

interface Rate {
  successes: number;
  n: number;
  value: number;
  low: number;
  high: number;
}
interface Interval {
  value: number;
  low: number;
  high: number;
}
interface Row {
  model: string;
  arm: string;
  runs: number;
  scored: number;
  created: Rate;
  tscPass: Rate;
  onsystemClean: Rate;
  accepted: Rate;
  onsystemErrors: Interval;
  cost: Interval;
  calls: number;
  hookBlocks: number;
  mcpCalls: number;
}
interface Delta {
  model: string;
  arm: string;
  pairs: number;
  tscPass: Interval;
  onsystemClean: Interval;
  accepted: Interval;
  onsystemErrors: Interval;
}

/** @shadcn/lint's count, which `score --with shadcn-lint` adds to results.json. */
interface LintRow {
  model: string;
  arm: string;
  runs: number;
  linted: number;
  findings: Interval;
  byRule: Record<string, number>;
}
interface LintDelta {
  model: string;
  arm: string;
  pairs: number;
  findings: Interval;
}

const json = JSON.parse(fs.readFileSync(path.join(results, 'results.json'), 'utf8')) as {
  info: { startedAt: string; onsystem: string; repos: Record<string, unknown> };
  rows: Row[];
  deltas: Delta[];
  shadcnLint: {
    scorer: { packages: Record<string, string>; rules: string[] };
    rows: LintRow[];
    deltas: LintDelta[];
  };
};
const report = fs.readFileSync(path.join(results, 'results.md'), 'utf8');
const models = JSON.parse(
  fs.readFileSync(path.join(results, '../../config/models.json'), 'utf8'),
) as { models: { id: string; name: string; provider: string }[] };

// The formats, written out again so a wrong formatter fails too.
const minus = (s: string) => s.replace('-', '−');
const two = (x: number) => minus(x.toFixed(2));
const signedTwo = (x: number) => (x > 0 ? `+${x.toFixed(2)}` : two(x));
const pct = (x: number) => `${String(Math.round(x * 100))}%`;
const pts = (x: number) => {
  const n = Math.round(x * 100);
  return n > 0 ? `+${String(n)}` : n < 0 ? minus(String(n)) : '0';
};
const rate = (r: Rate) =>
  `${pct(r.value)} ${String(r.successes)}/${String(r.n)} [${pct(r.low)}, ${pct(r.high)}]`;
const errors = (i: Interval) => `${two(i.value)} [${two(i.low)}, ${two(i.high)}]`;
const signedErrors = (i: Interval) =>
  `${signedTwo(i.value)} [${signedTwo(i.low)}, ${signedTwo(i.high)}]`;
const delta = (i: Interval) => `${pts(i.value)} [${pts(i.low)}, ${pts(i.high)}]`;

const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/\s+/g, ' ')
    .trim();

const html = renderToStaticMarkup(createElement(BenchmarkPage));

/** The text of each cell of a row of a table, by its data-col. */
function cells(table: string, row: string): Record<string, string> {
  const t = new RegExp(`<table data-table="${table}"[\\s\\S]*?</table>`).exec(html)?.[0];
  expect(t, `table ${table}`).toBeDefined();
  const escaped = row.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tr = new RegExp(`<tr data-row="${escaped}">([\\s\\S]*?)</tr>`).exec(t ?? '')?.[1];
  expect(tr, `${table}: row ${row}`).toBeDefined();
  return Object.fromEntries(
    [...(tr ?? '').matchAll(/<td data-col="(\w+)"[^>]*>([\s\S]*?)<\/td>/g)].map(
      (m): [string, string] => [m[1] ?? '', text(m[2] ?? '')],
    ),
  );
}

function stat(id: string, page = html) {
  const block = new RegExp(`<div data-stat="${id}"[\\s\\S]*?</dd></div>`).exec(page)?.[0] ?? '';
  const value = (name: string) =>
    text(new RegExp(`data-value="${name}"[^>]*>([\\s\\S]*?)</(?:span|dd)>`).exec(block)?.[1] ?? '');
  return { before: value('before'), after: value('after'), note: value('note') };
}

const pooled = (model: string, arm: string) => {
  const row = json.rows.find((r) => r.model === model && r.arm === arm);
  if (!row) throw new Error(`no row ${model}/${arm}`);
  return row;
};
const runs = ['none', 'skill', 'mcp', 'hook', 'all'].reduce(
  (n, arm) => n + pooled('all models', arm).runs,
  0,
);
const modelIds = [...new Set(json.rows.map((r) => r.model).filter((m) => !m.endsWith(' models')))];
const providers = new Set(
  modelIds.map((id) => models.models.find((m) => m.id === id)?.provider ?? id),
);
const none = pooled('all models', 'none');
const all = pooled('all models', 'all');
const allDelta = json.deltas.find((d) => d.model === 'all models' && d.arm === 'all');
// The release that ran the benchmark and scored it: the headline is its own count.
const version = json.info.onsystem;

// The blind labels joined with key.json: each labelled file's arm, repository and counts.
const csvFields = (line: string) =>
  [...line.matchAll(/(?:^|,)(?:"((?:[^"]|"")*)"|([^,]*))/g)].map(
    (m) => m[1]?.replace(/""/g, '"') ?? m[2] ?? '',
  );
const [labelHeader = '', ...labelLines] = fs
  .readFileSync(path.join(results, 'labels/labels.csv'), 'utf8')
  .trim()
  .split(/\r?\n/);
const labelKey = JSON.parse(
  fs.readFileSync(path.join(results, 'labels/key.json'), 'utf8'),
) as Record<string, { arm: string }>;
const labelled = labelLines
  .filter((line) => /^S\d+,/.test(line))
  .map((line) => {
    const fields = csvFields(line);
    const cell = (column: string) => fields[csvFields(labelHeader).indexOf(column)] ?? '';
    const n = (column: string) => Number(cell(column)) || 0;
    return {
      arm: labelKey[cell('sample_id')]?.arm ?? '',
      repo: cell('repo'),
      hardcoded: n('hardcoded_values'),
      violations:
        n('invented_api') + n('hardcoded_values') + n('native_elements') + n('unnamed_controls'),
    };
  });

describe('/benchmark', () => {
  it('states the headline with the numbers in results.json', () => {
    expect(runs).toBe(1200);
    expect(version).toBe('0.5.0');
    // The headline compares two arms of the same size.
    for (const arm of ['none', 'skill', 'mcp', 'hook', 'all'])
      expect(pooled('all models', arm).runs).toBe(none.runs);
    const sentence = `design-system rule violations per run, as onsystem ${version}'s own check counts them, went from ${two(none.onsystemErrors.value)} to ${two(all.onsystemErrors.value)} with onsystem's skill, MCP server and hook, with no measurable change in tsc pass rate or cost per run (${String(none.runs)} runs per arm, ${String(modelIds.length)} models, ${String(providers.size)} providers, ${String(Object.keys(json.info.repos).length)} repositories)`;
    expect(sentence).toBe(
      "design-system rule violations per run, as onsystem 0.5.0's own check counts them, went from 0.85 to 0.00 with onsystem's skill, MCP server and hook, with no measurable change in tsc pass rate or cost per run (240 runs per arm, 6 models, 3 providers, 5 repositories)",
    );
    // "No measurable change": the paired difference in tsc passes holds 0.
    expect(allDelta?.tscPass.low).toBeLessThanOrEqual(0);
    expect(allDelta?.tscPass.high).toBeGreaterThanOrEqual(0);
    const lead = /<p data-headline[^>]*>([\s\S]*?)<\/p>/.exec(html)?.[1] ?? '';
    expect(text(lead)).toBe(`In the run of ${json.info.startedAt.slice(0, 10)}, ${sentence}.`);
    expect(lead).toContain('<code');
    // The description is the same result, short enough for a search result.
    expect(metadata.description).toBe(
      `Coding agents with and without onsystem, ${json.info.startedAt.slice(0, 10)}: rule violations per run, as onsystem 0.5.0 counts them, went from 0.85 to 0.00 (240 runs per arm).`,
    );
    expect(metadata.description?.length).toBeLessThanOrEqual(160);
  });

  it('names the onsystem release that ran it, and says the tool under test scores the headline', () => {
    const page = text(html);
    expect(text(/<p[^>]*>Benchmark · [\s\S]*?<\/p>/.exec(html)?.[0] ?? '')).toBe(
      `Benchmark · ${json.info.startedAt.slice(0, 10)} · onsystem ${version}`,
    );
    expect(page).toContain(
      `A rule violation is an error from onsystem check that the run added to the repository, counted by onsystem ${version}, the release the benchmark ran: the tool under test scores the headline.`,
    );
    expect(page).toContain(
      `onsystem is one of the scorers. The headline counts the errors of onsystem ${version}, the release under test.`,
    );
    expect(cardAlt).toBe(
      `The onsystem benchmark: design-system rule violations per run, as onsystem ${version}'s own check counts them, went from 0.85 to 0.00 with onsystem's skill, MCP server and hook, over 240 runs per arm.`,
    );
    expect(headlineShort(benchmark)).toBe(`onsystem ${version} errors per run: 0.85 → 0.00`);
    expect(text(/<div data-stat="violations"[\s\S]*?<\/dt>/.exec(html)?.[0] ?? '')).toBe(
      `onsystem ${version} errors per run`,
    );
  });

  it('says what the blind labels can and cannot say about the headline', () => {
    const arms = ['none', 'skill', 'mcp', 'hook', 'all'];
    const of = (arm: string) => labelled.filter((l) => l.arm === arm);
    const perArm = of('none').length;
    for (const arm of arms) expect(of(arm), arm).toHaveLength(perArm);
    // Too few to confirm it either way: the intervals of none and all overlap (results.md).
    const interval = (arm: string) =>
      /^\| (\w+) \| \d+ \|.*\| (\d+\.\d+) \[(\d+\.\d+), (\d+\.\d+)\] \|$/
        .exec(report.split('\n').find((l) => l.startsWith(`| ${arm} | `)) ?? '')
        ?.slice(3)
        .map(Number) ?? [NaN, NaN];
    const [noneLow = NaN, noneHigh = NaN] = interval('none');
    const [allLow = NaN, allHigh = NaN] = interval('all');
    expect(allLow <= noneHigh && noneLow <= allHigh).toBe(true);
    // Every violation the labeller counted with the hook and with all three is a hardcoded
    // value in dub, and onsystem 0.5.0 saw no color tokens there.
    for (const arm of ['hook', 'all']) {
      expect(
        of(arm).reduce((n, l) => n + l.violations, 0),
        arm,
      ).toBeGreaterThan(0);
      for (const l of of(arm))
        expect(l.violations, `${arm} ${l.repo}`).toBe(l.repo === 'dub' ? l.hardcoded : 0);
    }
    expect(benchmark.repos.find((r) => r.name === 'dub')?.designSystem).toContain(
      'no color tokens found',
    );
    // Outside dub, only files written without onsystem have any.
    const outside = (arm: string) =>
      of(arm)
        .filter((l) => l.repo !== 'dub')
        .reduce((n, l) => n + l.violations, 0);
    expect(outside('none')).toBeGreaterThan(0);
    for (const arm of arms.slice(1)) expect(outside(arm), arm).toBe(0);
    expect(text(/<p data-labels="scope"[^>]*>([\s\S]*?)<\/p>/.exec(html)?.[1] ?? '')).toBe(
      `These labels are too few to confirm the headline either way. Every violation the labeller counted in the hook and all arms is a Tailwind palette color in dub, where onsystem ${version} found no color tokens to check it against; #107, merged after the 0.6.0 release, makes onsystem read dub's tokens from its shared Tailwind config. Outside dub, the labeller counted violations only in files written without onsystem.`,
    );
  });

  it('says that onsystem 0.5.0 found no color tokens in dub, and that #107, merged since, reads them', () => {
    // The repositories table's row for dub.
    const dub = /<tr>(?:(?!<\/tr>)[\s\S])*?>dubinc\/dub<[\s\S]*?<\/tr>/.exec(html);
    expect(text(dub?.[0] ?? '')).toContain(
      `no color tokens found, so the color rules stay quiet here and the component, prop and variant rules do the work. That is what onsystem ${version} found; #107, merged after the 0.6.0 release, makes onsystem read dub's tokens from its shared Tailwind config.`,
    );
    expect(dub?.[0]).toContain('href="https://github.com/dgesteves/onsystem/pull/107"');
    // "Merged after the 0.6.0 release": 0.6.0's notes do not have it, and it is a pending
    // changeset or in a later release's notes.
    const root = path.join(import.meta.dirname, '../..');
    const releases = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8').split(/^## /m);
    const at = releases.findIndex((section) => section.startsWith('0.6.0\n'));
    expect(at).toBeGreaterThan(0);
    expect(releases[at]).not.toContain('/pull/107)');
    expect(
      fs.existsSync(path.join(root, '.changeset/shared-tailwind-config.md')) ||
        releases.slice(1, at).some((section) => section.includes('/pull/107)')),
    ).toBe(true);
  });

  it('says that a chart token passes for a status color in onsystem’s count', () => {
    // The two tasks that ask for a green status label in a theme with no success token.
    const green = ['plan-summary-card', 'settings-card'];
    const tasks = benchmark.tasks.filter((t) => green.includes(t.id));
    expect(tasks.map((t) => t.repo).sort()).toEqual(['chatbot', 'saas-starter']);
    for (const t of tasks) expect(t.prompt).toMatch(/small green '\w+' status label/);
    const [header = '', ...lines] = fs
      .readFileSync(path.join(results, 'runs.csv'), 'utf8')
      .trim()
      .split('\n');
    const columns = header.split(',');
    const runsOf = (arm: string) =>
      lines
        .map((line) => Object.fromEntries(line.split(',').map((v, i) => [columns[i] ?? '', v])))
        .filter((r) => r.arm === arm && green.includes(r.task ?? ''));
    const usesChartToken = (id: string) => {
      const dir = path.join(results, 'runs', id, 'files');
      return fs
        .readdirSync(dir, { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile())
        .some((entry) =>
          /\bchart-\d/.test(fs.readFileSync(path.join(entry.parentPath, entry.name), 'utf8')),
        );
    };
    const withAll = runsOf('all');
    expect(withAll).toHaveLength(24);
    expect(withAll.every((r) => usesChartToken(r.id ?? ''))).toBe(true);
    expect(withAll.every((r) => r.onsystem_errors === '0')).toBe(true);
    expect(runsOf('none').some((r) => usesChartToken(r.id ?? ''))).toBe(false);
    const threats = text(/<section id="threats"[\s\S]*?<\/section>/.exec(html)?.[0] ?? '');
    expect(threats).toContain(
      'A chart token passes for a status color. Two tasks ask for a small green status label in saas-starter and chatbot, whose themes have no success token. Every run of those tasks with all three parts used a chart-* token for the green, and no run without onsystem did; onsystem counts that as clean, although those tokens are meant for charts.',
    );
  });

  it('shows the headline figures from the pooled rows', () => {
    expect(stat('violations')).toEqual({
      before: two(none.onsystemErrors.value),
      after: two(all.onsystemErrors.value),
      note: `difference ${allDelta ? signedErrors(allDelta.onsystemErrors) : ''}; without onsystem [${two(none.onsystemErrors.low)}, ${two(none.onsystemErrors.high)}]`,
    });
    expect(stat('tsc')).toEqual({
      before: pct(none.tscPass.value),
      after: pct(all.tscPass.value),
      note: `difference ${pts(allDelta?.tscPass.value ?? NaN)} points [${pts(allDelta?.tscPass.low ?? NaN)}, ${pts(allDelta?.tscPass.high ?? NaN)}]`,
    });
    expect(stat('cost')).toEqual({
      before: `$${none.cost.value.toFixed(4)}`,
      after: `$${all.cost.value.toFixed(4)}`,
      note: `without onsystem [$${none.cost.low.toFixed(4)}, $${none.cost.high.toFixed(4)}]`,
    });
  });

  it('shows every arm, pooled over all models, as results.json has it', () => {
    for (const arm of ['none', 'skill', 'mcp', 'hook', 'all']) {
      const r = pooled('all models', arm);
      expect(cells('arms', `all models/${arm}`)).toEqual({
        runs: String(r.scored),
        onsystemErrors: errors(r.onsystemErrors),
        onsystemClean: rate(r.onsystemClean),
        tscPass: rate(r.tscPass),
        cost: `$${r.cost.value.toFixed(4)}`,
        hookBlocks: r.hookBlocks.toFixed(2),
        mcpCalls: r.mcpCalls.toFixed(1),
      });
    }
  });

  it('shows every row of results.json', () => {
    expect(json.rows).toHaveLength(45);
    for (const r of json.rows) {
      expect(cells('models', `${r.model}/${r.arm}`)).toEqual({
        arm: r.arm,
        runs: r.scored.toLocaleString('en-US'),
        onsystemErrors: errors(r.onsystemErrors),
        onsystemClean: rate(r.onsystemClean),
        tscPass: rate(r.tscPass),
        accepted: rate(r.accepted),
        created: pct(r.created.value),
        cost: `$${r.cost.value.toFixed(4)}`,
        calls: r.calls.toFixed(1),
        hookBlocks: r.hookBlocks.toFixed(2),
        mcpCalls: r.mcpCalls.toFixed(1),
      });
    }
  });

  it('shows every paired difference in results.json', () => {
    expect(json.deltas).toHaveLength(36);
    for (const d of json.deltas) {
      const expected = {
        pairs: d.pairs.toLocaleString('en-US'),
        onsystemErrors: signedErrors(d.onsystemErrors),
        onsystemClean: delta(d.onsystemClean),
        tscPass: delta(d.tscPass),
        accepted: delta(d.accepted),
      };
      expect(cells('model-deltas', `${d.model}/${d.arm}`)).toEqual({ arm: d.arm, ...expected });
      if (d.model === 'all models')
        expect(cells('deltas', `${d.model}/${d.arm}`)).toEqual(expected);
    }
  });

  it('shows @shadcn/lint’s findings per run for every arm, as the independent scorer', () => {
    const lint = json.shadcnLint;
    expect(lint.scorer.packages['@shadcn/lint']).toBe('0.2.1');
    expect(lint.scorer.rules).toHaveLength(6);
    const arms = ['none', 'skill', 'mcp', 'hook', 'all'];
    // The same arms, in the same order, as the table of onsystem's own count.
    const order = (table: string) =>
      [
        ...(
          new RegExp(`<table data-table="${table}"[\\s\\S]*?</table>`).exec(html)?.[0] ?? ''
        ).matchAll(/<tr data-row="all models\/(\w+)"/g),
      ].map((m) => m[1]);
    expect(order('arms')).toEqual(arms);
    expect(order('shadcn-lint')).toEqual(arms);
    for (const arm of arms) {
      const r = lint.rows.find((l) => l.model === 'all models' && l.arm === arm);
      const d = lint.deltas.find((l) => l.model === 'all models' && l.arm === arm);
      if (!r) throw new Error(`no @shadcn/lint row ${arm}`);
      // Every run the table of onsystem's count has, scored again.
      expect(r.runs).toBe(pooled('all models', arm).runs);
      expect(cells('shadcn-lint', `all models/${arm}`)).toEqual({
        runs: `${String(r.runs)} ${String(r.linted)} files linted`,
        findings: errors(r.findings),
        delta: arm === 'none' ? '—' : d ? signedErrors(d.findings) : '',
        noRawColors: two(r.byRule['no-raw-colors'] ?? NaN),
        noRestyle: two(r.byRule['no-restyle'] ?? NaN),
      });
    }
    // The numbers bench/v2/README.md and results.md quote.
    expect(cells('shadcn-lint', 'all models/none').findings).toBe('4.97 [3.30, 6.69]');
    expect(cells('shadcn-lint', 'all models/all').findings).toBe('2.64 [1.76, 3.58]');
    expect(cells('shadcn-lint', 'all models/all').delta).toBe('−2.33 [−3.28, −1.38]');
    expect(report).toContain('| all models | all | 240 | 229 | 2.64 [1.76, 3.58] |');
  });

  it('says what @shadcn/lint is, that it is not onsystem, and how to run it again', () => {
    const section = /<section id="independent-scorer"[\s\S]*?<\/section>/.exec(html)?.[0] ?? '';
    expect(text(/<h2[\s\S]*?<\/h2>/.exec(section)?.[0] ?? '')).toBe(
      'Independent scorer: @shadcn/lint',
    );
    expect(section.match(/<table/g)).toHaveLength(1);
    const method = text(/<p data-lint="method"[^>]*>([\s\S]*?)<\/p>/.exec(section)?.[1] ?? '');
    expect(method).toBe(
      'The same 1,200 runs, scored by a linter that is not part of onsystem: @shadcn/lint 0.2.1, with all six of its rules, on the file each run created, at its path in the repository. No arm showed the agent its messages, and a run that created no file counts 0. node bench/v2/run.mjs score --with shadcn-lint --out bench/v2/results/standard runs it again, as bench/v2/README.md describes.',
    );
    // The command is the one the README gives, and the sections linked are there.
    const readme = fs.readFileSync(path.join(results, '../../README.md'), 'utf8');
    expect(readme).toContain(
      '\nnode bench/v2/run.mjs score --with shadcn-lint --out bench/v2/results/standard',
    );
    expect(readme).toContain('\n## Independent scorer: @shadcn/lint\n');
    expect(report).toContain('\n## Independent scorer: @shadcn/lint\n');
    expect(section).toContain(
      'href="https://github.com/dgesteves/onsystem/blob/main/bench/v2/README.md#independent-scorer-shadcnlint"',
    );
    expect(section).toContain(
      'href="https://github.com/dgesteves/onsystem/blob/main/bench/v2/results/standard/results.md#independent-scorer-shadcnlint"',
    );
    expect(section).toContain('href="https://github.com/shadcn-ui/lint"');
    // What its count agrees with, and what onsystem does not report.
    expect(text(/<p data-lint="scope"[^>]*>([\s\S]*?)<\/p>/.exec(section)?.[1] ?? '')).toBe(
      "On colors it flags the same kind of error the MCP server and the hook show the agent, so no-raw-colors agrees with onsystem rather than confirming it. Most of what is left is no-restyle, a class that changes a design-system component's color, typography or spacing, which onsystem does not report. By model and by rule: results.md.",
    );
    // A section of its own, after the results, and nowhere in the headline or on the home page.
    expect(html.indexOf('id="independent-scorer"')).toBeGreaterThan(html.indexOf('id="results"'));
    expect(html.indexOf('id="independent-scorer"')).toBeLessThan(html.indexOf('id="labels"'));
    expect(html).toContain('href="#independent-scorer"');
    const top = html.slice(0, html.indexOf('id="results"'));
    expect(text(top)).not.toMatch(/shadcn\/lint/);
    expect(metadata.description).not.toMatch(/shadcn/);
    const home = text(renderToStaticMarkup(createElement(Home)));
    expect(home).not.toContain('4.97');
    expect(home).not.toContain('2.64');
  });

  it('shows the blind labels as results.md reports them', () => {
    const rows = report
      .split('\n')
      .filter((l) => /^\| (none|skill|mcp|hook|all) \| \d+ \|/.test(l))
      .map((l) => l.split('|').map((c) => c.trim()));
    expect(rows).toHaveLength(5);
    // results.md: "11/12 92% [65%, 99%]"; the page puts the percentage first.
    const swap = (s: string) => s.replace(/^(\d+\/\d+) (\d+%) /, '$2 $1 ');
    for (const [, arm = '', labelled, wouldMerge = '', clean = '', violations = ''] of rows) {
      expect(cells('labels', arm)).toEqual({
        labelled,
        clean: swap(clean),
        violations,
        wouldMerge: swap(wouldMerge),
      });
    }
    const agreement =
      /both found a problem in (\d+), only onsystem in (\d+), only the labeller in (\d+), neither in (\d+)\./.exec(
        report,
      );
    expect(text(/<p data-labels="agreement"[^>]*>([\s\S]*?)<\/p>/.exec(html)?.[1] ?? '')).toBe(
      `Per file, onsystem and the labeller both found a problem in ${agreement?.[1] ?? ''}, only onsystem in ${agreement?.[2] ?? ''}, only the labeller in ${agreement?.[3] ?? ''} and neither in ${agreement?.[4] ?? ''}.`,
    );
    const precision = /judged correct: (\d+)\/(\d+) .*\((\d+) debatable/.exec(report);
    const tp = Number(precision?.[1]);
    const judged = Number(precision?.[2]);
    const debatable = Number(precision?.[3]);
    expect(text(/<p data-labels="precision"[^>]*>([\s\S]*?)<\/p>/.exec(html)?.[1] ?? '')).toBe(
      `Of onsystem's ${String(judged + debatable)} findings on these files, the labeller judged ${String(tp)} correct, ${String(judged - tp)} wrong and ${String(debatable)} debatable.`,
    );
  });

  it('says the labels are an AI reviewer’s, and which models share its family', () => {
    const labeller = fs.readFileSync(path.join(results, 'labels/LABELLER.md'), 'utf8');
    const who = models.models.find((m) => labeller.includes(`An AI reviewer, ${m.name}`));
    expect(who?.id).toBe('claude-opus-5-5');
    const family = modelIds
      .map((id) => models.models.find((m) => m.id === id))
      .filter((m) => m?.provider === who?.provider)
      .map((m) => m?.name);
    expect(family).toEqual(['Claude Haiku 5.5', 'Claude Sonnet 5.5']);
    const page = text(html);
    expect(page).toContain('labelled blind by an AI reviewer');
    expect(page).toContain(
      'Two of the six models (Claude Haiku 5.5 and Claude Sonnet 5.5) are from the same family as the labeller',
    );
    expect(page).not.toMatch(/human label|hand label|labelled by hand|human-labelled/i);
  });

  it('makes no claim about merging: the headline and its figures say nothing of it', () => {
    const top = html.slice(0, html.indexOf('id="results"'));
    expect(text(top)).not.toMatch(/merge/i);
    expect(text(html)).not.toMatch(/mergeable/i);
    expect(text(html)).toContain('Would merge (labeller)');
  });

  it('links the transcripts release and how to reproduce it', () => {
    expect(html).toContain(
      'href="https://github.com/dgesteves/onsystem/releases/tag/bench-v2-2026-10-12"',
    );
    expect(text(html)).toContain('node bench/v2/run.mjs run --matrix standard');
  });
});

describe('the rest of the site', () => {
  it('points the header’s Benchmark item at /benchmark', () => {
    expect(NAV.find((item) => item.label === 'Benchmark')?.href).toBe('/benchmark');
  });

  it('lists /benchmark in the sitemap', () => {
    expect(sitemap().map((entry) => entry.url)).toContain('https://onsystem.vercel.app/benchmark');
  });

  it('keeps a summary on the home page that links to /benchmark', () => {
    const home = renderToStaticMarkup(createElement(Home));
    expect(text(home)).toContain(
      `as onsystem ${version}'s own check counts them, went from ${two(none.onsystemErrors.value)} to ${two(all.onsystemErrors.value)} with onsystem's skill`,
    );
    expect(stat('violations', home).after).toBe(two(all.onsystemErrors.value));
    expect(home).toContain('href="/benchmark"');
  });

  it('links it from the home page’s first screen with no figure, only its size', () => {
    const home = renderToStaticMarkup(createElement(Home));
    // The first link to /benchmark is the one in the first screen's proof row.
    const link = /<a[^>]*href="\/benchmark"[^>]*>([\s\S]*?)<\/a>/.exec(home)?.[1] ?? '';
    expect(text(link)).toBe(
      `Benchmark: ${runs.toLocaleString('en-US')} agent runs, ${String(modelIds.length)} models`,
    );
  });

  it('gives llms.txt the headline and the page', () => {
    const llms = llmsTxt();
    expect(llms).toContain(
      "design-system rule violations per run, as onsystem 0.5.0's own check counts them, went from 0.85 to 0.00 with onsystem's skill, MCP server and hook",
    );
    expect(llms).toContain('https://onsystem.vercel.app/benchmark');
  });
});
