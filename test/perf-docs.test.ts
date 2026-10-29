import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { section } from './markdown.js';

// docs/how-it-works.md said only that onsystem "takes milliseconds", and the FAQ the same. The
// "Performance and footprint" table has the measured times and the install size instead, written
// by scripts/perf.mjs from runs on a named machine. These tests hold the table to what the
// script writes and to the corpus commits it measured, so a hand edit or a corpus bump shows.

const root = path.resolve(import.meta.dirname, '..');
const read = (file: string) =>
  fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const doc = read('docs/how-it-works.md');

interface Repos {
  repos: { name: string; url: string; sha: string; runs: { name: string }[] }[];
}

/** What perf.mjs writes, from the "Measured with" line on, and its rows as [measured, result]. */
function perfBlock(): { text: string; rows: [string, string][] } {
  const perf = section(doc, 'Performance and footprint');
  const start = perf.indexOf('\nMeasured with onsystem ');
  expect(start).toBeGreaterThan(-1);
  const text = perf.slice(start);
  const rows = text
    .split('\n')
    .filter((line) => line.startsWith('| ') && !/^\| -+ \|/.test(line))
    .slice(1)
    .map((line) => {
      const [measured = '', result = ''] = line
        .slice(2, -2)
        .split(' | ')
        .map((cell) => cell.trim());
      return [measured, result] as [string, string];
    });
  return { text, rows };
}

describe('Performance and footprint (docs/how-it-works.md)', () => {
  it('says where, when and with what the numbers were measured', () => {
    const { text } = perfBlock();
    expect(text).toMatch(
      /^\s*Measured with onsystem \d+\.\d+\.\d+ on .+ \(\d+ cores, \d+ GB\), .+, Node\.js \d+\.\d+\.\d+, on \d{4}-\d{2}-\d{2}, with `node scripts\/perf\.mjs`: each time is the median of \d+ runs\./,
    );
    expect(fs.existsSync(path.join(root, 'scripts/perf.mjs'))).toBe(true);
  });

  it('has the rows perf.mjs writes, each with a measured result', () => {
    const { rows } = perfBlock();
    const measured = rows.map(([m]) => m);
    expect(measured.filter((m) => m.startsWith('`check` on '))).toHaveLength(2);
    expect(
      measured.filter((m) => m.includes('Claude Code hook') || m.includes('npx')),
    ).toHaveLength(2);
    expect(measured.some((m) => m.startsWith('The MCP server on '))).toBe(true);
    expect(measured.some((m) => m.startsWith('`check_ui` on '))).toBe(true);
    expect(measured.some((m) => m.startsWith('`search_components`'))).toBe(true);
    expect(measured.some((m) => m.startsWith('The package (`onsystem@'))).toBe(true);
    expect(measured).toContain('Installed with npm into an empty project');
    expect(measured).toContain('Provenance');
    for (const [m, result] of rows) {
      if (m === 'Provenance') continue;
      expect(result, m).toMatch(/\d/);
    }
  });

  it('names the corpus commits it measured, as corpus/repos.json pins them', () => {
    // A new pin means new code to check: run scripts/perf.mjs --write again.
    const { repos } = JSON.parse(read('corpus/repos.json')) as Repos;
    const { rows } = perfBlock();
    const apps = rows.filter(([m]) => /^(`check` on |The MCP server on )/.test(m));
    expect(apps).toHaveLength(3);
    for (const [m] of apps) {
      const link = /\[[^\]]+\]\((https:\/\/github\.com\/[^)]+)\) `([0-9a-f]{7})`/.exec(m);
      expect(link, m).not.toBeNull();
      const repo = repos.find((r) => r.url === link?.[1]);
      expect(repo, m).toBeDefined();
      expect(repo?.sha.slice(0, 7), m).toBe(link?.[2]);
    }
  });

  it('measures the hook on a file the demo has', () => {
    const { rows } = perfBlock();
    const hook = rows.find(([m]) => m.startsWith('The Claude Code hook'))?.[0] ?? '';
    const file = /the demo's `([^`]+)`/.exec(hook)?.[1];
    expect(file).toBeDefined();
    expect(fs.existsSync(path.join(root, 'examples/shadcn-demo', file ?? ''))).toBe(true);
  });

  it('says the package has provenance only while releases publish it', () => {
    const { rows } = perfBlock();
    const provenance = rows.find(([m]) => m === 'Provenance')?.[1] ?? '';
    const { publishConfig } = JSON.parse(read('package.json')) as {
      publishConfig?: { provenance?: boolean };
    };
    if (provenance.startsWith('Signed')) expect(publishConfig?.provenance).toBe(true);
  });
});

describe('the speed claims', () => {
  it('quote the table rather than a bare "takes milliseconds"', () => {
    const faq = read('site/lib/faq.ts');
    for (const [file, text, link] of [
      ['docs/how-it-works.md', doc, '](#performance-and-footprint)'],
      ['site/lib/faq.ts', faq, '](/docs/how-it-works#performance-and-footprint)'],
    ] as const) {
      expect(text, file).not.toMatch(/takes milliseconds/);
      expect(text, file).toContain(link);
    }
  });
});
