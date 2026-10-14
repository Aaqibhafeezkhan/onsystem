import fs from 'node:fs';
import path from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import type { DesignSystem } from '../src/design-system.js';
import { applyFixes } from '../src/lint/index.js';
import { CLOSE_COLOR, colorDistance, parseColor, SAME_COLOR } from '../src/tokens/color.js';
import type { Diagnostic } from '../src/types.js';
import { DEMO_ROOT, fixture, load, loadOnce } from './helpers.js';

const rule = 'no-hardcoded-color';

function color(value: string) {
  const parsed = parseColor(value);
  if (!parsed) throw new Error(`not a color: ${value}`);
  return parsed;
}

describe('color distance counts opacity', () => {
  it('keeps a translucent color away from its opaque twin', () => {
    // ΔE leaves opacity out: the red at 20% is 0 from the opaque red, and white 0 from 10% white.
    expect(colorDistance(color('#e7000b33'), color('#e7000b'))).toBeGreaterThan(CLOSE_COLOR);
    expect(colorDistance(color('#ffffff'), color('oklch(1 0 0 / 10%)'))).toBeGreaterThan(
      CLOSE_COLOR,
    );
    expect(colorDistance(color('rgba(255, 255, 255, 0)'), color('#fff'))).toBeGreaterThan(
      CLOSE_COLOR,
    );
    // 10% and 15% white, shadcn/ui's dark border and input, are two colors.
    expect(colorDistance(color('oklch(1 0 0 / 10%)'), color('oklch(1 0 0 / 15%)'))).toBeGreaterThan(
      CLOSE_COLOR,
    );
  });

  it('never calls colors more than 0.02 apart in opacity close', () => {
    expect(colorDistance(color('rgb(0 0 0 / 0.9)'), color('#000'))).toBeGreaterThanOrEqual(
      CLOSE_COLOR,
    );
    expect(colorDistance(color('rgb(0 0 0 / 0.979)'), color('#000'))).toBeGreaterThan(CLOSE_COLOR);
    expect(colorDistance(color('rgb(0 0 0 / 0.99)'), color('#000'))).toBeLessThan(CLOSE_COLOR);
  });

  it('still matches the same opacity, and one step of an 8-digit hex', () => {
    expect(colorDistance(color('#ffffff1a'), color('oklch(1 0 0 / 10%)'))).toBeLessThan(SAME_COLOR);
    expect(colorDistance(color('#e7000bfe'), color('#e7000bff'))).toBeLessThan(SAME_COLOR);
    expect(colorDistance(color('#e7000bff'), color('#e7000b'))).toBeLessThan(1e-9);
  });
});

describe('no-hardcoded-color with translucent colors', () => {
  let demo: DesignSystem;
  let shadcn: DesignSystem;
  beforeAll(async () => {
    // The demo's dark theme, like shadcn/ui v4's, has `--border: oklch(1 0 0 / 10%)` and
    // `--input: oklch(1 0 0 / 15%)`.
    demo = await loadOnce(DEMO_ROOT);
    const globals = fs.readFileSync(
      path.join(import.meta.dirname, 'fixtures/shadcn-neutral/globals.css'),
      'utf8',
    );
    shadcn = await load(fixture({ 'app/globals.css': globals }));
  });
  const check = (code: string, system = demo): Diagnostic[] =>
    system.check(code, 'app/page.tsx').diagnostics.filter((d) => d.ruleId === rule);

  it('never fixes a translucent color to an opaque token', () => {
    const code = `<div className="bg-[#e7000b33] dark:border-[#ffffff]" />`;
    const [tint, border] = check(code);
    expect(tint).toMatchObject({ source: 'bg-[#e7000b33]', severity: 'error' });
    expect(tint?.message).toBe(
      'Hardcoded color `bg-[#e7000b33]`. No close token; nearest is destructive (ΔE 0.010). destructive is opaque, and this color is 20% opaque. Pick the semantic token that fits.',
    );
    expect(tint?.suggestion).toBeUndefined();
    expect(tint?.fix).toBeUndefined();
    // Not the dark `border`, which is 10% white: the nearest opaque token, as for any near-white.
    expect(border?.message).not.toMatch(/\bborder in dark mode\b|same value as input/);
    expect(
      applyFixes(
        code,
        [tint, border].filter((d) => d !== undefined),
      ),
    ).toBe(`<div className="bg-[#e7000b33] dark:border-primary" />`);

    const cases: [string, string][] = [
      ['text-[rgba(231,0,11,0.2)]', 'destructive is opaque, and this color is 20% opaque.'],
      ['to-[#fff6]', 'background is opaque, and this color is 40% opaque.'],
      ['bg-[#ffffff66]', 'background is opaque, and this color is 40% opaque.'],
      ['bg-[rgba(255,255,255,0)]', 'background is opaque, and this color is transparent.'],
      ['bg-[#e7000bf2]', 'destructive is opaque, and this color is 95% opaque.'],
      ['hover:bg-[rgb(0_0_0/0.5)]', 'primary is opaque, and this color is 50% opaque.'],
    ];
    for (const system of [demo, shadcn]) {
      for (const [cls, gap] of cases) {
        const source = `<div className="${cls}" />`;
        const [d] = check(source, system);
        expect([cls, d?.fix, d?.suggestion]).toEqual([cls, undefined, undefined]);
        expect(d?.message).toContain(`No close token; nearest is `);
        expect(d?.message).toContain(` ${gap} Pick the semantic token that fits.`);
        expect(applyFixes(source, d ? [d] : [])).toBe(source);
      }
    }
    expect(check(`<p className="bg-[#ffffff66]" />`)[0]?.message).toContain(
      'nearest is background (same color, same value as card, popover).',
    );
  });

  it('never fixes a translucent style or attribute to an opaque token', () => {
    const code = `<div style={{ backgroundColor: "rgba(255, 255, 255, 0)", color: "rgba(231, 0, 11, 0.2)" }}><svg fill="#e7000b80" /></div>`;
    const diagnostics = check(code);
    expect(diagnostics.map((d) => [d.source, d.fix])).toEqual([
      ['rgba(255, 255, 255, 0)', undefined],
      ['rgba(231, 0, 11, 0.2)', undefined],
      ['#e7000b80', undefined],
    ]);
    expect(applyFixes(code, diagnostics)).toBe(code);
    expect(diagnostics[2]?.message).toContain(
      'destructive is opaque, and this color is 50% opaque.',
    );
  });

  it('still fixes a color to a token of the same opacity', () => {
    const cases: [string, string, string][] = [
      // shadcn/ui's dark border and input are 10% and 15% white.
      [
        'dark:border-[rgba(255,255,255,0.1)]',
        'dark:border-border',
        'Matches token border in dark mode (exact match) →',
      ],
      [
        'dark:border-[#ffffff1a]',
        'dark:border-border',
        'Matches token border in dark mode (exact match) →',
      ],
      [
        'dark:border-[rgba(255,255,255,0.15)]',
        'dark:border-input',
        'Matches token input in dark mode (exact match) →',
      ],
      // An explicit opaque alpha, and one step of an 8-digit hex below it.
      ['bg-[#e7000bff]', 'bg-destructive', 'Matches token destructive (ΔE 0.010) →'],
      ['bg-[#e7000bfe]', 'bg-destructive', 'Nearest token destructive (ΔE 0.010) →'],
      // An opacity modifier stays on the token, so the opaque white is what is compared.
      ['bg-[#ffffff]/40', 'bg-background/40', 'Matches token background (exact match'],
    ];
    for (const system of [demo, shadcn]) {
      for (const [cls, fixed, message] of cases) {
        const [d] = check(`<div className="${cls}" />`, system);
        expect([cls, d?.fix?.[0]?.text]).toEqual([cls, fixed]);
        expect(d?.message).toContain(message);
        expect(d?.message).not.toContain('opaque');
      }
    }
  });

  it('picks the token of the same opacity when two share a color', async () => {
    // Midday's theme has `--chart-bar-fill-secondary: #6666664d` and `--chart-line-secondary: #666666`.
    const system = await load(
      fixture({
        'app/globals.css': `@import "tailwindcss";
@theme inline { --color-scrim: var(--scrim); --color-ink: var(--ink); }
:root { --scrim: #6666664d; --ink: #666666; }`,
      }),
    );
    const code = `<p className="text-[#666666] bg-[#6666664d]" style={{ color: "#666" }} />`;
    const diagnostics = check(code, system);
    expect(diagnostics.map((d) => d.message)).toEqual([
      'Hardcoded color `text-[#666666]`. Matches token ink (exact match) → `text-ink`.',
      'Hardcoded color `bg-[#6666664d]`. Matches token scrim (exact match) → `bg-scrim`.',
      'Hardcoded color `#666` in style.color. Matches token ink (exact match) → `text-ink` or `var(--ink)`.',
    ]);
    expect(applyFixes(code, diagnostics)).toBe(
      `<p className="text-ink bg-scrim" style={{ color: "var(--ink)" }} />`,
    );
  });

  it('names only tokens of the same opacity as having the same value', () => {
    // The dark border (10% white) and input (15% white) were "the same value".
    const cases: [string, string][] = [
      ['dark:border-[#ffffff1a]', 'border'],
      ['dark:border-[#ffffff26]', 'input'],
    ];
    for (const [cls, token] of cases) {
      const [d] = check(`<div className="${cls}" />`);
      expect([cls, d?.message]).toEqual([
        cls,
        `Hardcoded color \`${cls}\`. Matches token ${token} in dark mode (exact match) → \`dark:border-${token}\`.`,
      ]);
    }
  });
});
