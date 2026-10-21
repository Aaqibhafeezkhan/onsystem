import fs from 'node:fs';
import path from 'node:path';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { linkHash, Playground, readLinkHash } from '@/components/playground';
import { PLAYGROUND_LIMITS, type Preset } from '@/lib/playground';

// The drafts the playground serves (pnpm generate writes them).
const { presets } = JSON.parse(
  fs.readFileSync(path.join(import.meta.dirname, '../generated/playground.json'), 'utf8'),
) as { presets: Preset[] };
const [first] = presets;
if (!first) throw new Error('no drafts');
const limit = 4 * PLAYGROUND_LIMITS.maxBytes;

describe('a link to the playground', () => {
  it('is the bare page for the first draft, and names any other draft', async () => {
    expect(await linkHash(first.code, presets)).toBe('');
    for (const p of presets.slice(1)) {
      const hash = await linkHash(p.code, presets);
      expect(hash).toBe(`#draft=${p.id}`);
      expect(await readLinkHash(hash, presets, limit)).toEqual({ preset: p });
    }
  });

  it('carries edited code in the fragment, compressed, and opens it unchanged', async () => {
    const code = first.code.replace('Delete workspace', 'Supprimer l’espace — 削除 🗑️');
    expect(code).not.toBe(first.code);
    const hash = await linkHash(code, presets);
    expect(hash).toMatch(/^#code=[\w-]+$/);
    expect(hash.length).toBeLessThan(code.length);
    expect(await readLinkHash(hash, presets, limit)).toEqual({ code });
  });

  it('opens code that is a draft’s as that draft', async () => {
    const dialog = presets[1];
    if (!dialog) throw new Error('one draft only');
    // Written when there was no such draft.
    const hash = await linkHash(dialog.code, []);
    expect(hash).toMatch(/^#code=/);
    expect(await readLinkHash(hash, presets, limit)).toEqual({ preset: dialog });
  });

  it('opens nothing from a fragment it did not write, or a damaged one', async () => {
    const good = await linkHash(`${first.code}\n// mine`, presets);
    for (const hash of [
      '',
      '#findings',
      '#draft=',
      '#draft=gone',
      '#draft=%E0%A4%A',
      '#code=',
      '#code=*not base64*',
      '#code=AAAA',
      good.slice(0, -6),
    ]) {
      expect(await readLinkHash(hash, presets, limit), hash).toBeUndefined();
    }
  });

  it('stops reading past the limit, so a small link cannot expand into a huge page', async () => {
    const big = `// ${'x'.repeat(limit)}`;
    const hash = await linkHash(big, presets);
    // A run of one character deflates to almost nothing.
    expect(hash.length).toBeLessThan(1000);
    expect(await readLinkHash(hash, presets, limit)).toBeUndefined();
    expect(await readLinkHash(hash, presets, big.length)).toEqual({ code: big });
  });
});

describe('the playground', () => {
  const html = renderToStaticMarkup(
    createElement(Playground, { presets, maxBytes: PLAYGROUND_LIMITS.maxBytes }),
  );

  it('has a Copy link button beside Reset', () => {
    expect(html).toMatch(
      /<button type="button" class="tap ml-auto [^"]*">[\s\S]*?Copy link<\/button>/,
    );
    expect(html.indexOf('Copy link')).toBeLessThan(html.indexOf('Reset'));
  });

  it('takes focus at the findings when the editor bar jumps there', () => {
    // The jump scrolls without changing the fragment, which holds the link to the code.
    expect(html).toMatch(/<section [^>]*id="findings" tabindex="-1"/);
  });
});
