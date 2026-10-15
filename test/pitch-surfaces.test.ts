import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { section } from './markdown.js';

// The one-line pitch (test/readme.test.ts) names what benchmark v2 measured: palette colors,
// native elements and APIs the design system lacks, and no invention, which the benchmark never
// saw. These are the longer pages that introduce onsystem or its rules, in the same terms.

const root = path.resolve(import.meta.dirname, '..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('the pitch beyond the one-liner', () => {
  const pluginReadme = read('plugins/onsystem/README.md').split('\n\n')[1] ?? '';
  const pluginHeadings = [...read('docs/plugin.md').matchAll(/^#{1,6} (.+)$/gm)].map(
    (m) => m[1] ?? '',
  );
  // The onsystem row of the comparison table: what it checks in what the agent wrote.
  const compared =
    section(read('docs/how-it-works.md'), 'How it compares')
      .split('\n')
      .find((line) => line.startsWith('| **onsystem**'))
      ?.split('|')[3]
      ?.trim() ?? '';
  const rulesCard =
    /lead="([^"]+)"/.exec(read('site/app/rules/opengraph-image.tsx'))?.[1] ?? 'missing';

  it('says what the hook blocks, the comparison row and the rules card without invention', () => {
    const surfaces = {
      'plugins/onsystem/README.md': pluginReadme,
      'docs/plugin.md headings': pluginHeadings.join('\n'),
      'docs/how-it-works.md, How it compares': compared,
      'site/app/rules/opengraph-image.tsx': rulesCard,
    };
    for (const [where, text] of Object.entries(surfaces)) {
      expect(text, where).not.toBe('');
      expect(text, where).not.toMatch(/invent/i);
    }
    // In the benchmark's order: colors first, then native elements, then the APIs it lacks.
    expect(pluginReadme).toContain(
      'When Claude writes a palette color, a native element the design system wraps, or a component, prop or variant value it lacks, the hook answers the edit with a blocking error',
    );
    expect(compared).toMatch(/^Hardcoded colors.*native elements.*it lacks/);
    expect(rulesCard).toMatch(/^Hardcoded colors.*native elements, APIs your design system lacks/);
  });
});
