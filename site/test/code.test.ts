import fs from 'node:fs';
import path from 'node:path';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Code } from '@/components/code';
import { CODE_BACKGROUND, CODE_COLORS } from '@/lib/code-theme';
import { formatJson } from '@/lib/format-json';
import { highlightLines } from '@/lib/highlight';
import { outputLines } from '@/lib/output';
import { highlight, langOf } from '@/lib/render-code';
import { markLines, type Segment } from '@/lib/segments';

const site = path.join(import.meta.dirname, '..');
const css = fs.readFileSync(path.join(site, 'app/globals.css'), 'utf8');

// ─── Contrast ───────────────────────────────────────────────────────────────

/** `--site-name: light-dark(#light, #dark)` pairs from app/globals.css. */
const tokens: Record<string, [string, string]> = Object.fromEntries(
  [...css.matchAll(/--site-([\w-]+): light-dark\((#[0-9a-f]{6}), (#[0-9a-f]{6})\)/g)].map(
    ([, name = '', light = '', dark = '']) => [name, [light, dark]],
  ),
);

function luminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

/** `percent` of `hex` over `base`, as `color-mix(in oklab, …)` is close enough to for this. */
function over(hex: string, percent: number, base: string): string {
  return `#${[1, 3, 5]
    .map((i) => {
      const [a, b] = [hex, base].map((c) => parseInt(c.slice(i, i + 2), 16));
      return Math.round(((a ?? 0) * percent + (b ?? 0) * (100 - percent)) / 100)
        .toString(16)
        .padStart(2, '0');
    })
    .join('')}`;
}

/** The colour of each `.out-<kind>` rule in app/globals.css, light and dark. */
function outputColours(): Record<string, [string, string]> {
  const colours: Record<string, [string, string]> = {};
  for (const [, selectors = '', body = ''] of css.matchAll(
    /((?:\.out-[\w-]+,?\s*)+)\{([^}]*)\}/g,
  )) {
    const value = /(?:^|\n)\s*color: ([^;]+);/.exec(body)?.[1] ?? '';
    const pair = /light-dark\((#\w{6}), (#\w{6})\)/.exec(value);
    const token = /var\(--color-([\w-]+)\)/.exec(value)?.[1];
    const resolved: [string, string] | undefined = pair
      ? [pair[1] ?? '', pair[2] ?? '']
      : token
        ? tokens[token]
        : undefined;
    for (const [, kind = ''] of selectors.matchAll(/\.out-([\w-]+)/g)) {
      if (resolved) colours[kind] = resolved;
    }
  }
  return colours;
}

const SIDES = [
  ['light', 0],
  ['dark', 1],
] as const;

// The surfaces code and output sit on: code blocks, the demo's raised panels, the page.
const SURFACES = ['code', 'raised', 'raised-2', 'ink'];

describe('code colours', () => {
  it('are the theme pair the three sites share (signoff-ui’s code block)', () => {
    // signoff-ui: examples/playground/lib/highlight.ts, `dark` and `light`.
    expect(CODE_COLORS).toEqual({
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
    });
    expect(CODE_BACKGROUND).toEqual(tokens.code);
  });

  it.each(SIDES)('keep 4.5:1 or more on every surface code sits on, %s', (_, side) => {
    for (const [role, pair] of Object.entries(CODE_COLORS)) {
      for (const surface of SURFACES) {
        const ratio = contrast(pair[side], tokens[surface]?.[side] ?? '');
        expect(ratio, `${role} on ${surface}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it.each(SIDES)('keep output colours at 4.5:1 or more on every surface, %s', (_, side) => {
    const colours = outputColours();
    expect(Object.keys(colours).sort()).toEqual(
      [
        'accent',
        'command',
        'dim',
        'error',
        'heading',
        'info',
        'prompt',
        'string',
        'strong',
        'success',
        'tag',
        'warn',
      ].sort(),
    );
    for (const [kind, pair] of Object.entries(colours)) {
      for (const surface of SURFACES) {
        const ratio = contrast(pair[side], tokens[surface]?.[side] ?? '');
        expect(ratio, `.out-${kind} on ${surface}`).toBeGreaterThanOrEqual(4.5);
      }
    }
    // Output strings and tags are the code theme's.
    expect(colours.string).toEqual(CODE_COLORS.string);
    expect(colours.tag).toEqual(CODE_COLORS.tag);
  });

  it.each(SIDES)(
    'keep 4.5:1 or more inside every finding highlight and diff line, %s',
    (_, side) => {
      const fills = [
        ...css.matchAll(
          /\.((?:mark|line)-\w+) \{[^}]*?background: color-mix\(in oklab, var\(--color-([\w-]+)\) (\d+)%, transparent\);/g,
        ),
      ];
      expect(fills.map(([, name]) => name).sort()).toEqual([
        'line-add',
        'line-del',
        'mark-active',
        'mark-changed',
        'mark-error',
        'mark-warning',
      ]);
      // Marks and diff lines are only ever cut into source code.
      const colours = Object.entries(CODE_COLORS);
      for (const [, name, colour = '', percent = ''] of fills) {
        for (const surface of ['code', 'raised']) {
          const background = over(
            tokens[colour]?.[side] ?? '',
            Number(percent),
            tokens[surface]?.[side] ?? '',
          );
          for (const [role, pair] of colours) {
            const ratio = contrast(pair[side], background);
            expect(ratio, `${role} in .${name ?? ''} on ${surface}`).toBeGreaterThanOrEqual(4.5);
          }
        }
      }
    },
  );

  it('pick the theme by colour scheme, so there is nothing to swap after hydration', () => {
    expect(css).toMatch(
      /\.sk \{\n {2}color: light-dark\(var\(--shiki-light\), var\(--shiki-dark\)\);/,
    );
  });
});

// ─── Shiki ──────────────────────────────────────────────────────────────────

const text = (lines: Segment[][]) => lines.map((line) => line.map((s) => s.text).join(''));
const colourOf = (lines: Segment[][], piece: string) =>
  lines.flat().find((s) => s.text === piece)?.color;

describe('Shiki', () => {
  it('reads each fence’s language', () => {
    expect(
      ['tsx', 'jsx', 'ts', 'js', 'json', 'sh', 'bash', 'yml', 'toml', 'diff', 'text', ''].map(
        langOf,
      ),
    ).toEqual([
      'tsx',
      'tsx',
      'ts',
      'js',
      'json',
      'sh',
      'sh',
      'yaml',
      'toml',
      'diff',
      'text',
      'text',
    ]);
  });

  it('colours TSX with the shared theme, in both themes', () => {
    const { lines } = highlight('<Button variant="destructive">Delete</Button>', 'tsx');
    expect(text(lines)).toEqual(['<Button variant="destructive">Delete</Button>']);
    expect(colourOf(lines, 'Button')).toEqual(CODE_COLORS.tag);
    expect(colourOf(lines, 'variant')).toEqual(CODE_COLORS.attribute);
    expect(colourOf(lines, 'destructive')).toEqual(CODE_COLORS.string);
  });

  it('colours JSON, YAML and shell', () => {
    expect(colourOf(highlight('{ "rules": true }', 'json').lines, 'true')).toEqual(
      CODE_COLORS.number,
    );
    expect(colourOf(highlight('- run: npx onsystem', 'yaml').lines, 'run')).toEqual(
      CODE_COLORS.keyword,
    );
    const comment = highlight('npx onsystem check . # note', 'sh').lines.flat().at(-1);
    expect(comment).toMatchObject({ text: '# note', color: CODE_COLORS.comment, italic: true });
  });

  it('cuts findings into the tokens they cover', () => {
    const code = '<div className="p-[13px] flex" />';
    const start = code.indexOf('p-[13px]');
    const { lines } = highlight(code, 'tsx', {
      marks: [{ start, end: start + 8, kind: 'warning', id: 0 }],
    });
    const marked = lines.flat().filter((s) => s.mark);
    expect(marked.map((s) => s.text).join('')).toBe('p-[13px]');
    expect(marked[0]?.mark).toEqual({ kind: 'warning', id: 0, first: true });
    expect(text(lines)).toEqual([code]);
  });

  it('highlights a shell session’s commands as shell and the rest as output', () => {
    const { lines } = highlight('$ npx onsystem check src\nNo new problems in 3 files.', 'sh');
    expect(lines[0]?.[0]).toMatchObject({ text: '$ ', kind: 'prompt' });
    expect(lines[0]?.[1]?.color).toBeDefined();
    expect(lines[1]?.find((s) => s.kind === 'success')?.text).toBe('No new problems');
  });

  it('is never imported by a client component', () => {
    const files = ['app', 'components', 'lib'].flatMap((dir) =>
      fs
        .readdirSync(path.join(site, dir), { recursive: true })
        .map((file) => path.join(site, dir, String(file)))
        .filter((file) => /\.tsx?$/.test(file)),
    );
    const server = new Set(['lib/shiki', 'lib/render-code', 'components/code']);
    for (const file of files) {
      const source = fs.readFileSync(file, 'utf8');
      if (!/^'use client';/.test(source)) continue;
      for (const [, from = ''] of source.matchAll(/from '@\/([^']+)'/g)) {
        expect(server.has(from), `${path.relative(site, file)} imports ${from}`).toBe(false);
      }
      expect(source, path.relative(site, file)).not.toMatch(/from 'shiki/);
    }
  });
});

// ─── Output grammar ─────────────────────────────────────────────────────────

/** Each line as `[text, kind]` pairs, plain text left out. */
const kinds = (value: string, ruleIds?: string[]) =>
  outputLines(value, { ruleIds }).lines.map((line) =>
    line.filter((s) => s.kind).map((s) => [s.text, s.kind]),
  );

describe('the output grammar', () => {
  it('dims prompts and brightens the command', () => {
    expect(kinds('$ npx onsystem check .')[0]?.slice(0, 2)).toEqual([
      ['$ ', 'prompt'],
      ['npx', 'command'],
    ]);
    expect(kinds('> get_component { "name": "Badge" }')[0]).toEqual([
      ['> ', 'prompt'],
      ['get_component', 'command'],
      ['"name"', 'string'],
      ['"Badge"', 'string'],
    ]);
  });

  it('colours a finding: position, severity, rule id, quoted values and tags', () => {
    expect(
      kinds('1:17 error [no-unknown-variant] "primary" is not a variant for <Button>.'),
    ).toEqual([
      [
        ['1:17', 'dim'],
        ['error', 'error'],
        ['[', 'dim'],
        ['no-unknown-variant', 'accent'],
        [']', 'dim'],
        ['"primary"', 'string'],
        ['<Button', 'tag'],
        ['>', 'tag'],
      ],
    ]);
    expect(kinds('1:50 warning [no-hardcoded-spacing] `px-[18px]`')[0]?.slice(0, 2)).toEqual([
      ['1:50', 'dim'],
      ['warning', 'warn'],
    ]);
  });

  it('colours counts, success, paths and positions', () => {
    expect(kinds('snippet.tsx: 2 errors, 1 warning')[0]).toEqual([
      ['snippet.tsx', 'dim'],
      ['2 errors', 'error'],
      ['1 warning', 'warn'],
    ]);
    expect(kinds('✓ No design-system problems')[0]).toEqual([
      ['✓', 'success'],
      ['No design-system problems', 'success'],
    ]);
    expect(kinds('Renders <span> · components/ui/badge.tsx:29')[0]).toEqual([
      ['<span', 'tag'],
      ['>', 'tag'],
      ['·', 'dim'],
      ['components/ui/badge.tsx:29', 'dim'],
    ]);
  });

  it('gives Markdown its structure: headings, list markers, inline code, tables', () => {
    expect(kinds('## Props')[0]).toEqual([
      ['## ', 'dim'],
      ['Props', 'heading'],
    ]);
    expect(kinds('- asChild?: boolean, see `asChild`')[0]).toEqual([
      ['- ', 'dim'],
      ['`', 'dim'],
      ['asChild', 'string'],
      ['`', 'dim'],
    ]);
    expect(kinds('| Rule | Count |\n| --- | --- |')).toEqual([
      [
        ['|', 'dim'],
        ['|', 'dim'],
        ['|', 'dim'],
      ],
      [['| --- | --- |', 'dim']],
    ]);
  });

  it('reads a Claude Code transcript', () => {
    const lines = kinds(
      '⏺ Write(app/page.tsx)\n  ⎿  PostToolUse hook: app/page.tsx breaks it\n⏺ onsystem - get_component (MCP)(name: "Button")',
    );
    expect(lines[0]?.slice(0, 3)).toEqual([
      ['⏺ ', 'dim'],
      ['Write', 'strong'],
      ['app/page.tsx', 'dim'],
    ]);
    expect(lines[1]?.slice(0, 2)).toEqual([
      ['⎿  ', 'dim'],
      ['PostToolUse hook:', 'dim'],
    ]);
    expect(lines[2]?.slice(0, 3)).toEqual([
      ['⏺ ', 'dim'],
      ['onsystem - ', 'dim'],
      ['get_component', 'accent'],
    ]);
  });

  it('colours the rule ids it is given anywhere, and indents wrapped lines under their text', () => {
    expect(kinds('see no-unknown-prop', ['no-unknown-prop'])[0]).toEqual([
      ['no-unknown-prop', 'accent'],
    ]);
    const { hangs } = outputLines('1:17 error x\n- item\n   indented');
    expect(hangs).toEqual([5, 2, 3]);
  });

  it('keeps every character, in order', () => {
    const sample =
      '⏺ Write(a.tsx)   →   <Button variant="x"> on bg-muted, hook passes\n\n## Variants';
    const { lines } = outputLines(sample);
    expect(lines.map((line) => line.map((s) => s.text).join('')).join('\n')).toBe(sample);
  });
});

// ─── The playground's live highlighter, marks and JSON ──────────────────────

describe('the live highlighter', () => {
  it('colours TSX with the same colours as Shiki', () => {
    const lines = highlightLines('<Badge tone="warning" />');
    expect(colourOf(lines, 'Badge')).toEqual(CODE_COLORS.tag);
    expect(colourOf(lines, 'tone')).toEqual(CODE_COLORS.attribute);
    expect(colourOf(lines, '"warning"')).toEqual(CODE_COLORS.string);
  });

  it('marks across token and line boundaries', () => {
    const lines = markLines(
      [
        [
          { text: 'ab', offset: 0 },
          { text: 'cd', offset: 2 },
        ],
        [{ text: 'ef', offset: 5 }],
      ],
      [{ start: 1, end: 6, kind: 'error' }],
    );
    expect(lines.map((line) => line.map((s) => [s.text, s.mark?.kind ?? '']))).toEqual([
      [
        ['a', ''],
        ['b', 'error'],
        ['cd', 'error'],
      ],
      [
        ['e', 'error'],
        ['f', ''],
      ],
    ]);
  });
});

describe('formatJson', () => {
  it('keeps short arrays and objects on one line', () => {
    expect(formatJson({ fix: [{ range: [17, 24], text: 'default' }], ok: false })).toBe(
      '{ "fix": [{ "range": [17, 24], "text": "default" }], "ok": false }',
    );
    const long = formatJson({ message: 'x'.repeat(80), range: [1, 2] });
    expect(long).toBe(`{\n  "message": "${'x'.repeat(80)}",\n  "range": [1, 2]\n}`);
    expect(JSON.parse(long)).toEqual({ message: 'x'.repeat(80), range: [1, 2] });
  });
});

describe('a code block', () => {
  it('renders its colours on the server, as CSS variables for both themes', () => {
    const html = renderToStaticMarkup(createElement(Code, { code: 'const a = 1', lang: 'ts' }));
    expect(html).toContain('class="sk" style="--shiki-light:#155e75;--shiki-dark:#67e8f9"');
    expect(html).toContain('<span class="code-title code-title-language">TypeScript</span>');
  });

  it('tints a diff’s added and removed lines', () => {
    const html = renderToStaticMarkup(
      createElement(Code, { code: '+ new line\n- old line\n same', lang: 'diff' }),
    );
    expect(html.match(/line-add/g)).toHaveLength(1);
    expect(html.match(/line-del/g)).toHaveLength(1);
  });
});
