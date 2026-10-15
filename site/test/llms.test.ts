import fs from 'node:fs';
import path from 'node:path';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import BenchmarkPage from '@/app/benchmark/page';
import Home from '@/app/page';
import { llmsFullTxt, llmsTxt } from '@/lib/llms';
import { SITE_URL } from '@/lib/site';

// What an agent reads without opening the site: llms.txt, and every page in llms-full.txt.
const root = path.join(import.meta.dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

/** Markdown as the text it renders to: no emphasis, code marks or link targets. */
const plain = (markdown: string) =>
  markdown
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\*\*|`/g, '')
    .replace(/\s+/g, ' ');

/** The body of a `## title` section of llms-full.txt, up to the next `## `. */
function section(title: string): string {
  const full = llmsFullTxt();
  const start = full.indexOf(`\n## ${title}\n`);
  if (start === -1) return '';
  const end = full.indexOf('\n## ', start + 1);
  return full.slice(start, end === -1 ? undefined : end);
}

describe('llms.txt and llms-full.txt', () => {
  it('open with the pitch of the home page’s first screen', () => {
    const home = renderToStaticMarkup(createElement(Home));
    const headline = text(/<h1[^>]*>([\s\S]*?)<\/h1>/.exec(home)?.[1] ?? '');
    const subLine = text(/<\/h1>\s*<p[^>]*>([\s\S]*?)<\/p>/.exec(home)?.[1] ?? '');
    expect(headline).toBe('Keeps coding agents on your design system.');
    expect(subLine).toMatch(/^Catches palette colors, native elements and APIs/);
    for (const file of [llmsTxt(), llmsFullTxt()]) {
      expect(/^# onsystem\n\n> (.+)$/m.exec(file)?.[1]).toBe(`${headline} ${subLine}`);
    }
  });

  it('no longer pitch catching invented components, which /benchmark counts none of', () => {
    // #150 took "catches the moment an agent invents one" off the site; the summary kept it.
    const summary = /^> [\s\S]*?\n\n[\s\S]*?\n\n/m.exec(llmsTxt())?.[0] ?? '';
    expect(summary).not.toBe('');
    expect(summary).not.toMatch(/invent/i);
  });
});

describe('llms-full.txt', () => {
  it('has the benchmark: its headline, method, blind labels and threats to validity', () => {
    const benchmark = section('Benchmark');
    expect(benchmark).not.toBe('');
    // The headline, from the results file itself.
    const results = JSON.parse(read('bench/v2/results/standard/results.json')) as {
      info: { onsystem: string };
      rows: { model: string; arm: string; onsystemErrors: { value: number } }[];
    };
    const errors = (arm: string) =>
      results.rows
        .find((r) => r.model === 'all models' && r.arm === arm)
        ?.onsystemErrors.value.toFixed(2);
    expect(benchmark).toContain(
      `design-system rule violations per run, as onsystem ${results.info.onsystem}'s own check counts them, went from ${String(errors('none'))} to ${String(errors('all'))} with onsystem's skill, MCP server and hook`,
    );
    for (const heading of ['Results', 'Blind labels', 'Method', 'Threats to validity']) {
      expect(benchmark).toContain(`\n### ${heading}\n`);
    }
    // Who labelled, as LABELLER.md says it: an AI reviewer, not people.
    const labeller = read('bench/v2/results/standard/labels/LABELLER.md');
    const models = JSON.parse(read('bench/v2/config/models.json')) as {
      models: { name: string }[];
    };
    const model = models.models.find((m) => labeller.includes(m.name))?.name;
    expect(model).toBeDefined();
    expect(benchmark).toContain(
      `labelled blind by an AI reviewer (${String(model)}), not by people`,
    );
    // Every threat bench/v2/README.md lists.
    const readme = read('bench/v2/README.md');
    const threats = /^### Threats to validity\n([\s\S]*?)^#/m.exec(readme)?.[1] ?? '';
    const named = [...threats.matchAll(/^- \*\*(.+?)\*\*/gm)].map((m) => m[1] ?? '');
    expect(named.length).toBeGreaterThan(5);
    for (const threat of named) expect(benchmark).toContain(`**${threat}**`);
    // Links work outside the site, and the ids citations use stay out of the text.
    expect(benchmark).not.toMatch(/\]\((?!https:\/\/)/);
    expect(benchmark).not.toMatch(/\{#[\w-]+\}/);
    expect(benchmark).toContain(`](${SITE_URL}/benchmark)`);
  });

  it('says what /benchmark says next to the blind labels, and every threat the page lists', () => {
    // The caveats the page prints, word for word, so an agent that finds the labels table finds
    // what limits it. When the page's copy changes, this fails until benchmarkMarkdown follows.
    const html = renderToStaticMarkup(createElement(BenchmarkPage));
    const benchmark = plain(section('Benchmark'));
    const scope = text(/<p data-labels="scope"[^>]*>([\s\S]*?)<\/p>/.exec(html)?.[1] ?? '');
    expect(scope).toMatch(/^These labels are too few to confirm the headline/);
    expect(benchmark).toContain(scope);
    const threats = /<section id="threats"[\s\S]*?<\/section>/.exec(html)?.[0] ?? '';
    const items = [...threats.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => text(m[1] ?? ''));
    // The page's own four, then every one in bench/v2/README.md.
    expect(items.length).toBeGreaterThan(8);
    expect(
      items.filter((item) => item.startsWith('A chart token passes for a status color.')),
    ).toHaveLength(1);
    for (const item of items) expect(benchmark).toContain(item);
  });

  it('has the independent scorer’s table and the notes /benchmark prints with it', () => {
    // #155's review: Ask and llms-full.txt should have @shadcn/lint's count as the page has it.
    const html = renderToStaticMarkup(createElement(BenchmarkPage));
    const benchmark = section('Benchmark');
    expect(benchmark).toContain('\n### Independent scorer: @shadcn/lint\n');
    const results = JSON.parse(read('bench/v2/results/standard/results.json')) as {
      shadcnLint: {
        rows: { model: string; arm: string; runs: number; linted: number }[];
        deltas: { model: string; arm: string; findings: { value: number } }[];
      };
    };
    const rows = results.shadcnLint.rows.filter((r) => r.model === 'all models');
    expect(rows.map((r) => r.arm)).toEqual(['none', 'skill', 'mcp', 'hook', 'all']);
    expect(benchmark).toContain(
      '| Arm | Runs | Files linted | Findings per run | Δ against `none`, paired | `no-raw-colors` per run | `no-restyle` per run |',
    );
    expect(benchmark).toContain('| `none` | 240 | 227 | 4.97 [3.30, 6.69] | — | 1.84 | 2.98 |');
    expect(benchmark).toContain(
      '| `all` | 240 | 229 | 2.64 [1.76, 3.58] | −2.33 [−3.28, −1.38] | 0.60 | 1.97 |',
    );
    for (const r of rows) expect(benchmark).toContain(`| \`${r.arm}\` | ${String(r.runs)} | `);
    const plainBenchmark = plain(benchmark);
    for (const note of ['method', 'scope']) {
      const said = text(
        new RegExp(`<p data-lint="${note}"[^>]*>([\\s\\S]*?)</p>`).exec(html)?.[1] ?? '',
      );
      expect(said, note).not.toBe('');
      expect(plainBenchmark, note).toContain(said);
    }
  });

  it('has the playground, with the drafts and the demo design system it checks against', () => {
    const playground = section('Playground');
    expect(playground).not.toBe('');
    expect(playground).toContain('`check_ui`');
    expect(playground).toContain('never runs it');
    for (const draft of ['Agent draft', 'Dialog', 'Snippet', 'Clean']) {
      expect(playground).toContain(`**${draft}**`);
    }
    for (const component of ['Badge', 'Button', 'Card', 'Dialog', 'Input']) {
      expect(playground).toContain(`\`${component}\``);
    }
    expect(playground).toContain(`${SITE_URL}/playground`);
  });

  it('has the FAQ, every question as a section', () => {
    const faq = section('FAQ');
    expect(faq).not.toBe('');
    expect(faq).toContain('\n### How often is it wrong?\n');
    expect(faq).toContain('\n### Is the Claude Code plugin safe to install everywhere?\n');
    expect(faq).toContain(`](${SITE_URL}/docs/configuration#zero-config)`);
  });
});
