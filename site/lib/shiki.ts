import { createHighlighterCoreSync, type ThemeRegistration } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import bash from 'shiki/langs/bash.mjs';
import css from 'shiki/langs/css.mjs';
import diff from 'shiki/langs/diff.mjs';
import json from 'shiki/langs/json.mjs';
import toml from 'shiki/langs/toml.mjs';
import tsx from 'shiki/langs/tsx.mjs';
import typescript from 'shiki/langs/typescript.mjs';
import yaml from 'shiki/langs/yaml.mjs';

import { CODE_COLORS, type CodeRole } from '@/lib/code-theme';
import type { Placed } from '@/lib/segments';

/*
 * Syntax highlighting with Shiki, on the server only: pages are rendered at build time with the
 * colours in their markup, and no highlighter reaches the browser. Synchronous (the JavaScript
 * regex engine and grammars imported up front), so a server component highlights without
 * awaiting anything. Never import this from a 'use client' file (test/code.test.ts checks).
 */

/** A Shiki theme from the shared code colours: `side` 0 is light, 1 is dark. */
function theme(side: 0 | 1): ThemeRegistration {
  const c = (role: CodeRole) => CODE_COLORS[role][side];
  return {
    name: side === 0 ? 'site-light' : 'site-dark',
    type: side === 0 ? 'light' : 'dark',
    colors: { 'editor.foreground': c('fg') },
    settings: [
      { settings: { foreground: c('fg') } },
      {
        scope: ['comment', 'punctuation.definition.comment'],
        settings: { foreground: c('comment'), fontStyle: 'italic' },
      },
      {
        scope: [
          'keyword',
          'storage',
          'storage.type',
          'keyword.operator.new',
          'keyword.control',
          'variable.language',
        ],
        settings: { foreground: c('keyword') },
      },
      {
        scope: ['string', 'string.quoted', 'string.template', 'markup.inline.raw'],
        settings: { foreground: c('string') },
      },
      {
        scope: ['constant.numeric', 'constant.language', 'constant.character', 'support.constant'],
        settings: { foreground: c('number') },
      },
      {
        scope: ['punctuation', 'meta.brace', 'keyword.operator', 'meta.tag.punctuation'],
        settings: { foreground: c('punctuation') },
      },
      {
        scope: ['entity.name.tag', 'support.class.component', 'entity.name.type', 'support.type'],
        settings: { foreground: c('tag') },
      },
      { scope: ['entity.other.attribute-name'], settings: { foreground: c('attribute') } },
      {
        scope: ['entity.name.function', 'support.function', 'meta.function-call'],
        settings: { foreground: c('fn') },
      },
      {
        scope: ['variable.other.property', 'meta.object-literal.key', 'support.type.property-name'],
        settings: { foreground: c('property') },
      },
      { scope: ['markup.inserted'], settings: { foreground: c('keyword') } },
      { scope: ['markup.deleted'], settings: { foreground: c('number') } },
    ],
  };
}

/** The languages Shiki highlights here; anything else goes to the output grammar. */
export type ShikiLang = 'tsx' | 'typescript' | 'json' | 'bash' | 'yaml' | 'toml' | 'css' | 'diff';

const highlighter = createHighlighterCoreSync({
  themes: [theme(0), theme(1)],
  langs: [tsx, typescript, json, bash, yaml, toml, css, diff],
  engine: createJavaScriptRegexEngine(),
});

const pair = (color: string | undefined, side: 0 | 1, role: CodeRole = 'fg') =>
  (color ?? CODE_COLORS[role][side]).toLowerCase();

/** Shiki's tokens as lines of placed segments, with both themes' colours. */
export function shikiLines(code: string, lang: ShikiLang): Placed[][] {
  const lines = highlighter.codeToTokensWithThemes(code, {
    lang,
    themes: { light: 'site-light', dark: 'site-dark' },
  });
  return lines.map((line) =>
    line.map((token) => {
      const light = token.variants.light;
      const dark = token.variants.dark;
      const italic = ((light?.fontStyle ?? 0) & 1) === 1;
      return {
        text: token.content,
        offset: token.offset,
        color: [pair(light?.color, 0), pair(dark?.color, 1)] as const,
        ...(italic ? { italic } : {}),
      };
    }),
  );
}
