import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { main, type Io } from '../src/cli.js';
import { DEMO_ROOT, fixture } from './helpers.js';
import { blocks } from './markdown.js';

// A first `check .` on a palette-heavy app (Dub's web app) prints over 14,000 lines, one per
// finding, and used to end with one line of totals. A long run now ends with what the findings
// add up to: the count per rule, as `init`'s dry run gives it, and the palette classes found
// most, each with the token to use, which reads as a plan for moving to the tokens. JSON, SARIF
// and GitHub output keep every finding and nothing else.

async function run(args: string[], cwd: string) {
  const out: string[] = [];
  const err: string[] = [];
  const io: Io = { cwd, color: false, stdout: (t) => out.push(t), stderr: (t) => err.push(t) };
  const code = await main(args, io);
  return { code, stdout: out.join('\n'), stderr: err.join('\n') };
}

const BUTTON =
  'export function Button(props: React.ComponentProps<"button">) { return <button {...props} /> }';
const GLOBALS = fs.readFileSync(path.join(DEMO_ROOT, 'app/globals.css'), 'utf8');

/** `pages` pages, each with the same palette classes and a native button. */
function paletteApp(pages: number): string {
  const files: Record<string, string> = {
    'components/ui/button.tsx': BUTTON,
    'app/globals.css': GLOBALS,
  };
  for (let i = 1; i <= pages; i++) {
    files[`app/page-${String(i).padStart(2, '0')}.tsx`] = `export default function Page() {
  return (
    <div className="border border-neutral-200 hover:border-neutral-200">
      <p className="text-neutral-500">Hi</p>
      <p className="text-neutral-800">There</p>
      <button>Go</button>
    </div>
  );
}
`;
  }
  return fixture(files);
}

describe('check: the summary of a long run', () => {
  it('ends with the findings per rule and the most common palette classes', async () => {
    const root = paletteApp(12);
    const { code, stdout } = await run(['check', 'app', '--no-cache'], root);
    expect(code).toBe(1);
    const lines = stdout.split('\n');
    const start = lines.findIndex((line) => line.startsWith('By rule:'));
    expect(start).toBeGreaterThan(0);
    // After the last file's findings and before the totals.
    expect(lines[start - 1]).toBe('');
    expect(lines.slice(start)).toEqual([
      'By rule: no-hardcoded-color 48, prefer-design-system-component 12.',
      'Tailwind palette classes: 48 in 12 files. The most common, with the token to use:',
      '  12× border-neutral-200 → border-border',
      '  12× hover:border-neutral-200 → hover:border-border',
      '  12× text-neutral-500 → text-muted-foreground',
      '  12× text-neutral-800 → text-primary (nearest token)',
      '',
      '60 errors, 0 warnings in 12 files',
    ]);
    // docs/ci.md shows this summary.
    const ci = fs.readFileSync(path.join(import.meta.dirname, '../docs/ci.md'), 'utf8');
    const shown = blocks(ci, 'text').find((block) => block.startsWith('By rule:'));
    expect(shown?.trimEnd()).toBe(lines.slice(start, start + 6).join('\n'));
  });

  it('lists the ten most common palette classes, most first', async () => {
    const files: Record<string, string> = {
      'components/ui/button.tsx': BUTTON,
      'app/globals.css': GLOBALS,
    };
    // Shades 50 to 950 of neutral as borders: shade i appears i + 1 times.
    const shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
    for (const [i, shade] of shades.entries()) {
      const classes = Array.from({ length: i + 1 }, () => `border-neutral-${shade}`).join(' ');
      files[`app/border-${shade}.tsx`] = `export default () => <div className="${classes}" />`;
    }
    const root = fixture(files);
    const { stdout } = await run(['check', 'app', '--no-cache'], root);
    const rows = stdout.split('\n').filter((line) => /^\s+\d+× /.test(line));
    expect(rows).toHaveLength(10);
    expect(rows[0]).toMatch(/^ {2}11× border-neutral-950 → /);
    expect(rows[9]).toMatch(/^ {3}2× border-neutral-100 → /);
    // A class with no token close to its color is listed too: the theme lacks one.
    expect(rows).toContain('   8× border-neutral-700 → no close token');
    expect(stdout).not.toContain('border-neutral-50 →');
    expect(stdout).toContain('Tailwind palette classes: 66 in 11 files.');
  });

  it('is left out of short runs and of JSON, SARIF and GitHub output', async () => {
    const short = await run(['check', 'app', '--no-cache'], paletteApp(2));
    expect(short.stdout).not.toContain('By rule:');
    expect(short.stdout).not.toContain('Tailwind palette classes');
    expect(short.stdout.split('\n').at(-1)).toBe('10 errors, 0 warnings in 2 files');

    const root = paletteApp(12);
    for (const format of ['json', 'sarif', 'github']) {
      const { stdout } = await run(['check', 'app', '--format', format, '--no-cache'], root);
      expect(stdout).not.toContain('By rule:');
      expect(stdout).not.toContain('Tailwind palette classes');
    }
  });
});
