import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { main, type Io } from '../src/cli.js';
import { fixture, TSCONFIG } from './helpers.js';
import { blocks, section } from './markdown.js';

// `init` says when the theme has no success, warning or info color, and links the recipe in
// docs/tokens.md#status-colors. In bench/v2, every arm kept the requested status color where the
// theme had a token for it; where it had none, agents with onsystem used chart tokens instead.

const json = (value: unknown) => JSON.stringify(value, null, 2);
const read = (file: string) => fs.readFileSync(path.join(import.meta.dirname, file), 'utf8');
// `app/globals.css` from a fresh `shadcn init -d` (base-nova, neutral): destructive only.
const stock = read('fixtures/shadcn-neutral/globals.css');
const recipe = blocks(section(read('../docs/tokens.md'), 'Status colors'), 'css')[0] ?? '';
const LINK = 'https://onsystem.vercel.app/docs/tokens#status-colors';

async function init(globals: string): Promise<string> {
  const root = fixture({
    'tsconfig.json': TSCONFIG,
    'package.json': json({ name: 'app' }),
    'components.json': json({
      tailwind: { css: 'app/globals.css' },
      aliases: { ui: '@/components/ui' },
    }),
    'components/ui/button.tsx':
      'export function Button(props: { variant?: "default" | "outline"; children?: unknown }) { return <button /> }\n',
    'app/globals.css': globals,
    'app/page.tsx': 'export default () => <span className="text-green-600">Active</span>\n',
  });
  const out: string[] = [];
  const io: Io = {
    cwd: root,
    color: false,
    stdout: (t) => out.push(t),
    stderr: (t) => out.push(t),
  };
  expect(await main(['init', '--yes', '--no-cache'], io)).toBe(0);
  return out.join('\n');
}

describe('onsystem init and status colors', () => {
  it('names the status colors a stock shadcn/ui theme lacks, and links the recipe', async () => {
    const stdout = await init(stock);
    expect(stdout).toContain(
      `The theme has no success, warning or info token, so a green, yellow or blue status color has no token to use, and agents tend to reach for a chart or gray token instead. To add them: ${LINK}.`,
    );
    // After the dry run, whose warning it explains.
    expect(stdout.indexOf('Dry run of')).toBeLessThan(stdout.indexOf(LINK));
  });

  it('says nothing once the theme has them', async () => {
    expect(recipe).toContain('--color-success: var(--success);');
    expect(await init(`${stock}\n${recipe}`)).not.toContain(LINK);
  });

  it('names only the ones missing, by any name a status color goes by', async () => {
    const theme = `@import "tailwindcss";
@theme inline {
  --color-primary: var(--primary);
  --color-content-success: var(--content-success);
}
:root { --primary: oklch(0.2 0 0); --content-success: oklch(0.6 0.15 150); }
`;
    expect(await init(theme)).toContain(
      `The theme has no warning or info token, so a yellow or blue status color has no token to use, and agents tend to reach for a chart or gray token instead. To add them: ${LINK}.`,
    );
  });

  it('says nothing when the theme has no colors', async () => {
    expect(await init(':root { --radius: 0.5rem; }\n')).not.toContain(LINK);
  });
});
