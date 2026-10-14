import fs from 'node:fs';
import path from 'node:path';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import HowItWorksPage from '@/app/docs/how-it-works/page';
import Home from '@/app/page';
import RulesPage from '@/app/rules/page';
import { sentences } from '@/components/sentence-list';
import { demo, ruleCatalog, tools } from '@/lib/data';

vi.mock('next/navigation', () => ({ usePathname: () => '/docs/how-it-works' }));

const site = path.join(import.meta.dirname, '..');
const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

describe('the home page', () => {
  const html = renderToStaticMarkup(createElement(Home));

  it('shows which of the draft’s problems tsc reports, from the demo’s findings', () => {
    const table = /<table[\s\S]*?<\/table>/.exec(html)?.[0] ?? '';
    expect(text(table)).toContain('The draft, checked by each');
    expect(table.match(/<tr>/g)?.length).toBe(demo.findings.length + 1);
    expect(text(table)).toContain(`Reported 3/${String(demo.findings.length)}`);
    expect(table.match(/tsc reports it/g)).toHaveLength(3);
    // The lead says the same number the table does.
    expect(text(html)).toContain(
      `reports 3 of the ${String(demo.errorCount + demo.warningCount)} problems`,
    );
  });

  it('nests "On real codebases" under its section', () => {
    expect(html).toMatch(/<section id="benchmark"[\s\S]*?<section id="real-codebases"/);
    expect(html).toMatch(/<h3 id="real-codebases-title"/);
  });
});

describe('long fix details', () => {
  it('become one list item per sentence, every sentence kept', () => {
    const parts = sentences(ruleCatalog.details);
    expect(parts.length).toBeGreaterThan(4);
    expect(parts.join(' ')).toBe(ruleCatalog.details.trim().replace(/\s+/g, ' '));
    const html = renderToStaticMarkup(createElement(RulesPage));
    const fixes = /<section id="fixes"[\s\S]*?<\/section>/.exec(html)?.[0] ?? '';
    expect(fixes.match(/<li /g)).toHaveLength(parts.length);
  });

  it('do not split on a decimal or inside code', () => {
    expect(sentences('Under 0.1 the fix is offered. `a. b` stays. Next one.')).toEqual([
      'Under 0.1 the fix is offered.',
      '`a. b` stays.',
      'Next one.',
    ]);
  });
});

describe('the architecture diagram', () => {
  it('is HTML in the theme, with the image’s alt text and the real tools', () => {
    const html = renderToStaticMarkup(createElement(HowItWorksPage));
    expect(html).not.toContain('architecture.svg');
    const figure = /<figure[\s\S]*?<\/figure>/.exec(html)?.[0] ?? '';
    expect(figure).toMatch(/<figcaption class="sr-only">[^<]+<\/figcaption>/);
    for (const tool of tools.tools) expect(figure).toContain(tool.name);
    expect(figure).toContain(`${String(ruleCatalog.rules.length)} rules, with fixes`);
  });
});

describe('touch targets', () => {
  it('give small controls a 44 px target on coarse pointers', () => {
    const css = fs.readFileSync(path.join(site, 'app/globals.css'), 'utf8');
    expect(css).toMatch(
      /@media \(pointer: coarse\) \{[\s\S]*?\.tap::after \{[\s\S]*?width: max\(100%, 44px\);[\s\S]*?height: max\(100%, 44px\);/,
    );
    for (const file of [
      'components/copy-button.tsx',
      'components/tabs.tsx',
      'components/loop-demo.tsx',
      'components/playground.tsx',
      'components/theme-switch.tsx',
    ]) {
      expect(fs.readFileSync(path.join(site, file), 'utf8'), file).toMatch(/className=\{?[`"]tap /);
    }
  });
});
