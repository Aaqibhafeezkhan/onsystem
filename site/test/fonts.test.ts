import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import * as fonts from '@/app/fonts';

// next/font/local is a build-time transform: here it hands back the options it was given.
vi.mock('next/font/local', () => ({ default: (options: unknown) => options }));

interface Options {
  src: string;
  display?: string;
  preload?: boolean;
  adjustFontFallback?: string | false;
  fallback?: string[];
}
const { sans, mono } = fonts as unknown as { sans: Options; mono: Options };

/** Every glyph's width in em, for a monospace TrueType font: hhea's widest advance over head's units. */
function monospaceAdvance(file: string): number {
  const font = fs.readFileSync(file);
  const tables = new Map<string, number>();
  for (let i = 0; i < font.readUInt16BE(4); i++) {
    const record = 12 + 16 * i;
    tables.set(font.toString('latin1', record, record + 4), font.readUInt32BE(record + 8));
  }
  const at = (tag: string) => tables.get(tag) ?? Number.NaN;
  expect(font.readUInt32BE(at('post') + 12), 'isFixedPitch').not.toBe(0);
  return font.readUInt16BE(at('hhea') + 10) / font.readUInt16BE(at('head') + 18);
}

// Measured from the fonts' files (advanceWidthMax / unitsPerEm): Menlo 1233/2048 on macOS,
// Courier New 1229/2048. Liberation Mono is made to Courier New's metrics.
const ADVANCE: Record<string, number> = {
  Menlo: 1233 / 2048,
  'Courier New': 1229 / 2048,
  'Liberation Mono': 1229 / 2048,
};

describe('the fonts', () => {
  it('keep the sans’s swap from moving the layout: it shows only if it is there for the first paint', () => {
    // A late swap reflowed paragraphs by a line: CLS 0.11 on a rule page on a throttled phone.
    expect(sans.display).toBe('optional');
    // Preloaded, so it is there in time on a repeat visit or a fast connection.
    expect(sans.preload).not.toBe(false);
  });

  it('set code in a monospace fallback exactly as wide as Geist Mono until it loads', () => {
    const geistMono = monospaceAdvance(
      path.join(import.meta.dirname, '../app', mono.src.replace('Variable.woff2', 'Variable.ttf')),
    );
    expect(geistMono).toBe(0.6);
    // Arial, size-adjusted, is proportional: an uppercase eyebrow took two lines, then one.
    expect(mono.adjustFontFallback).toBe(false);
    const fallback = mono.fallback ?? [];
    expect(fallback.at(-1)).toBe('monospace');
    for (const family of fallback.slice(0, -1)) {
      expect(ADVANCE[family], family).toBeDefined();
      expect(Math.abs((ADVANCE[family] ?? 0) - geistMono), family).toBeLessThan(0.005);
    }
    // Not preloaded: the largest paint is the headline, set in the sans.
    expect(mono.preload).toBe(false);
  });
});
