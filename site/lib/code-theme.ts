/**
 * The code colours of the three sibling sites (onsystem, ondocs, signoff-ui): one light and one
 * dark theme, made from signoff-ui's code tokens, so the same code looks the same on all three.
 * Shiki builds its themes from these at build time (lib/shiki.ts), and the playground's live
 * editor colours what it tokenizes with the same pairs (lib/highlight.ts), so this file holds
 * colours only and is safe to import from the browser.
 *
 * Each colour keeps at least 4.5:1 on the code background and inside the finding highlights, in
 * both themes (test/shell.test.ts).
 */

export type CodeRole =
  | 'fg'
  | 'keyword'
  | 'string'
  | 'number'
  | 'comment'
  | 'punctuation'
  | 'tag'
  | 'attribute'
  | 'fn'
  | 'property';

/** `[light, dark]` for each role. */
export type ColorPair = readonly [light: string, dark: string];

export const CODE_COLORS: Record<CodeRole, ColorPair> = {
  fg: ['#0d0f12', '#e8eaed'],
  keyword: ['#155e75', '#67e8f9'],
  string: ['#9a3412', '#f5c27a'],
  number: ['#9d174d', '#f9a8d4'],
  comment: ['#525b67', '#8b94a0'],
  punctuation: ['#4b5563', '#a1a9b4'],
  tag: ['#155e75', '#67e8f9'],
  attribute: ['#9d174d', '#f9a8d4'],
  fn: ['#0d0f12', '#f1f3f5'],
  property: ['#1f2937', '#c9d1d9'],
};

/** The code background, `--site-code` in app/globals.css. */
export const CODE_BACKGROUND: ColorPair = ['#f6f7f9', '#101317'];
