import fs from 'node:fs';
import path from 'node:path';

import { DesignSystem, type DesignSystemModel, type ResolvedConfig } from 'onsystem';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import Home, { metadata } from '@/app/page';
import { STEPS } from '@/components/loop-demo';
import { slug } from '@/components/markdown-blocks';
import { benchmark, corpus, demo, designSystem } from '@/lib/data';
import { HOME_CARD, HomeCard } from '@/lib/og';
import type { Preset } from '@/lib/playground';
import { applyFixes } from '@/lib/playground-edits';
import { DOCS_FILES } from '@/lib/site';

// The home page's first screen (ROADMAP-v2 section 3.8), the demo it leads into, and the social
// card drawn from the same finding card.
const root = path.join(import.meta.dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

const decode = (html: string) =>
  html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, '&');
/** Prose: every tag a word break. */
const text = (html: string) =>
  decode(html.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
/** Code and other text split into coloured spans: tags dropped, nothing added. */
const flat = (html: string) =>
  decode(html.replace(/<[^>]+>/g, ''))
    .replace(/\s+/g, ' ')
    .trim();
const words = (value: string) => value.split(/\s+/).filter(Boolean).length;

const home = renderToStaticMarkup(createElement(Home));
// Everything above the loop demo, after the JSON-LD.
const firstScreen = home.slice(
  home.indexOf('</script>', home.indexOf('<main')),
  home.indexOf('data-loop-demo'),
);

/** The findings `tsc` reports as well: an invalid variant, an unknown prop, a missing member. */
const TSC = new Set(['no-unknown-variant', 'no-unknown-prop', 'no-unknown-component']);
const finding = (ruleId: string) => {
  const found = demo.findings.find((f) => f.ruleId === ruleId);
  if (!found) throw new Error(`the demo draft has no ${ruleId} finding`);
  return found;
};
/**
 * The card's findings: palette color and native element, the two rules the v2 benchmark saw, then
 * an API the design system lacks.
 */
const CARD = [
  finding('no-hardcoded-color'),
  finding('prefer-design-system-component'),
  finding('no-unknown-variant'),
];
const strip = `tsc ${String(demo.findings.filter((f) => TSC.has(f.ruleId)).length)}/${String(demo.findings.length)} · onsystem ${String(demo.findings.length)}/${String(demo.findings.length)} on this draft`;

describe('the first screen', () => {
  it('is in front of the loop demo', () => {
    expect(firstScreen).toContain('<h1');
    expect(home.indexOf('data-loop-demo')).toBeGreaterThan(0);
    expect(home.slice(home.indexOf('data-loop-demo'))).toContain('~/acme-app');
  });

  it('puts the calls to action before the card, so a phone’s first screen has one', () => {
    const at = (marker: string) => {
      const index = firstScreen.indexOf(marker);
      expect(index, marker).toBeGreaterThan(-1);
      return index;
    };
    // One column below 1024 px, in this order: the copy, the calls to action, the card, the tabs.
    expect(at('data-hero-command')).toBeGreaterThan(at('</h1>'));
    expect(at('Try it in the browser')).toBeGreaterThan(at('data-hero-command'));
    expect(at('data-finding-card')).toBeGreaterThan(at('Try it in the browser'));
    expect(at('role="tablist"')).toBeGreaterThan(at('data-finding-card'));
    // Wide screens put the card beside all three, from the top.
    const card = /<figure[^>]*data-finding-card[^>]*>/.exec(firstScreen)?.[0] ?? '';
    expect(card).toMatch(/\blg:col-start-2\b/);
    expect(card).toMatch(/\blg:row-start-1\b/);
    expect(card).toMatch(/\blg:row-span-3\b/);
  });

  it('says what it checks in 45 words or fewer, leading with what the benchmark measured', () => {
    const match = /<h1[^>]*>([\s\S]*?)<\/h1>((?:\s*<p[^>]*>[\s\S]*?<\/p>)*)/.exec(firstScreen);
    const headline = text(match?.[1] ?? '');
    const copy = text(match?.[2] ?? '');
    expect(headline).toBe('Keeps coding agents on your design system.');
    expect(words(`${headline} ${copy}`)).toBeLessThanOrEqual(45);
    // The three invention rules fired 0 times in the benchmark's 1,240 runs: they come last.
    expect(copy).toMatch(/palette colors, native elements and APIs your design system lacks/);
    expect(copy).toContain('every edit and pull request');
    expect(copy).toContain(
      'Set it up once in your design-system package; every app in your monorepo gets it.',
    );
    expect(text(firstScreen)).not.toMatch(/invent/i);
  });

  it('shows no benchmark result and no false-positive rate', () => {
    const shown = text(firstScreen);
    expect(shown).not.toMatch(/\d\.\d+\s*→\s*\d/);
    expect(shown).not.toMatch(/errors per run|%/);
  });

  it('leads with a copyable check of your own app, and the registry-code section', () => {
    const shown = text(firstScreen);
    expect(flat(firstScreen)).toContain('$ npx -y onsystem check .');
    expect(firstScreen).toContain('aria-label="Copy the check command"');
    expect(shown).toContain('See what it finds in your app. No install, no config.');
    expect(firstScreen).toMatch(
      /<a[^>]*href="\/docs\/configuration#code-from-shadcn-registries"[^>]*>Code from shadcn registries<\/a>/,
    );
    expect(firstScreen).toMatch(/<a[^>]*href="\/docs"[^>]*>Get started/);
    expect(firstScreen).toMatch(/<a[^>]*href="\/playground"[^>]*>Try it in the browser/);
    // The star count lives in the header.
    expect(shown).not.toContain('Star on GitHub');
  });

  it('shows three of the demo’s findings in a card, with the import and what tsc reports', () => {
    const card = /<figure[^>]*data-finding-card[\s\S]*?<\/figure>/.exec(firstScreen)?.[0] ?? '';
    const shown = flat(card);
    expect(shown).toContain(demo.file);
    let at = -1;
    for (const f of CARD) {
      const next = shown.indexOf(`${f.found} → ${f.fix}`, at + 1);
      expect(next, `${f.ruleId}: ${f.found} → ${f.fix}`).toBeGreaterThan(at);
      at = next;
      // The line the agent wrote, as the draft has it.
      expect(shown).toContain(demo.draft.split('\n')[f.line - 1]?.trim());
    }
    expect(shown).toContain('import { Button } from "@/components/ui/button"');
    expect(shown).toContain(strip);
    expect(strip).toBe('tsc 3/11 · onsystem 11/11 on this draft');
  });

  it('installs from one row of tabs, and says what the Claude Code plugin installs', () => {
    const tabs = [...firstScreen.matchAll(/<button[^>]*role="tab"[^>]*>([^<]*)<\/button>/g)].map(
      (m) => m[1]?.replace(/\u00a0/g, ' '),
    );
    expect(tabs).toEqual(['Claude Code', 'Cursor', 'VS Code', 'Codex', 'Other MCP', 'CI']);
    expect(text(firstScreen)).toContain(
      'MCP server (shows the agent your components and tokens) and hook (checks every edit)',
    );
    const shown = flat(firstScreen);
    // The commands are the docs' own.
    for (const command of [
      'codex plugin marketplace add dgesteves/onsystem',
      'codex plugin add onsystem@dgesteves',
    ]) {
      expect(shown).toContain(command);
      expect(read('docs/clients.md')).toContain(command);
    }
    expect(shown).toContain('- uses: dgesteves/onsystem@v0');
    expect(read('docs/required-check.md')).toContain('- uses: dgesteves/onsystem@v0');
  });

  it('proves it with measured items only, from the generated data', () => {
    const proof = flat(/<ul[^>]*data-proof-row[\s\S]*?<\/ul>/.exec(firstScreen)?.[0] ?? '');
    expect(proof).toContain(
      `${demo.checkMs.toFixed(1)} ms to check the demo file. No model calls.`,
    );
    expect(proof).toContain(`Checked nightly on ${String(corpus.repos)} public repos`);
    expect(read('.github/workflows/corpus.yml')).toMatch(/schedule:\s*\n\s*- cron:/);
    expect(proof).toContain('shadcn/ui, your own package, or MUI');
    expect(proof).toContain('MCP Registry');
    expect(proof).toContain('GitHub Marketplace');
    expect(proof).toContain(
      `Benchmark: ${benchmark.runs.toLocaleString('en-US')} agent runs, ${String(benchmark.models.length)} models`,
    );
    expect(firstScreen).toMatch(/<a[^>]*href="\/benchmark"[^>]*>Benchmark: /);
  });
});

describe('the rest of the home page', () => {
  it('describes onsystem by what it measured, in the meta description too', () => {
    const description = String(metadata.description);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(description).toMatch(/^Keeps coding agents on your design system: /);
    expect(description).toMatch(/palette colors, native elements and APIs your system lacks/);
    expect(description).not.toMatch(/invent/i);
    expect(text(home)).not.toMatch(/invent/i);
  });

  it('ends on the same command as the first screen', () => {
    const cta = /<section aria-labelledby="start-title"[\s\S]*?<\/section>/.exec(home)?.[0] ?? '';
    expect(text(cta)).toContain('npx -y onsystem check .');
    expect(text(cta)).not.toContain('onsystem inspect');
  });

  it('compares with @shadcn/lint in one table', () => {
    const section = /<section id="shadcn-lint"[\s\S]*?<\/section>/.exec(home)?.[0] ?? '';
    expect(section.match(/<table/g)).toHaveLength(1);
    expect(text(/<thead[\s\S]*?<\/thead>/.exec(section)?.[0] ?? '')).toMatch(
      /onsystem.*@shadcn\/lint/,
    );
  });

  it('links only to sections the docs have', () => {
    const files = new Map(Object.entries(DOCS_FILES).map(([file, page]) => [page, file]));
    const links = [...home.matchAll(/href="(\/[^"#]*)#([^"]+)"/g)]
      .map(([, page = '', anchor = '']) => ({ page, anchor, file: files.get(page) }))
      .filter((link) => link.file);
    expect(links.length).toBeGreaterThan(5);
    for (const { page, anchor, file } of links) {
      const markdown = read(`docs/${String(file)}`).replace(/^```[\s\S]*?^```/gm, '');
      const ids = [...markdown.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)].map((m) => slug(m[1] ?? ''));
      // #144 adds "## Code from shadcn registries" to docs/configuration.md; until it merges, the
      // first screen's link to it has no section to land on. Once any heading there names
      // registries, this link has to resolve like every other.
      if (anchor === 'code-from-shadcn-registries' && !/^#+ .*registr/im.test(markdown)) continue;
      expect(ids, `${page}#${anchor}`).toContain(anchor);
    }
  });

  it('says how to adopt it in one sentence, and links what the agent sees', () => {
    const adopt = /<section id="baseline"[\s\S]*?<\/section>/.exec(home)?.[0] ?? '';
    expect(adopt).not.toContain('data-code-block');
    // The team rollout page records the baseline as one of its steps.
    expect(adopt).toContain('href="/docs/rollout"');
    expect(read('docs/rollout.md')).toContain('## Record the baseline');
    expect(home).not.toContain('id="agent-view"');
    expect(home).toContain('href="/docs/tools"');
    expect(read('docs/tools.md')).toContain('What the agent sees');
  });
});

/** The capitalised JSX tags a file uses, and the names it imports. */
function tagsAndImports(code: string) {
  const imported = new Set(
    [...code.matchAll(/import\s*\{([^}]*)\}\s*from/g)].flatMap((m) =>
      (m[1] ?? '').split(',').map((name) => name.trim()),
    ),
  );
  const tags = new Set([...code.matchAll(/<([A-Z][\w.]*)/g)].map((m) => m[1] ?? ''));
  return { imported, tags };
}

/** Design-system components, and their parts, that are given a className. */
function restyled(code: string): string[] {
  const names = new Set(designSystem.components.flatMap((c) => [c.name, ...c.parts]));
  return [...code.matchAll(/<([A-Z]\w*)\b[^>]*\sclassName=/g)]
    .map((m) => m[1] ?? '')
    .filter((name) => names.has(name));
}

describe('the demo ends on idiomatic code', () => {
  it('in the loop demo: every component imported, and no Button restyled with classes', () => {
    const { imported, tags } = tagsAndImports(demo.fixed);
    for (const tag of tags) expect(imported, tag).toContain(tag);
    // Button has variants for its background, padding and radius: classes there restyle it.
    expect(restyled(demo.fixed).filter((name) => name === 'Button')).toEqual([]);
    expect(demo.fixed).toMatch(/<Button variant="outline">\s*Cancel/);
    expect(demo.fixed).toMatch(/<Button aria-label="Delete" variant="ghost" size="icon">/);
  });

  it('says that the check found no design-system errors, not that review has nothing left', () => {
    expect(STEPS).toBeDefined();
    expect(STEPS.at(-1)?.caption).toBe('check_ui again: no design-system errors left.');
    expect(STEPS.map((s) => s.caption).join(' ')).not.toMatch(/code review/);
  });

  it('in the playground’s Dialog, after Apply all', () => {
    const generated = (file: string): unknown =>
      JSON.parse(fs.readFileSync(path.join(import.meta.dirname, '../generated', file), 'utf8'));
    const data = generated('playground-model.json') as {
      file: string;
      model: DesignSystemModel;
      config: ResolvedConfig;
    };
    const { presets } = generated('playground.json') as { presets: Preset[] };
    const dialog = presets.find((p) => p.id === 'delete-dialog');
    const ds = new DesignSystem(data.model, data.config);
    const { code } = applyFixes(
      dialog?.code ?? '',
      ds.check(dialog?.code ?? '', data.file).diagnostics,
    );
    expect(ds.check(code, data.file).diagnostics).toEqual([]);
    const { imported, tags } = tagsAndImports(code);
    for (const tag of tags) expect(imported, tag).toContain(tag);
    expect(restyled(code)).toEqual([]);
    // The close control is an icon button, named.
    expect(code).toMatch(
      /<Button\s+aria-label="Close"\s+variant="ghost"\s+size="icon"\s+onClick=\{onClose\}\s*>/,
    );
  });
});

describe('the home social card', () => {
  const card = flat(
    renderToStaticMarkup(createElement(HomeCard, { ...HOME_CARD.size, footer: 'x' })),
  );

  it('is the first screen’s finding card, not the v1 benchmark', () => {
    for (const f of CARD) expect(card).toContain(`${f.found} → ${f.fix}`);
    expect(card).toContain(strip);
    expect(card).not.toMatch(/clean components|10\/10|6\/10/);
  });

  it('says the same in its alt text', () => {
    expect(HOME_CARD.alt).not.toMatch(/clean components|10\/10|6\/10|invent/i);
    for (const f of CARD) expect(HOME_CARD.alt).toContain(`${f.found} → ${f.fix}`);
    expect(HOME_CARD.alt).toContain('tsc reports 3 of its 11 problems');
  });
});
