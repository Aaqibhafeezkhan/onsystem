import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import Home from '@/app/page';
import { rules } from '@/lib/data';

describe('on a 320 px screen', () => {
  it('the How it works cards fit: a rule id too long for its row wraps', () => {
    // The card's text is 320 - 2 × 16 (page) - 2 × 20 (card padding) - 2 (border) = 246 px wide.
    // A row is the id in 12.5 px Geist Mono (0.6 em a character), a 12 px gap and the severity
    // in 11 px.
    const longest = Math.max(...rules.map((rule) => rule.id.length));
    const row = longest * 0.6 * 12.5 + 12 + 'error'.length * 0.6 * 11;
    expect(row).toBeGreaterThan(246);

    // So the id may not keep to one line: then the stacked cards took its width, and ran 8 px past
    // the page.
    const html = renderToStaticMarkup(createElement(Home));
    const section = /<section id="how-it-works"[\s\S]*?<\/section>/.exec(html)?.[0] ?? '';
    const ids = [...section.matchAll(/<span class="([^"]*)">([a-z-]+)<\/span>/g)].filter(
      ([, , id]) => rules.some((rule) => rule.id === id),
    );
    expect(ids).toHaveLength(rules.length);
    for (const [, classes] of ids) {
      expect(classes).not.toMatch(/\b(truncate|whitespace-nowrap|text-nowrap)\b/);
      expect(classes).toContain('[overflow-wrap:anywhere]');
    }
  });
});
