import { spawnSync } from 'node:child_process';
import path from 'node:path';

import { RULE_IDS } from 'onsystem';
import eslintPlugin from 'onsystem/eslint';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import RulePage, {
  dynamicParams,
  generateMetadata,
  generateStaticParams,
} from '@/app/rules/[id]/page';
import { generateStaticParams as imageParams } from '@/app/rules/[id]/opengraph-image';
import RulesPage from '@/app/rules/page';
import sitemap from '@/app/sitemap';
import { ruleCatalog } from '@/lib/data';
import { llmsTxt } from '@/lib/llms';
import { ruleFromHash, ruleHref, SITE_URL } from '@/lib/site';

const ids = [...RULE_IDS];
const params = (id: string) => ({ params: Promise.resolve({ id }) });
const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

/** Inline Markdown as the page shows it: `code` without its backticks. */
const plain = (markdown: string) => markdown.replace(/`/g, '');

async function renderRule(id: string): Promise<string> {
  return renderToStaticMarkup(await RulePage(params(id)));
}

const index = renderToStaticMarkup(createElement(RulesPage));

describe('/rules/<id>', () => {
  it('has a page for every rule in RULE_IDS, and no other', () => {
    expect(generateStaticParams().map((p) => p.id)).toEqual(ids);
    expect(imageParams().map((p) => p.id)).toEqual(ids);
    expect(ruleCatalog.rules.map((rule) => rule.id)).toEqual(ids);
    expect(dynamicParams).toBe(false);
  });

  it.each(ids)(
    '%s: what it catches, why, the example, the fix, options, suppression and related rules',
    async (id) => {
      const rule = ruleCatalog.rules.find((r) => r.id === id);
      if (!rule) throw new Error(`no rule ${id}`);
      const html = await renderRule(id);
      const page = text(html);
      expect(html).toMatch(new RegExp(`<h1[^>]*>${id}</h1>`));
      expect(page).toContain(`${rule.severity === 'error' ? 'error' : 'warning'} by default`);
      for (const id of ['example', 'fixes', 'options', 'suppressing', 'related']) {
        expect(html, id).toContain(`id="${id}"`);
      }
      // The example, the finding messages and the fixed code, as generated.
      expect(page).toContain(plain(rule.findings[0]?.message ?? 'missing'));
      expect(page).toContain(`onsystem-disable-next-line ${id} -- why this one is intended`);
      expect(page).toContain(`"${id}": "${rule.severity === 'error' ? 'warn' : 'error'}"`);
      expect(rule.related.length).toBeGreaterThan(0);
      for (const related of rule.related) {
        expect(ids).toContain(related);
        expect(html).toContain(`href="/rules/${related}"`);
      }
    },
  );

  it('gives each rule its own title, description and canonical URL', async () => {
    for (const id of ids) {
      const metadata = await generateMetadata(params(id));
      expect(metadata.title).toBe(id);
      expect(metadata.alternates?.canonical).toBe(`/rules/${id}`);
      const rule = ruleCatalog.rules.find((r) => r.id === id);
      expect(metadata.description?.startsWith(plain(rule?.description ?? '-'))).toBe(true);
      expect(metadata.description).not.toContain('`');
      expect(metadata.description?.length).toBeLessThanOrEqual(160);
    }
  });

  it('is a 404 for an id that is not a rule', async () => {
    await expect(RulePage(params('no-such-rule'))).rejects.toThrow();
  });

  it('says the icon-button fix writes a label only where the icon or the code says the action', async () => {
    // Since #160 a plus, a chevron or an X whose handler does not name one action gets a label
    // suggested without a fix, as the docs/rules.md row says.
    const rule = ruleCatalog.rules.find((r) => r.id === 'icon-button-accessible-name');
    expect(rule?.suggests).toContain(
      'fixed only when the icon or the code says what the button does',
    );
    expect(rule?.why).not.toMatch(/guesses the label/);
    expect(rule?.why).toContain('Otherwise the message suggests a label without a fix.');
    expect(text(await renderRule('icon-button-accessible-name'))).toContain(
      plain(rule?.why ?? 'missing'),
    );
  });

  it('is in the sitemap and llms.txt', () => {
    const urls = sitemap().map((entry) => entry.url);
    const llms = llmsTxt();
    for (const id of ids) {
      expect(urls).toContain(`${SITE_URL}/rules/${id}`);
      expect(llms).toContain(`(${SITE_URL}/rules/${id})`);
    }
  });
});

describe('/rules', () => {
  it('lists every rule with its severity and one line, linking to its page', () => {
    for (const rule of ruleCatalog.rules) {
      const item = new RegExp(`<li id="${rule.id}"[^>]*>([\\s\\S]*?)</li>`).exec(index)?.[1] ?? '';
      expect(item, rule.id).toContain(`href="/rules/${rule.id}"`);
      expect(text(item)).toContain(`${rule.severity === 'error' ? 'error' : 'warning'} by default`);
      expect(text(item)).toContain(plain(rule.description));
    }
  });

  it('keeps the sections other pages link to', () => {
    for (const id of ['configure', 'suppressing-findings', 'fixes']) {
      expect(index).toContain(`id="${id}"`);
    }
  });
});

describe('old /rules#<id> links', () => {
  it('go on to the rule’s page; other anchors stay on /rules', () => {
    expect(ruleFromHash('#no-unknown-prop', ids)).toBe('/rules/no-unknown-prop');
    expect(ruleFromHash('no-unknown-prop', ids)).toBe('/rules/no-unknown-prop');
    expect(ruleFromHash('#suppressing-findings', ids)).toBeNull();
    expect(ruleFromHash('#fixes', ids)).toBeNull();
    expect(ruleFromHash('', ids)).toBeNull();
    expect(ruleFromHash('#%E0%A4%A', ids)).toBeNull();
    expect(ruleHref('no-unknown-prop')).toBe('/rules/no-unknown-prop');
  });

  it('from the ESLint plugin land on the rule, with or without JavaScript', () => {
    for (const id of ids) {
      const url = new URL(eslintPlugin.rules[id]?.meta?.docs?.url ?? '');
      expect(url.pathname).toBe('/rules');
      expect(ruleFromHash(url.hash, ids)).toBe(`/rules/${id}`);
      expect(index).toContain(`<li id="${id}"`);
    }
  });

  it('from the CLI’s SARIF output land on the rule, or on a section of /rules', () => {
    const repo = path.join(import.meta.dirname, '../..');
    const result = spawnSync(
      process.execPath,
      [
        path.join(repo, 'dist/cli.js'),
        'check',
        'app/settings/danger-zone.tsx',
        '--format',
        'sarif',
      ],
      { cwd: path.join(repo, 'examples/shadcn-demo'), encoding: 'utf8' },
    );
    const sarif = JSON.parse(result.stdout) as {
      runs: { tool: { driver: { rules: { id: string; helpUri: string }[] } } }[];
    };
    const rules = sarif.runs[0]?.tool.driver.rules ?? [];
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      const url = new URL(rule.helpUri);
      expect(url.pathname).toBe('/rules');
      const anchor = url.hash.slice(1);
      expect(index, rule.helpUri).toContain(`id="${anchor}"`);
      if ((ids as string[]).includes(anchor)) {
        expect(ruleFromHash(url.hash, ids)).toBe(`/rules/${anchor}`);
      }
    }
  });
});
