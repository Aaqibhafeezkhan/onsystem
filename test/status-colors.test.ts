import fs from 'node:fs';
import path from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { main, type Io } from '../src/cli.js';
import type { DesignSystem } from '../src/design-system.js';
import { applyFixes } from '../src/lint/index.js';
import { TAILWIND_PALETTE } from '../src/lint/tailwind-palette.js';
import {
  HUE_TOLERANCE,
  hueDistance,
  isTinted,
  parseColor,
  STATUS_HUE_TOLERANCE,
  toHex,
} from '../src/tokens/color.js';
import { fixture, load } from './helpers.js';
import { blocks, section } from './markdown.js';

// docs/tokens.md#status-colors, where the no-token-hue warning sends people: the CSS that gives a
// stock shadcn/ui theme success, warning and info tokens. This pastes the section's CSS into the
// theme of a fresh `shadcn init` and checks what the section says happens then.

const rule = 'no-hardcoded-color';
const docs = fs.readFileSync(path.join(import.meta.dirname, '../docs/tokens.md'), 'utf8');
// `app/globals.css` from a fresh `shadcn init -d` (base-nova, neutral): `destructive` is its
// only status color.
const stock = fs.readFileSync(
  path.join(import.meta.dirname, 'fixtures/shadcn-neutral/globals.css'),
  'utf8',
);

/** WCAG 2 contrast ratio of two CSS colors, in sRGB. */
function contrast(a: string, b: string): number {
  const luminance = (value: string) => {
    const color = parseColor(value);
    if (!color) throw new Error(`not a color: ${value}`);
    const hex = toHex(color);
    const [r = 0, g = 0, bl = 0] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

const STATUS = ['success', 'warning', 'info'] as const;

describe('the status colors recipe (docs/tokens.md)', () => {
  let recipe: string;
  let before: DesignSystem;
  let after: DesignSystem;
  let usage: string;
  beforeAll(async () => {
    const text = section(docs, 'Status colors');
    const css = blocks(text, 'css');
    expect(css).toHaveLength(1);
    recipe = css[0] ?? '';
    const tsx = blocks(text, 'tsx');
    expect(tsx).toHaveLength(1);
    usage = tsx[0] ?? '';
    before = await load(fixture({ 'app/globals.css': stock }));
    after = await load(fixture({ 'app/globals.css': `${stock}\n${recipe}` }));
  });

  it('gives a stock shadcn/ui theme success, warning and info tokens, light and dark', () => {
    const names = (ds: DesignSystem) => ds.tokens.map((t) => t.name);
    for (const status of STATUS) {
      expect(names(before)).not.toContain(status);
      for (const name of [status, `${status}-foreground`]) {
        const token = after.tokens.find((t) => t.name === name);
        expect(token?.tailwind, name).toBe(name);
        expect(token?.modes?.dark, name).toBeDefined();
      }
    }
  });

  it('reads with each foreground and on the page background, at 4.5:1 or more', () => {
    const value = (name: string, mode?: 'dark') => {
      const token = after.tokens.find((t) => t.name === name);
      const found = mode ? token?.modes?.[mode] : token?.value;
      if (!found) throw new Error(`no ${mode ?? 'light'} value for ${name}`);
      return found;
    };
    for (const mode of [undefined, 'dark'] as const) {
      for (const status of STATUS) {
        const color = value(status, mode);
        const pairs = [value('background', mode), value(`${status}-foreground`, mode)];
        for (const other of pairs) {
          expect(
            contrast(color, other),
            `${status} ${mode ?? 'light'} on ${other}`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  it("takes the section's own example without a finding", () => {
    expect(after.check(`<>${usage}</>`, 'components/status.tsx').diagnostics).toEqual([]);
  });

  it('turns the warning into the token: the Tailwind shades it names are fixed to it', () => {
    // The values are these shades, in light mode and in dark mode.
    const shades: [string, string][] = [
      ['text-green-700', 'text-success'],
      ['text-yellow-700', 'text-warning'],
      ['text-blue-600', 'text-info'],
      ['dark:text-green-400', 'dark:text-success'],
      ['dark:text-yellow-400', 'dark:text-warning'],
      ['dark:text-blue-400', 'dark:text-info'],
    ];
    for (const [palette, token] of shades) {
      expect(docs).toContain(palette.replace(/^(?:dark:)?text-/, ''));
      const code = `<span className="${palette}">Active</span>`;
      const [stockFinding] = before.check(code).diagnostics;
      expect([palette, stockFinding?.severity]).toEqual([palette, 'warning']);
      expect(stockFinding?.message).toContain('No token has this hue.');
      const diagnostics = after.check(code).diagnostics;
      expect(diagnostics.map((d) => [d.ruleId, d.severity])).toEqual([[rule, 'error']]);
      expect(diagnostics[0]?.message).toContain('(exact match)');
      expect(applyFixes(code, diagnostics)).toBe(`<span className="${token}">Active</span>`);
    }
  });

  it('reports a color in one of three bands by its hue, as the section lists them', () => {
    for (const band of [
      `**Within ${String(STATUS_HUE_TOLERANCE)}°:** an error that names the token.`,
      `**From ${String(STATUS_HUE_TOLERANCE)}° to ${String(HUE_TOLERANCE)}°:** an error that names the status token and offers no fix`,
      `**Beyond ${String(HUE_TOLERANCE)}°:** the warning stays.`,
    ]) {
      expect(docs).toContain(band);
    }
    const finding = (cls: string) => {
      const found = after.check(`<p className="${cls}" />`).diagnostics;
      expect(found, cls).toHaveLength(1);
      return found[0];
    };
    // Within 8°: every green, light and dark, names success; only the shade it copies is fixed.
    for (const mode of ['', 'dark:']) {
      for (const shade of Object.keys(TAILWIND_PALETTE.green ?? {})) {
        const green = finding(`${mode}bg-green-${shade}`);
        expect([shade, green?.severity]).toEqual([shade, 'error']);
        expect(green?.message, `${mode}bg-green-${shade}`).toMatch(/\bsuccess\b/);
      }
    }
    // The shade next to it: suggested, not applied.
    expect(docs).toContain('not applied (`text-green-800`)');
    const next = finding('text-green-800');
    expect([next?.severity, next?.suggestion, next?.fix]).toEqual([
      'error',
      'text-success',
      undefined,
    ]);
    // The other shades: the token's name, and no fix.
    const far = finding('text-green-600');
    expect([far?.severity, far?.suggestion, far?.fix]).toEqual(['error', undefined, undefined]);
    expect(far?.message).toContain('nearest is success');
    // From 8° to 15°: an error with no fix, unless another token is nearer.
    const between = finding('bg-yellow-600');
    expect(docs).toContain(`\`${between?.message.split('. ')[1]?.split(';')[0] ?? '?'}\``);
    const blue = parseColor(TAILWIND_PALETTE.blue?.[400] ?? '');
    const info = parseColor(TAILWIND_PALETTE.blue?.[600] ?? '');
    if (!blue || !info) throw new Error('no blue');
    expect(hueDistance(blue, info)).toBeGreaterThan(STATUS_HUE_TOLERANCE);
    expect(hueDistance(blue, info)).toBeLessThan(HUE_TOLERANCE);
    expect(finding('text-blue-400')?.message).toContain('Nearest is info');
    expect(finding('bg-blue-400')?.message).toContain('No token has this hue.');
  });

  it('turns two yellows into errors and keeps the warning on the others, as it says', () => {
    const hue = (shade: number) =>
      Math.round(parseColor(TAILWIND_PALETTE.yellow?.[shade] ?? '')?.h ?? NaN);
    expect(docs).toContain(
      `(${String(hue(100))}° at yellow-100, ${String(hue(800))}° at yellow-800)`,
    );
    expect(docs).toContain(`\`warning\` at yellow-700's ${String(hue(700))}°`);
    const finding = (cls: string) => after.check(`<p className="${cls}" />`).diagnostics[0];
    const onStock = (cls: string) => before.check(`<p className="${cls}" />`).diagnostics[0];

    // Errors with no fix, 9° off, where the stock theme warned.
    expect(docs).toContain(
      '`bg-yellow-600` and `bg-yellow-900` without `dark:` are 9° off: they become errors',
    );
    const errors = [600, 900];
    for (const shade of errors) {
      const cls = `bg-yellow-${String(shade)}`;
      expect(onStock(cls)?.severity, cls).toBe('warning');
      const found = finding(cls);
      expect([cls, found?.severity, found?.suggestion, found?.fix]).toEqual([
        cls,
        'error',
        undefined,
        undefined,
      ]);
      expect(found?.message).toContain('Nearest is warning');
      expect(found?.message).toContain('a status color 9° away in hue');
    }
    // The warning stays.
    expect(docs).toContain('Shades yellow-50 to yellow-500 and yellow-950 keep the warning');
    const warnings = [50, 100, 200, 300, 400, 500, 950];
    for (const shade of warnings) {
      const cls = `bg-yellow-${String(shade)}`;
      const found = finding(cls);
      expect([cls, found?.severity]).toEqual([cls, 'warning']);
      expect(found?.message).toContain('No token has this hue.');
    }
    // The rest of the scale is within 8°: yellow-700 is the token, yellow-800 is suggested.
    const rest = Object.keys(TAILWIND_PALETTE.yellow ?? {})
      .map(Number)
      .filter((shade) => !errors.includes(shade) && !warnings.includes(shade));
    expect(rest).toEqual([700, 800]);
    expect(finding('bg-yellow-700')?.fix).toBeDefined();
    expect([finding('bg-yellow-800')?.suggestion, finding('bg-yellow-800')?.fix]).toEqual([
      'bg-warning',
      undefined,
    ]);
    // What to write instead has no finding.
    for (const token of ['text-warning', 'bg-warning', 'bg-warning/10']) {
      expect(docs).toContain(`\`${token}\``);
      expect(finding(token), token).toBeUndefined();
    }
  });

  it('says which colors change hue the most from shade to shade', () => {
    expect(docs).toContain('change hue from shade to shade, yellow and amber the most');
    // The widest spread of hue across a family's shades, among families that are hues, not grays.
    const spread = Object.entries(TAILWIND_PALETTE)
      .map(([family, shades]) => {
        const colors = Object.values(shades).map((value) => parseColor(value));
        if (!colors.every((c) => c && isTinted(c))) return [family, -1] as const;
        let most = 0;
        for (const a of colors)
          for (const b of colors) if (a && b) most = Math.max(most, hueDistance(a, b));
        return [family, most] as const;
      })
      .sort((a, b) => b[1] - a[1]);
    expect(
      spread
        .slice(0, 2)
        .map(([family]) => family)
        .sort(),
    ).toEqual(['amber', 'yellow']);
  });
});

describe('the troubleshooting entry for a status color', () => {
  it('links the recipe, and check exits 0 on the warning', async () => {
    const troubleshooting = fs.readFileSync(
      path.join(import.meta.dirname, '../docs/troubleshooting.md'),
      'utf8',
    );
    expect(section(troubleshooting, 'A status color has no token')).toContain(
      '(tokens.md#status-colors)',
    );
    const root = fixture({
      'app/globals.css': stock,
      'app/page.tsx':
        'export default () => <span className="bg-green-100 text-green-800">Active</span>',
    });
    const out: string[] = [];
    const io: Io = { cwd: root, color: false, stdout: (t) => out.push(t), stderr: () => {} };
    expect(await main(['check', 'app/page.tsx', '--no-cache'], io)).toBe(0);
    expect(out.join('\n')).toContain('0 errors, 2 warnings');
  });
});
