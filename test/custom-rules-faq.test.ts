import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadConfig, RULE_IDS } from '../src/config.js';
import { fixture, load, TSCONFIG } from './helpers.js';

// "Can I add our own rules?" is the FAQ's answer to the question users ask once they see the
// rules: what the config does with a rule id it does not know, what already covers the commonest
// ask (no raw <a> where the design system has a Link), and where a new built-in rule starts.

const root = path.resolve(import.meta.dirname, '..');
const read = (file: string) =>
  fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');

/** The FAQ answer to `question`, as written in site/lib/faq.ts. */
function answer(question: string): string {
  const faq = read('site/lib/faq.ts');
  const start = faq.indexOf(`'${question}',`);
  expect(start, question).toBeGreaterThan(-1);
  return faq.slice(start, faq.indexOf('\n  ],', start));
}

describe('the FAQ on custom rules (site/lib/faq.ts)', () => {
  const text = answer('Can I add our own rules?');

  it('says the config rejects a rule id it does not know', async () => {
    expect(text).toContain('rejects a rule id it does not know');
    const dir = fixture({
      'onsystem.config.json': JSON.stringify({ rules: { 'no-raw-anchor': 'error' } }),
    });
    await expect(loadConfig({ root: dir })).rejects.toThrow(/Unknown rule "no-raw-anchor"/);
  });

  it('names the rule that reports a raw <a> where the design system has a Link', async () => {
    const rule = 'prefer-design-system-component';
    expect(RULE_IDS).toContain(rule);
    expect(text).toContain(`\`${rule}\``);
    const system = await load(
      fixture(
        {
          'tsconfig.json': TSCONFIG,
          'onsystem.config.json': '{ "tokens": [] }',
          'components/ui/link.tsx': `import * as React from "react"
export function Link(props: React.ComponentProps<"a">) {
  return <a className="underline" {...props} />
}`,
        },
        { nodeModules: true },
      ),
    );
    const { diagnostics } = system.check(`<a href="/docs">Docs</a>`, 'page.tsx');
    expect(diagnostics.map((d) => d.ruleId)).toEqual([rule]);
    expect(diagnostics[0]?.message).toContain('Use <Link>');
  });

  it('links the steps for adding a built-in rule in CONTRIBUTING.md', () => {
    expect(read('CONTRIBUTING.md')).toContain('\n## Adding a lint rule\n');
    expect(text).toContain(
      '(https://github.com/dgesteves/onsystem/blob/main/CONTRIBUTING.md#adding-a-lint-rule)',
    );
    expect(text).toContain('[ESLint plugin](/docs/eslint)');
  });
});
