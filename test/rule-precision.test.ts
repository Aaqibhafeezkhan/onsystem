import fs from 'node:fs';
import path from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import type { DesignSystem } from '../src/design-system.js';
import { applyFixes } from '../src/lint/index.js';
import { TAILWIND_KEYWORD_COLORS, TAILWIND_VERSION } from '../src/lint/tailwind-palette.js';
import type { Diagnostic } from '../src/types.js';
import { DEMO_ROOT, loadOnce } from './helpers.js';

// Valid code outside the main shadcn/ui path that the rules got wrong: white and black, which
// passed as clean while `bg-[white]` and `fill="white"` did not; class strings kept in a variable
// or a map; and an icon-only link rendered through `asChild`. Each case is the probe that found it.

let ds: DesignSystem;
beforeAll(async () => {
  ds = await loadOnce(DEMO_ROOT);
});

function check(code: string, rule?: string): Diagnostic[] {
  const { diagnostics } = ds.check(code, 'components/probe.tsx');
  return rule ? diagnostics.filter((d) => d.ruleId === rule) : diagnostics;
}
const sources = (code: string, rule: string) => check(code, rule).map((d) => d.source);

describe('no-hardcoded-color: white and black', () => {
  const rule = 'no-hardcoded-color';

  it("reads them from Tailwind's theme, as the palette", () => {
    const theme = fs.readFileSync(
      path.join(DEMO_ROOT, 'node_modules/tailwindcss/theme.css'),
      'utf8',
    );
    const { version } = JSON.parse(
      fs.readFileSync(path.join(DEMO_ROOT, 'node_modules/tailwindcss/package.json'), 'utf8'),
    ) as { version: string };
    expect(TAILWIND_VERSION).toBe(version);
    expect(TAILWIND_KEYWORD_COLORS).toEqual({
      black: /--color-black:\s*([^;]+);/.exec(theme)?.[1],
      white: /--color-white:\s*([^;]+);/.exec(theme)?.[1],
    });
  });

  it('reports bg-white and text-black, which passed as clean (the finding’s repro)', () => {
    const code = 'export const K = () => <div className="bg-white text-black">x</div>';
    const [bg, text] = check(code, rule);
    expect(bg).toMatchObject({
      source: 'bg-white',
      severity: 'error',
      suggestion: 'bg-background',
    });
    expect(bg?.message).toBe(
      '`bg-white` is a fixed color, not a design-system color. Matches token background (exact match, same value as card, popover) → `bg-background`.',
    );
    // Text in white or black depends on the surface under it: named, as a warning, never fixed.
    expect(text).toMatchObject({ source: 'text-black', severity: 'warning' });
    expect(text?.fix).toBeUndefined();
    expect(applyFixes(code, check(code, rule))).toBe(
      'export const K = () => <div className="bg-background text-black">x</div>',
    );
  });

  it('reports both halves of a light and dark pair, and the create-next-app template', () => {
    expect(sources('<div className="bg-white dark:bg-zinc-900" />', rule)).toEqual([
      'bg-white',
      'dark:bg-zinc-900',
    ]);
    // `bg-[white]` was reported and `bg-white` was not; now both are, the same way.
    expect(check('<div className="bg-[white]" />', rule)[0]?.suggestion).toBe('bg-background');
    expect(check('<div className="bg-white" />', rule)[0]?.suggestion).toBe('bg-background');
    expect(
      sources(
        '<main className="bg-white dark:bg-black"><a className="text-black hover:bg-black/[.04] dark:border-white/[.145]">x</a></main>',
        rule,
      ),
    ).toEqual(['bg-white', 'dark:bg-black', 'text-black']);
  });

  it('fixes only to a token of exactly that color', () => {
    const [border] = check('<div className="border border-white" />', rule);
    expect(border?.suggestion).toBe('border-border');
    expect(border?.fix).toBeUndefined();
    expect(border?.message).toContain(
      'Only a token of exactly this color is applied automatically.',
    );
    expect(check('<div className="bg-gradient-to-t from-white" />', rule)[0]?.fix).toEqual([
      expect.objectContaining({ text: 'from-background' }),
    ]);
  });

  it('leaves alone tints, masks and white or black text on a surface it contrasts with', () => {
    const quiet = [
      // An overlay or a hairline with an opacity modifier tints whatever is under it.
      '<div className="fixed inset-0 bg-black/50" />',
      '<div className="border-white/10 shadow-black/5 ring-black/5" />',
      // Luminance in a mask, as for `stopColor="white"`.
      '<svg><mask id="m"><rect className="fill-white" /></mask></svg>',
      // The contrast color of a surface in its class list, as shadcn/ui's destructive variant has it.
      '<div className="bg-destructive text-white" />',
      '<a className="bg-indigo-600 text-white">Start free trial</a>',
      '<button className="bg-orange-500 hover:bg-orange-600 text-white">Upgrade</button>',
      // The surface of a state is the surface of the text in that state.
      '<button className="hover:bg-red-600 hover:text-white">Delete</button>',
      // On a translucent scrim or a gradient over an image, and on an element around it.
      '<div className="bg-black/60"><h3 className="text-white">Title</h3></div>',
      '<div className="bg-gradient-to-t from-black/60"><h3 className="text-white">Title</h3></div>',
      '<div className="bg-primary p-4"><p><span className="text-white">Hi</span></p></div>',
      // A component whose variants set its background.
      'import { Button } from "@/components/ui/button"\n<Button className="text-white">Go</Button>',
      'import { Badge } from "@/components/ui/badge"\n<Badge><span className="text-white">3</span></Badge>',
    ];
    // The surfaces themselves are reported where they are palette colors (`bg-indigo-600`).
    const whiteOrBlack = (code: string) => sources(code, rule).filter((s) => /white|black/.test(s));
    for (const code of quiet) expect(whiteOrBlack(code), code).toEqual([]);
  });

  it('still reports white or black text on a surface of its own lightness, or none', () => {
    expect(sources('<div className="bg-white text-white" />', rule)).toEqual([
      'bg-white',
      'text-white',
    ]);
    expect(
      sources('<div className="bg-muted"><span className="text-white">x</span></div>', rule),
    ).toEqual(['text-white']);
    // An opaque bg-black is as hardcoded as the text on it.
    expect(sources('<div className="bg-black text-white" />', rule)).toEqual([
      'bg-black',
      'text-white',
    ]);
    const [text] = check('<h1 className="text-4xl text-white">Hello</h1>', rule);
    expect(text?.severity).toBe('warning');
    expect(text?.fix).toBeUndefined();
    expect(text?.message).toContain(
      'White or black text depends on the surface under it, so this is not applied automatically: use the foreground token of that surface.',
    );
  });

  it('keeps a state class apart from a white it would become the same token as', () => {
    // `bg-white` → `bg-background`, so `hover:bg-gray-50` → `hover:bg-background` would change
    // nothing on hover (saas-starter's sign-in button).
    const [, hover] = check('<button className="bg-white hover:bg-gray-50" />', rule);
    expect(hover?.source).toBe('hover:bg-gray-50');
    expect(hover?.fix).toBeUndefined();
  });

  it('reports a palette color written as its CSS variable', () => {
    const [d] = check('<span className="text-[var(--color-red-600)]">Overdue</span>', rule);
    expect(d?.message).toContain("is Tailwind's default palette (`red-600`)");
    expect(d?.fix?.[0]?.text).toBe('text-destructive');
    // A variable of the design system's own is a token.
    expect(check('<span className="bg-[var(--color-primary)]" />', rule)).toEqual([]);
  });
});

describe('class strings kept in a variable, a map or a function of the file', () => {
  const rule = 'no-hardcoded-color';
  const PROPS = '{ status }: { status: "New" | "Lost" }';

  it('follows a const, through conditions, cn() and templates (the finding’s probes)', () => {
    expect(
      sources(
        `export function StatusBadge({ active }: { active: boolean }) {
  const extra = active ? "ring-2 ring-indigo-500" : ""
  const tone = "text-emerald-600"
  return <div className={cn("p-4 bg-slate-50", extra)}><span className={tone} /><b className={cn(tone, "font-bold")} /></div>
}`,
        rule,
      ),
    ).toEqual(['ring-indigo-500', 'text-emerald-600', 'bg-slate-50']);
    expect(
      sources(
        `const base = "rounded-md bg-green-50"
export const K = ({ wide }: { wide: boolean }) => <div className={\`\${base} \${wide ? "w-full" : "w-auto"}\`} />`,
        rule,
      ),
    ).toEqual(['bg-green-50']);
    expect(
      sources(
        `const tone = "text-red-700"\nexport const K = () => <p className={"p-2 " + tone} />`,
        rule,
      ),
    ).toEqual(['text-red-700']);
  });

  it('follows a key of an object map, and a map in one', () => {
    expect(
      sources(
        `const statusStyles = { New: "bg-green-50 text-green-700", Lost: "bg-red-50 text-red-700" } as const
export function StatusBadge(${PROPS}) {
  return <span className={statusStyles[status]}>{status}</span>
}`,
        rule,
      ),
    ).toEqual(['bg-green-50', 'text-green-700', 'bg-red-50', 'text-red-700']);
    // A key read by name reads that value only.
    expect(
      sources(
        `const styles = { badge: { New: "bg-green-50", Lost: "bg-red-50" }, title: "text-sky-600" }
export function StatusBadge(${PROPS}) {
  return <span className={cn(styles.badge[status])}>{status}</span>
}`,
        rule,
      ),
    ).toEqual(['bg-green-50', 'bg-red-50']);
  });

  it('follows what a function of the file returns', () => {
    expect(
      sources(
        `function toneOf(status: string) {
  return status === "New" ? "text-green-600" : "text-red-600"
}
const sizeOf = (big: boolean) => (big ? "p-6" : "bg-blue-50")
export function StatusBadge(${PROPS}) {
  return <span className={cn(toneOf(status), sizeOf(true))}>{status}</span>
}`,
        rule,
      ),
    ).toEqual(['text-green-600', 'text-red-600', 'bg-blue-50']);
  });

  it('fixes the class where it is written', () => {
    const code = `const tone = "text-red-600"\nexport const K = () => <p className={tone} />`;
    expect(applyFixes(code, check(code, rule))).toBe(
      `const tone = "text-destructive"\nexport const K = () => <p className={tone} />`,
    );
  });

  it('reports a string once, however many elements use it', () => {
    expect(
      sources(
        `const tone = "text-red-700"\nexport const K = () => <><p className={tone} /><p className={tone} /></>`,
        rule,
      ),
    ).toEqual(['text-red-700']);
  });

  it('does not follow what can hold another value: a parameter, a let, an import, a shadowed name', () => {
    const unfollowed = [
      `export function K({ tone }: { tone: string }) { return <p className={tone} /> }`,
      `export function K() { let tone = "text-red-700"; tone = "p-2"; return <p className={tone} /> }`,
      `import { tone } from "./tones"\nexport const K = () => <p className={tone} />`,
      `const tone = "text-red-700"\nexport const K = ({ items }: { items: string[] }) => items.map((tone) => <p className={tone} />)`,
      `const tone = "text-red-700"\nexport function K() { for (const tone of ["p-2"]) return <p className={tone} /> }`,
      // A string that is not a class value: a label, a key compared in a condition.
      `const label = "text-red-700"\nexport const K = ({ s }: { s: string }) => <p className={s === label ? "p-2" : "p-4"}>{label}</p>`,
      // Classes in other props are not read: `tw` renders through @vercel/og, without the theme.
      `export const K = () => <div tw="shrink-0 text-green-600" />`,
    ];
    for (const code of unfollowed) expect(sources(code, rule), code).toEqual([]);
  });

  it('checks spacing kept in a variable too', () => {
    expect(
      sources(
        `const pad = "p-[13px]"\nexport const K = () => <div className={pad} />`,
        'no-hardcoded-spacing',
      ),
    ).toEqual(['p-[13px]']);
  });
});

describe('icon-button-accessible-name: an icon-only link rendered through asChild', () => {
  const rule = 'icon-button-accessible-name';
  const IMPORTS = `import Link from "next/link"
import { Pencil, Trash2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
`;

  it('reports the link, with the label fix on it (the finding’s repro)', () => {
    const code = `${IMPORTS}export const K = () => <Button asChild size="icon" variant="ghost"><Link href="/users/1/edit"><Pencil /></Link></Button>`;
    const [d] = check(code, rule);
    expect(d).toMatchObject({ source: 'Link', severity: 'error', suggestion: 'aria-label="Edit"' });
    expect(d?.message).toBe(
      'Icon-only <Link> in <Button asChild> has no accessible name. Add aria-label="Edit" describing the action, or visually hidden text.',
    );
    expect(applyFixes(code, [d as Diagnostic])).toContain(
      '<Link aria-label="Edit" href="/users/1/edit"><Pencil /></Link>',
    );
    // A native anchor is the same link, and a label it cannot be sure of is named without a fix.
    const [anchor] = check(
      `${IMPORTS}<Button asChild><a href="/docs"><ExternalLink /></a></Button>`,
      rule,
    );
    expect(anchor?.source).toBe('a');
    expect(anchor?.fix).toBeUndefined();
  });

  it('accepts a label on the button or the link, and visible or visually hidden text', () => {
    const ok = [
      `<Button asChild aria-label="Edit"><Link href="/x"><Pencil /></Link></Button>`,
      `<Button asChild size="icon"><Link href="/x" aria-label="Edit"><Pencil /></Link></Button>`,
      `<Button asChild><a href="/x" title="Open"><ExternalLink /></a></Button>`,
      `<Button asChild><Link href="/x"><Pencil /><span className="sr-only">Edit</span></Link></Button>`,
      `<Button asChild><Link href="/x">Edit</Link></Button>`,
      `<Button asChild><Link href="/x" {...props}><Pencil /></Link></Button>`,
    ];
    for (const code of ok) expect(check(`${IMPORTS}${code}`, rule), code).toEqual([]);
  });

  it('leaves a child that is no link to its own checks', () => {
    const others = [
      // A trigger's child button is checked as itself, once.
      `<Button asChild><Button size="icon" aria-label="Delete"><Trash2 /></Button></Button>`,
      // A span under a tooltip's trigger is not a control, and an icon is no link.
      `<Button asChild><span><Pencil /></span></Button>`,
      `<Button asChild size="icon"><ExternalLink /></Button>`,
    ];
    for (const code of others) expect(check(`${IMPORTS}${code}`, rule), code).toEqual([]);
  });
});

describe('no-hardcoded-spacing and no-hardcoded-radius: lengths in em', () => {
  it('suggests a step for a font-relative length without fixing it', () => {
    const code = `<div className="px-[0.5em] rounded-[0.75em] px-[8px]" style={{ padding: "0.5em" }} />`;
    const found = check(code).filter((d) => d.ruleId !== 'no-hardcoded-color');
    expect(found.map((d) => [d.source, d.suggestion, Boolean(d.fix)])).toEqual([
      ['px-[0.5em]', 'px-2', false],
      ['rounded-[0.75em]', 'rounded-lg', false],
      ['px-[8px]', 'px-2', true],
      ['"0.5em"', 'p-2', false],
    ]);
    // Not "on the scale": 0.5em is 8px only at a 16px font.
    expect(found[0]?.message).toBe(
      '`px-[0.5em]` is font-relative: 0.5em is 8px only at a 16px font. Nearest step: `px-2` (8px), which does not grow with the font, so it is not applied automatically.',
    );
    expect(check(`<div className="px-[0.5rem]" />`)[0]?.fix?.[0]?.text).toBe('px-2');
  });
});
