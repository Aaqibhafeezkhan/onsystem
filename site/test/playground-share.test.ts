import fs from 'node:fs';
import path from 'node:path';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApplyAll, copyText } from '@/components/playground';
import type { Preset } from '@/lib/playground';
import { applyLabel, decisionNote, undecided } from '@/lib/playground-edits';

// The drafts the playground serves (pnpm generate writes them).
const { presets } = JSON.parse(
  fs.readFileSync(path.join(import.meta.dirname, '../generated/playground.json'), 'utf8'),
) as { presets: Preset[] };

const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

afterEach(() => {
  vi.unstubAllGlobals();
});

/** The browser's ClipboardItem, holding what it was given. */
class Item {
  constructor(readonly items: Record<string, Blob | Promise<Blob>>) {}
}

describe('Copy link', () => {
  it('starts the clipboard write in the click, before the link is worked out, as Safari needs', async () => {
    const write = vi.fn((_items: Item[]) => Promise.resolve());
    const writeText = vi.fn((_text: string) => Promise.resolve());
    vi.stubGlobal('ClipboardItem', Item);
    vi.stubGlobal('navigator', { clipboard: { write, writeText } });

    const url = Promise.withResolvers<string>();
    const copied = copyText(url.promise);
    // Safari refuses a write that starts after an await in the click's handler.
    expect(write).toHaveBeenCalledTimes(1);

    url.resolve('https://onsystem.vercel.app/playground#code=abc');
    await copied;
    const item = write.mock.calls[0]?.[0][0];
    expect(await (await item?.items['text/plain'])?.text()).toBe(
      'https://onsystem.vercel.app/playground#code=abc',
    );
    expect(writeText).not.toHaveBeenCalled();
  });

  it('uses writeText where there is no ClipboardItem, and fails when the clipboard does', async () => {
    const writeText = vi.fn((_text: string) => Promise.resolve());
    vi.stubGlobal('ClipboardItem', undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    await copyText(Promise.resolve('https://onsystem.vercel.app/playground'));
    expect(writeText).toHaveBeenCalledWith('https://onsystem.vercel.app/playground');

    vi.stubGlobal('ClipboardItem', Item);
    vi.stubGlobal('navigator', {
      clipboard: { write: () => Promise.reject(new Error('NotAllowedError')) },
    });
    await expect(copyText(Promise.resolve('x'))).rejects.toThrow('NotAllowedError');
    // No clipboard at all, as on a page served over plain HTTP.
    vi.stubGlobal('navigator', {});
    await expect(copyText(Promise.resolve('x'))).rejects.toThrow();
  });
});

describe('the Apply all row', () => {
  const draft = presets.find((p) => p.result.diagnostics.some((d) => d.fix?.length));
  if (!draft) throw new Error('no draft with fixes');
  const { diagnostics } = draft.result;
  const row = (stale: boolean) =>
    renderToStaticMarkup(
      createElement(ApplyAll, { diagnostics, stale, noteId: 'open', onApply: () => undefined }),
    );

  it('keeps its place while edited code is checked again, its button off', () => {
    // It went and came back while a shared link's code was checked, and the findings moved with it.
    const fixes = diagnostics.filter((d) => d.fix?.length).length;
    const expected = [
      undecided(diagnostics) > 0 ? decisionNote(undecided(diagnostics)) : '',
      applyLabel(fixes),
    ]
      .join(' ')
      .trim();
    expect(text(row(false))).toBe(expected);
    expect(row(false)).not.toContain('disabled=""');
    expect(text(row(true))).toBe(expected);
    expect(row(true)).toMatch(/<button type="button" disabled=""/);
  });

  it('is not there when no finding has a fix', () => {
    const none = diagnostics.filter((d) => !d.fix?.length);
    expect(
      renderToStaticMarkup(
        createElement(ApplyAll, {
          diagnostics: none,
          stale: false,
          noteId: 'open',
          onApply: () => undefined,
        }),
      ),
    ).toBe('');
  });
});
