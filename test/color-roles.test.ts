import { beforeAll, describe, expect, it } from 'vitest';

import type { DesignSystem } from '../src/design-system.js';
import { applyFixes } from '../src/lint/index.js';
import type { Diagnostic } from '../src/types.js';
import { fixture, load } from './helpers.js';

const rule = 'no-hardcoded-color';

/**
 * Dub's color tokens (`packages/tailwind-config`), in a Tailwind v3 app: RGB
 * channels named for what they paint, `bg-*`, `border-*` and `content-*`,
 * the last being its text colors.
 */
const THEMES = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-default: 255 255 255;
  --bg-muted: 250 250 250;
  --bg-subtle: 245 245 245;
  --bg-emphasis: 229 229 229;
  --bg-inverted: 23 23 23;
  --bg-info: 219 234 254;
  --bg-error: 254 226 226;

  --border-emphasis: 163 163 163;
  --border-default: 212 212 212;
  --border-subtle: 229 229 229;

  --content-inverted: 255 255 255;
  --content-muted: 163 163 163;
  --content-subtle: 115 115 115;
  --content-default: 64 64 64;
  --content-emphasis: 23 23 23;
  --content-info: 37 99 235;
  --content-error: 220 38 38;
}

.dark {
  --bg-default: 0 0 0;
  --content-muted: 82 82 82;
  --content-subtle: 163 163 163;
  --content-default: 212 212 212;
}
`;

const NAMES = [
  'bg-default',
  'bg-muted',
  'bg-subtle',
  'bg-emphasis',
  'bg-inverted',
  'bg-info',
  'bg-error',
  'border-emphasis',
  'border-default',
  'border-subtle',
  'content-inverted',
  'content-muted',
  'content-subtle',
  'content-default',
  'content-emphasis',
  'content-info',
  'content-error',
];

const CONFIG = `module.exports = {
  theme: {
    extend: {
      colors: {
${NAMES.map((name) => `        "${name}": "rgb(var(--${name}) / <alpha-value>)",`).join('\n')}
      },
    },
  },
};
`;

describe("no-hardcoded-color on Dub's content-*, bg-* and border-* tokens", () => {
  let dub: DesignSystem;
  beforeAll(async () => {
    dub = await load(fixture({ 'tailwind.config.js': CONFIG, 'app/globals.css': THEMES }));
  });
  const colors = (code: string): Diagnostic[] =>
    dub.check(code, 'app/page.tsx').diagnostics.filter((d) => d.ruleId === rule);
  const one = (cls: string): Diagnostic | undefined => colors(`<p className="${cls}" />`)[0];

  it('reads the tokens', () => {
    expect(dub.getTokens({ category: 'color' }).map((t) => t.tailwind)).toEqual(NAMES);
  });

  it('takes content-* as text colors, muted ones included', () => {
    // content-muted is neutral-400 exactly; reading "muted" as a surface rejected it for text.
    for (const cls of ['text-neutral-400', 'placeholder-neutral-400']) {
      const d = one(cls);
      expect(d?.message).toContain('Matches token content-muted');
      expect(d?.fix?.[0]?.text).toBe(cls.replace('neutral-400', 'content-muted'));
    }
    expect(one('dark:text-neutral-400')?.fix?.[0]?.text).toBe('dark:text-content-subtle');
    expect(one('text-neutral-500')?.fix?.[0]?.text).toBe('text-content-subtle');
  });

  it('never fixes a border, a ring or a background to a text color', () => {
    // Dub writes ring-content-* nowhere: border-* and ring-* take its border-* tokens.
    for (const cls of ['border-neutral-500', 'ring-neutral-500', 'border-red-500', 'bg-red-600']) {
      const d = one(cls);
      expect([cls, d?.fix, d?.suggestion]).toEqual([cls, undefined, undefined]);
      expect(d?.message).not.toContain('→');
    }
    expect(one('border-neutral-400')?.fix?.[0]?.text).toBe('border-border-emphasis');
    expect(one('bg-neutral-100')?.fix?.[0]?.text).toBe('bg-bg-subtle');
  });

  it('names the close token that another role rules out, rather than calling none close', () => {
    expect(one('border-neutral-500')?.message).toMatch(
      /No close token is meant for borders; nearest is border-emphasis \(ΔE 0\.1\d\d, same value as content-muted\)\. content-subtle has this color \(exact match\), but it is meant for text\. Pick the semantic token that fits\.$/,
    );
    expect(one('bg-neutral-700')?.message).toContain(
      'content-default has this color (exact match), but it is meant for text.',
    );
    // neutral-300 is border-default, a border color: no text token is close.
    expect(one('text-neutral-300')?.message).toContain(
      'No close token is meant for text; nearest is content-inverted (ΔE 0.130, same value as bg-default). border-default has this color (exact match), but it is meant for borders.',
    );
  });

  it('fixes a palette class only to a token of its own shade', () => {
    const cases: [string, string, string][] = [
      // content-default is neutral-700 and content-emphasis neutral-900: each a shade darker.
      ['text-neutral-600', 'text-content-default', 'one shade darker (neutral-700)'],
      ['text-neutral-800', 'text-content-emphasis', 'one shade darker (neutral-900)'],
      // content-info is blue-600.
      ['text-blue-500', 'text-content-info', 'one shade darker (blue-600)'],
      ['bg-blue-50', 'bg-bg-info', 'one shade darker (blue-100)'],
      ['text-neutral-950', 'text-content-emphasis', 'one shade lighter (neutral-900)'],
    ];
    for (const [cls, suggestion, shade] of cases) {
      const d = one(cls);
      expect([cls, d?.fix, d?.suggestion]).toEqual([cls, undefined, suggestion]);
      const darker = shade.includes('darker') ? 'darker' : 'lighter';
      expect(d?.message).toContain(
        `→ \`${suggestion}\`. That is ${shade}, so it is not applied automatically: use it if the ${darker} color is intended, otherwise pick the semantic token that fits.`,
      );
    }
    // Tailwind v3's red-600, which content-error copies, is ΔE 0.030 from v4's: the same shade.
    for (const cls of ['text-red-600', 'text-blue-600']) {
      const d = one(cls);
      expect(d?.message).toMatch(/Nearest token content-(?:error|info) \(ΔE 0\.030\) → `[^`]+`\.$/);
      expect(d?.fix?.[0]?.text).toBe(d?.suggestion);
    }
    // Hex values keep the fix: they are no step on a scale.
    expect(one('text-[#525252]')?.fix?.[0]?.text).toBe('text-content-default');

    const code = `<p className="text-neutral-600 text-red-600 text-neutral-400 border-red-500" />`;
    expect(applyFixes(code, colors(code))).toBe(
      `<p className="text-neutral-600 text-content-error text-content-muted border-red-500" />`,
    );
  });
});

describe('no-hardcoded-color on a palette class whose token has its shade', () => {
  it('fixes a copy of the shade from either Tailwind version, never another color of it', async () => {
    const system = await load(
      fixture({
        // brand is Tailwind v3's fuchsia-600, the shade v3 and v4 differ most on; ink is neutral-500.
        'app/globals.css': `@import "tailwindcss";
@theme {
  --color-brand: #c026d3;
  --color-ink: #737373;
}`,
      }),
    );
    const one = (cls: string): Diagnostic | undefined =>
      system
        .check(`<p className="${cls}" />`, 'app/page.tsx')
        .diagnostics.find((d) => d.ruleId === rule);
    expect(one('text-fuchsia-600')?.message).toContain('Nearest token color-brand (ΔE 0.036)');
    expect(one('text-fuchsia-600')?.fix?.[0]?.text).toBe('text-brand');
    // gray-500 and neutral-500 are closer than v3's and v4's fuchsia-600.
    expect(one('text-gray-500')?.message).toContain('Nearest token color-ink (ΔE 0.027)');
    expect(one('text-gray-500')?.fix?.[0]?.text).toBe('text-ink');
    // slate-500 is bluer: ink is its shade, but not its color.
    const slate = one('text-slate-500');
    expect([slate?.fix, slate?.suggestion]).toEqual([undefined, 'text-ink']);
    expect(slate?.message).toContain(
      'Nearest token color-ink (ΔE 0.046) → `text-ink`. That is closest to neutral-500, not slate-500, so it is not applied automatically: use it if that color is intended, otherwise pick the semantic token that fits.',
    );
  });
});

describe('no-hardcoded-color on Material-style on-* tokens', () => {
  it('takes on-* as the text on a surface, never as a surface', async () => {
    const system = await load(
      fixture({
        'app/globals.css': `@import "tailwindcss";
@theme inline {
  --color-surface: var(--surface);
  --color-on-surface: var(--on-surface);
}
:root {
  --surface: oklch(0.985 0 0);
  --on-surface: oklch(0.205 0 0);
}`,
      }),
    );
    const [text, bg] = system
      .check(`<p className="text-neutral-900 bg-neutral-900" />`, 'app/page.tsx')
      .diagnostics.filter((d) => d.ruleId === rule);
    expect(text?.fix?.[0]?.text).toBe('text-on-surface');
    expect(bg?.fix).toBeUndefined();
    expect(bg?.message).toContain(
      'on-surface has this color (exact match), but it is meant for text.',
    );
  });
});

describe('no-hardcoded-color on content-* tokens named for a surface or a line', () => {
  it('keeps content-background a background and content-border a border', async () => {
    const system = await load(
      fixture({
        'app/globals.css': `@import "tailwindcss";
@theme {
  --color-content-background: #f5f5f5;
  --color-content-bg: #fafafa;
  --color-content-border: #e5e5e5;
  --color-content-muted: #a3a3a3;
}`,
      }),
    );
    const one = (cls: string): Diagnostic | undefined =>
      system
        .check(`<p className="${cls}" />`, 'app/page.tsx')
        .diagnostics.find((d) => d.ruleId === rule);
    // Exact matches of the role the name says: neutral-100, -50, -200 and -400.
    expect(one('bg-neutral-100')?.fix?.[0]?.text).toBe('bg-content-background');
    expect(one('bg-neutral-50')?.fix?.[0]?.text).toBe('bg-content-bg');
    expect(one('border-neutral-200')?.fix?.[0]?.text).toBe('border-content-border');
    expect(one('text-neutral-400')?.fix?.[0]?.text).toBe('text-content-muted');
    // A surface or a border is never swapped into text, though the color is the same.
    const cases: [string, string, string][] = [
      ['text-neutral-100', 'content-background', 'backgrounds'],
      ['text-neutral-200', 'content-border', 'borders'],
    ];
    for (const [cls, token, role] of cases) {
      const d = one(cls);
      expect([cls, d?.fix, d?.suggestion]).toEqual([cls, undefined, undefined]);
      expect(d?.message).toContain(
        `${token} has this color (exact match), but it is meant for ${role}.`,
      );
    }
  });
});
