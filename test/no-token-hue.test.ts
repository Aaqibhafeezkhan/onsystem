import fs from 'node:fs';
import path from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import type { DesignSystem } from '../src/design-system.js';
import { applyFixes } from '../src/lint/index.js';
import type { Diagnostic } from '../src/types.js';
import { fixture, load } from './helpers.js';

const rule = 'no-hardcoded-color';

/** What the message says when the theme has no token of the color's hue: both ways out. */
const WAYS_OUT =
  'No token has this hue. Add a token for it to the theme, such as `--success` for a status color, or keep this color and give the reason on the line above: `// onsystem-disable-next-line no-hardcoded-color -- <reason>` (between JSX children, `{/* onsystem-disable-next-line no-hardcoded-color -- <reason> */}`).';

/** A suppression comment the message offers, as an agent would paste it. */
const offered = (form: RegExp): string =>
  (WAYS_OUT.match(form)?.[1] ?? '').replace('<reason>', 'status color');
const LINE_COMMENT = offered(/`(\/\/ onsystem-disable[^`]*)`/);
const JSX_COMMENT = offered(/`(\{\/\* onsystem-disable[^`]*)`/);

/** Naming a gray or another hue's token as the nearest pushes agents to swap a status green for it. */
function expectNoTokenNamed(d: Diagnostic | undefined): void {
  expect(d?.message).not.toMatch(/nearest|a gray|another hue|Pick the semantic token/i);
  expect(d?.message).not.toMatch(/\b(?:chart|muted|ring|accent|secondary|primary|brand)\b/);
  expect(d?.suggestion).toBeUndefined();
  expect(d?.fix).toBeUndefined();
}

describe('no-hardcoded-color when no token has the hue', () => {
  // `app/globals.css` from a fresh `shadcn init -d` (base-nova, neutral): no success,
  // warning or info token, and every chart token is a gray.
  const globals = fs.readFileSync(
    path.join(import.meta.dirname, 'fixtures/shadcn-neutral/globals.css'),
    'utf8',
  );
  let shadcn: DesignSystem;
  beforeAll(async () => {
    shadcn = await load(fixture({ 'app/globals.css': globals }));
  });

  it('warns, without blocking, on a status badge in a stock shadcn/ui theme', () => {
    const code = `export function Status() {
  return (
    <>
      <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</span>
      <span className="bg-yellow-100 text-yellow-800">Pending</span>
      <a className="text-blue-600" href="/docs">Docs</a>
      <span className="bg-emerald-500/10 text-emerald-700">Paid</span>
    </>
  )
}`;
    const result = shadcn.check(code, 'components/status-badge.tsx');
    const diagnostics = result.diagnostics.filter((d) => d.ruleId === rule);
    expect(diagnostics.map((d) => d.source)).toEqual([
      'bg-green-100',
      'text-green-800',
      'dark:bg-green-900/30',
      'dark:text-green-400',
      'bg-yellow-100',
      'text-yellow-800',
      'text-blue-600',
      'bg-emerald-500/10',
      'text-emerald-700',
    ]);
    for (const d of diagnostics) {
      expect([d.source, d.severity]).toEqual([d.source, 'warning']);
      expect(d.message).toBe(
        `\`${d.source}\` is Tailwind's default palette, not a design-system color. ${WAYS_OUT}`,
      );
      expectNoTokenNamed(d);
    }
    expect(result.errorCount).toBe(0);
    expect(applyFixes(code, diagnostics)).toBe(code);
  });

  it('warns on hex values, styles and attributes of a hue the theme lacks', () => {
    const code = `<div className="bg-[#16a34a]" style={{ color: "#2563eb" }}><svg fill="#ca8a04" /></div>`;
    const diagnostics = shadcn.check(code, 'app/page.tsx').diagnostics;
    expect(diagnostics.map((d) => [d.source, d.severity])).toEqual([
      ['bg-[#16a34a]', 'warning'],
      ['#2563eb', 'warning'],
      ['#ca8a04', 'warning'],
    ]);
    for (const d of diagnostics) {
      expect(d.message).toContain(WAYS_OUT);
      expectNoTokenNamed(d);
    }
  });

  it('names no token of another hue, nor a chart token in a chart', async () => {
    // shadcn/ui's earlier default chart colors (chart-2 a teal) next to a brand blue.
    const system = await load(
      fixture({
        'app/globals.css': `@import "tailwindcss";
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-brand: var(--brand);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
}
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --brand: oklch(0.546 0.245 262.881);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
}`,
      }),
    );
    for (const file of ['app/page.tsx', 'components/charts/revenue.tsx']) {
      const [d] = system
        .check(`<span className="text-green-600">Active</span>`, file)
        .diagnostics.filter((x) => x.ruleId === rule);
      expect([file, d?.severity]).toEqual([file, 'warning']);
      expect(d?.message).toContain(WAYS_OUT);
      expectNoTokenNamed(d);
    }
    // The brand blue is still the fix for its own hue.
    const [blue] = system.check(`<a className="text-blue-600" />`).diagnostics;
    expect(blue?.severity).toBe('error');
    expect(blue?.suggestion).toBe('text-brand');
  });

  it('takes the comments the message offers, each where it says', () => {
    expect(LINE_COMMENT).toBe('// onsystem-disable-next-line no-hardcoded-color -- status color');
    expect(JSX_COMMENT).toBe(
      '{/* onsystem-disable-next-line no-hardcoded-color -- status color */}',
    );
    const quiet = (code: string) => shadcn.check(code, 'app/page.tsx').diagnostics;
    // On the line above, in code and between attributes.
    expect(
      quiet(`${LINE_COMMENT}
const active = "bg-green-100 text-green-800";`),
    ).toEqual([]);
    expect(
      quiet(`<span
  ${LINE_COMMENT}
  className="bg-green-100 text-green-800"
>
  Active
</span>`),
    ).toEqual([]);
    // A badge on its own line between JSX children, where most of them sit.
    const badge = (comment: string) => `export function Plan() {
  return (
    <div className="flex items-center gap-2">
      <h3>Pro</h3>
      ${comment}
      <span className="bg-green-100 text-green-800">Active</span>
    </div>
  );
}`;
    expect(quiet(badge(JSX_COMMENT))).toEqual([]);
    // There a `//` line is JSX text: it suppresses nothing (and would render), hence the other form.
    expect(quiet(badge(LINE_COMMENT)).map((d) => [d.source, d.severity])).toEqual([
      ['bg-green-100', 'warning'],
      ['text-green-800', 'warning'],
    ]);
  });

  it('keeps blocking colors a token has, or could have', async () => {
    const block = (code: string, system = shadcn) =>
      system.check(code, 'app/page.tsx').diagnostics.map((d) => [d.source, d.severity]);
    // A red is destructive; a dark gray has a gray token, only far.
    expect(block(`<p className="text-red-600 bg-[#404040]" />`)).toEqual([
      ['text-red-600', 'error'],
      ['bg-[#404040]', 'error'],
    ]);
    // A gray in a theme whose only token is tinted: a gray token is what is missing.
    const tinted = await load(
      fixture({
        'app/globals.css': `@import "tailwindcss";
@theme inline { --color-brand: var(--brand); }
:root { --brand: oklch(0.56 0.06 264); }`,
      }),
    );
    expect(block(`<p className="text-gray-500" />`, tinted)).toEqual([['text-gray-500', 'error']]);
    // An emerald 14° from the theme's success green: the status token is there to use.
    const success = await load(
      fixture({
        'app/globals.css': `@import "tailwindcss";
@theme inline { --color-success: var(--success); }
:root { --success: oklch(0.627 0.194 149.214); }`,
      }),
    );
    const [emerald] = success.check(`<p className="bg-emerald-600" />`).diagnostics;
    expect(emerald?.severity).toBe('error');
    expect(emerald?.message).toContain('a status color 14° away in hue');
  });
});
