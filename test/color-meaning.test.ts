import fs from 'node:fs';
import path from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import type { DesignSystem } from '../src/design-system.js';
import { applyFixes } from '../src/lint/index.js';
import type { Diagnostic } from '../src/types.js';
import { fixture, load } from './helpers.js';

const rule = 'no-hardcoded-color';

/**
 * A monorepo's theme: a rose `brand` (rose-500) next to shadcn/ui's red `destructive`
 * (red-600), and a blue `primary` (blue-600).
 */
const BRAND_THEME = `@import "tailwindcss";
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-brand: var(--brand);
  --color-destructive: var(--destructive);
}
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.546 0.245 262.881);
  --primary-foreground: oklch(0.985 0 0);
  --brand: oklch(0.645 0.246 16.439);
  --destructive: oklch(0.577 0.245 27.325);
}`;

/** A theme whose `destructive` is Tailwind v4's red-500, as some apps define it. */
const RED_THEME = `@import "tailwindcss";
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-destructive: var(--destructive);
}
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --destructive: oklch(0.637 0.237 25.331);
}`;

describe('no-hardcoded-color keeps state classes apart', () => {
  let shadcn: DesignSystem;
  let brand: DesignSystem;
  let red: DesignSystem;
  beforeAll(async () => {
    const globals = fs.readFileSync(
      path.join(import.meta.dirname, 'fixtures/shadcn-neutral/globals.css'),
      'utf8',
    );
    shadcn = await load(fixture({ 'app/globals.css': globals }));
    brand = await load(fixture({ 'app/globals.css': BRAND_THEME }));
    red = await load(fixture({ 'app/globals.css': RED_THEME }));
  });
  const check = (code: string, system: DesignSystem): Diagnostic[] =>
    system.check(code, 'app/page.tsx').diagnostics.filter((d) => d.ruleId === rule);

  it('does not fix a hover: class to the token its base class gets', () => {
    // The sign-in button: blue-600 and blue-700 as hex are both closest to a blue-600 primary.
    const code = `<button className="bg-[#2563eb] hover:bg-[#1d4ed8]">Sign in</button>`;
    const [base, hover] = check(code, brand);
    expect(base?.fix?.[0]?.text).toBe('bg-primary');
    expect(hover?.source).toBe('hover:bg-[#1d4ed8]');
    expect(hover?.suggestion).toBe('bg-primary');
    expect(hover?.fix).toBeUndefined();
    expect(hover?.message).toContain(
      '`bg-[#2563eb]` becomes `bg-primary` too, so with this fix `hover:` would change nothing: it is not applied automatically. Keep the two apart, such as with `hover:bg-primary/90`.',
    );
    expect(
      applyFixes(
        code,
        [base, hover].filter((d) => d !== undefined),
      ),
    ).toBe(`<button className="bg-primary hover:bg-[#1d4ed8]">Sign in</button>`);
    // On a stock shadcn/ui theme, neutral-900 and neutral-800 as hex are both nearest `primary`.
    const [, neutral] = check(`<a className="bg-[#171717] hover:bg-[#262626]" />`, shadcn);
    expect(neutral?.fix).toBeUndefined();
    expect(neutral?.message).toContain('`bg-[#171717]` becomes `bg-primary` too');
  });

  it('does not fix a state class to the token the class list already has', () => {
    const [hover] = check(`<a className="bg-primary hover:bg-[#262626]" />`, shadcn);
    expect(hover?.fix).toBeUndefined();
    expect(hover?.message).toContain(
      'The class list already has `bg-primary`, so with this fix `hover:` would change nothing',
    );
    // Any condition: focus-visible, a breakpoint, a group, a selector that narrows the element,
    // with dark: on both or on one.
    for (const code of [
      `<a className="bg-primary focus-visible:bg-[#262626]" />`,
      `<a className="bg-primary [&:hover]:bg-[#262626]" />`,
      `<a className="bg-primary md:bg-[#262626]" />`,
      `<a className="bg-primary group-hover:bg-[#262626]!" />`,
      `<a className="dark:bg-card dark:hover:bg-[#171717]" />`,
      `<a className="bg-card dark:hover:bg-[#171717]" />`,
    ]) {
      const [d] = check(code, shadcn);
      expect([code, d?.fix]).toEqual([code, undefined]);
      expect(d?.message).toContain('would change nothing');
    }
    // Nor a base class to the token its hover already has.
    const [base] = check(`<a className="bg-[#171717] hover:bg-primary" />`, shadcn);
    expect(base?.fix).toBeUndefined();
    expect(base?.message).toContain(
      '`hover:bg-primary` is in the class list too, so with this fix `hover:` would change nothing: it is not applied automatically. Keep the two apart, such as with `hover:bg-primary/90`.',
    );
    // The classes of one element are one list, across cn() arguments.
    const [, split] = check(
      'const a = <a className={cn("bg-[#171717]", open && "hover:bg-[#262626]")} />',
      shadcn,
    );
    expect(split?.fix).toBeUndefined();
  });

  it('still fixes state classes that stay apart, and dark: classes', () => {
    const cases: [string, string][] = [
      // Another token for the hover.
      [
        `<a className="bg-[#171717] hover:bg-[#f5f5f5]" />`,
        `<a className="bg-primary hover:bg-muted" />`,
      ],
      // An opacity modifier keeps the hover apart.
      [
        `<a className="bg-[#171717] hover:bg-[#262626]/90" />`,
        `<a className="bg-primary hover:bg-primary/90" />`,
      ],
      // Two conditions, neither of which holds whenever the other does.
      [
        `<a className="hover:bg-[#171717] md:bg-[#262626]" />`,
        `<a className="hover:bg-primary md:bg-primary" />`,
      ],
      // A pseudo-element or other elements, whose color the element's own class does not set:
      // a placeholder is half the text color, and prose links have the prose's link color.
      [
        `<input className="text-muted-foreground placeholder:text-[#737373]" />`,
        `<input className="text-muted-foreground placeholder:text-muted-foreground" />`,
      ],
      [
        `<a className="text-muted-foreground [&_svg]:text-[#737373]" />`,
        `<a className="text-muted-foreground [&_svg]:text-muted-foreground" />`,
      ],
      [
        `<div className="text-muted-foreground dark:prose-a:text-[#a1a1a1]" />`,
        `<div className="text-muted-foreground dark:prose-a:text-muted-foreground" />`,
      ],
      // dark: classes are compared with the dark-mode values, so the same token is right there.
      [
        `<a className="bg-[#ffffff] dark:bg-[#0a0a0a]" />`,
        `<a className="bg-background dark:bg-background" />`,
      ],
    ];
    for (const [code, fixed] of cases) {
      expect(applyFixes(code, check(code, shadcn))).toBe(fixed);
    }
  });

  it('still fixes a state class that already has the same color as the other', () => {
    // The hover changed nothing in the source either, so the same token keeps what it means.
    const cases: [string, string, DesignSystem][] = [
      [
        `<a className="bg-[#fff] hover:bg-[#fff]" />`,
        `<a className="bg-background hover:bg-background" />`,
        shadcn,
      ],
      // A nav item whose active state and hover share a color on purpose.
      [
        'const a = <a className={cn("hover:bg-[#f5f5f5]", active && "bg-[#f5f5f5]")} />',
        'const a = <a className={cn("hover:bg-muted", active && "bg-muted")} />',
        shadcn,
      ],
      // A palette class and a hex of the same color.
      [
        `<a className="bg-neutral-100 hover:bg-[#f5f5f5]" />`,
        `<a className="bg-muted hover:bg-muted" />`,
        shadcn,
      ],
      // Hardcoded colors do not change with the mode, so dark: is no exception.
      [
        `<a className="dark:bg-[#131313] hover:dark:bg-[#131313]" />`,
        `<a className="dark:bg-card hover:dark:bg-card" />`,
        shadcn,
      ],
      // An error input that keeps its red border on focus.
      [
        `<input className="border-red-500 focus:border-red-500" />`,
        `<input className="border-destructive focus:border-destructive" />`,
        red,
      ],
    ];
    for (const [code, fixed, system] of cases) {
      const diagnostics = check(code, system);
      expect(diagnostics.map((d) => d.message)).not.toContainEqual(
        expect.stringContaining('would change nothing'),
      );
      expect(applyFixes(code, diagnostics)).toBe(fixed);
    }
  });
});

describe('no-hardcoded-color keeps status colors from becoming the brand', () => {
  let brand: DesignSystem;
  beforeAll(async () => {
    brand = await load(fixture({ 'app/globals.css': BRAND_THEME }));
  });
  const check = (code: string): Diagnostic[] =>
    brand.check(code, 'app/page.tsx').diagnostics.filter((d) => d.ruleId === rule);

  it('does not fix a red to the brand when destructive is close too', () => {
    // A payment-failed alert in the README's red, and red-500 as an error message: both nearest
    // the rose brand, but destructive, of their hue, is only 0.02 further.
    const code = `<div className="bg-[#ef4444] text-[oklch(0.637_0.237_25.331)]" />`;
    const [alert, error] = check(code);
    expect(alert?.message).toBe(
      'Hardcoded color `bg-[#ef4444]`. Nearest token brand (ΔE 0.052) → `bg-brand`. destructive is close too (ΔE 0.071), and it is a status color, so this is not applied automatically: use `bg-destructive` if the color shows a status, otherwise `bg-brand`.',
    );
    expect(alert?.suggestion).toBe('bg-brand');
    expect(alert?.fix).toBeUndefined();
    expect(error?.fix).toBeUndefined();
    expect(error?.message).toContain('destructive is close too (ΔE 0.061)');
    expect(
      applyFixes(
        code,
        [alert, error].filter((d) => d !== undefined),
      ),
    ).toBe(code);
  });

  it('holds back a rose that destructive is nearer to, and styles and palette classes', () => {
    // rose-600 as hex, a negative KPI delta: 10° from destructive, which is nearer than the brand.
    const [rose] = check(`<p className="text-[#e11d48]">-12%</p>`);
    expect(rose?.fix).toBeUndefined();
    expect(rose?.message).toContain('destructive is close too');
    const [style] = check(`<p style={{ color: "#ef4444" }} />`);
    expect(style?.fix).toBeUndefined();
    expect(style?.message).toContain(
      'use `text-destructive` or `var(--destructive)` if the color shows a status, otherwise `text-brand` or `var(--brand)`.',
    );
    for (const cls of ['text-red-500', 'text-rose-600']) {
      const [d] = check(`<p className="${cls}" />`);
      expect([cls, d?.fix]).toEqual([cls, undefined]);
      expect(d?.message).toContain('destructive is close too');
    }
  });

  it('still fixes the brand color, and reds to destructive', () => {
    const code = `<p className="text-[#f43f5e] text-rose-500 bg-[#dc2626] text-red-600" />`;
    const diagnostics = check(code);
    expect(diagnostics.map((d) => d.message)).not.toContainEqual(
      expect.stringContaining('close too'),
    );
    expect(applyFixes(code, diagnostics)).toBe(
      `<p className="text-brand text-brand bg-destructive text-destructive" />`,
    );
  });
});
