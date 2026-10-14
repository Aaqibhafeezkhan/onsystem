import fs from 'node:fs';
import path from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { main, type Io } from '../src/cli.js';
import type { DesignSystem } from '../src/design-system.js';
import { applyFixes } from '../src/lint/index.js';
import { TAILWIND_PALETTE } from '../src/lint/tailwind-palette.js';
import { parseColor, STATUS_HUE_TOLERANCE, toHex } from '../src/tokens/color.js';
import { fixture, load } from './helpers.js';

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

/** The text under `## <heading>`, up to the next `## ` heading. */
function section(markdown: string, heading: string): string {
  const start = markdown.indexOf(`\n## ${heading}\n`);
  if (start === -1) throw new Error(`no "## ${heading}" section`);
  const end = markdown.indexOf('\n## ', start + 1);
  return markdown.slice(start, end === -1 ? undefined : end);
}

/** The fenced code blocks of one language. */
function blocks(markdown: string, lang: string): string[] {
  return [...markdown.matchAll(new RegExp(`\`\`\`${lang}[^\\n]*\\n([\\s\\S]*?)\`\`\``, 'g'))].map(
    (m) => m[1] ?? '',
  );
}

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

  it('names the token for the other shades of its hue, and warns on a pale yellow, as it says', () => {
    const finding = (cls: string) => after.check(`<p className="${cls}" />`).diagnostics[0];
    // A green tint now gets an error that names success.
    const green = finding('bg-green-100');
    expect(green?.severity).toBe('error');
    expect(green?.message).toContain('nearest is success');
    // Every green shade of Tailwind's palette is within 8° of success.
    for (const shade of [50, 100, 200, 300, 400, 500, 600, 800, 900, 950]) {
      expect(finding(`bg-green-${shade}`)?.message, `bg-green-${shade}`).toMatch(/success/);
    }
    // Yellow's pale shades are too far in hue from yellow-700: still the warning.
    expect(docs).toContain(`within ${String(STATUS_HUE_TOLERANCE)}° of a status token's hue`);
    const hue = (shade: number) =>
      Math.round(parseColor(TAILWIND_PALETTE.yellow?.[shade] ?? '')?.h ?? NaN);
    expect(docs).toContain(
      `(${String(hue(100))}° at yellow-100, ${String(hue(800))}° at yellow-800)`,
    );
    const yellow = finding('bg-yellow-100');
    expect(yellow?.severity).toBe('warning');
    expect(yellow?.message).toContain('No token has this hue.');
    expect(docs).toContain('`bg-warning/10`');
    expect(finding('bg-warning/10')).toBeUndefined();
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
