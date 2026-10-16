import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { main, type Io } from '../src/cli.js';
import { fixture, TSCONFIG } from './helpers.js';

const json = (value: unknown) => JSON.stringify(value, null, 2);

async function run(args: string[], cwd: string, answers?: string[]) {
  const out: string[] = [];
  const err: string[] = [];
  const asked: string[] = [];
  const io: Io = {
    cwd,
    color: false,
    stdout: (t) => out.push(t),
    stderr: (t) => err.push(t),
    prompt: answers
      ? (question) => {
          asked.push(question);
          return Promise.resolve(answers.shift() ?? '');
        }
      : undefined,
  };
  const code = await main(args, io);
  return { code, stdout: out.join('\n'), stderr: err.join('\n'), asked };
}

/** A shadcn/ui app with a clean page, so init asks no baseline question. */
const APP = {
  'tsconfig.json': TSCONFIG,
  'package.json': json({ name: 'app' }),
  'components.json': json({
    tailwind: { css: 'app/globals.css' },
    aliases: { ui: '@/components/ui' },
  }),
  'components/ui/button.tsx':
    'export function Button(props: { variant?: "default" | "outline"; children?: unknown }) { return <button /> }\n',
  'app/globals.css':
    ':root { --primary: oklch(0.2 0 0); }\n@theme inline { --color-primary: var(--primary); }\n',
  'app/page.tsx':
    'import { Button } from "@/components/ui/button"\nexport default () => <Button>Go</Button>\n',
};

// An AGENTS.md shaped like create-next-app 16.4's, with Next's rules, and a CLAUDE.md that imports it.
const NEXT_AGENTS =
  '<!-- BEGIN:nextjs-agent-rules -->\n# This is NOT the Next.js you know\n\nRead the docs in node_modules/next/dist/docs/ before writing code.\n<!-- END:nextjs-agent-rules -->\n';
const NEXT_CLAUDE = '@AGENTS.md\n';

const BEGIN = '<!-- BEGIN:onsystem-agent-rules -->';
const END = '<!-- END:onsystem-agent-rules -->';
const read = (root: string, file: string) => fs.readFileSync(path.join(root, file), 'utf8');
/** The onsystem section of a file, markers included. */
const section = (text: string) => text.slice(text.indexOf(BEGIN), text.indexOf(END) + END.length);

describe('onsystem init: instructions for coding agents', () => {
  it('adds a marked section to the AGENTS.md of a create-next-app, when asked in a terminal', async () => {
    const root = fixture({ ...APP, 'AGENTS.md': NEXT_AGENTS, 'CLAUDE.md': NEXT_CLAUDE });
    const { code, stdout, asked } = await run(['init', '--no-cache'], root, ['']);
    expect(code).toBe(0);
    expect(asked).toEqual([
      'Add a short onsystem section to AGENTS.md, so coding agents check the UI they write? [Y/n] ',
    ]);
    const agents = read(root, 'AGENTS.md');
    // Next's rules stay as they were, and the section follows them.
    expect(agents.startsWith(`${NEXT_AGENTS}\n${BEGIN}\n`)).toBe(true);
    expect(agents.endsWith(`${END}\n`)).toBe(true);
    // Both forms: the MCP tools, and the CLI for agents without them.
    expect(section(agents)).toContain('run `check_ui` on it and fix every error');
    expect(section(agents)).toContain('`npx -y onsystem check <file>`');
    // CLAUDE.md imports AGENTS.md: the section is not written twice.
    expect(read(root, 'CLAUDE.md')).toBe(NEXT_CLAUDE);
    expect(stdout).toContain('Added an onsystem section to AGENTS.md');
    expect(stdout).toContain('Next: commit onsystem.config.json and AGENTS.md, and run');

    // A later run leaves a current section alone, without asking.
    const again = await run(['init', '--force', '--no-cache'], root, []);
    expect(again.asked).toEqual([]);
    expect(read(root, 'AGENTS.md')).toBe(agents);

    // An older section is replaced in place, once asked.
    fs.writeFileSync(
      path.join(root, 'AGENTS.md'),
      agents.replace(section(agents), `${BEGIN}\nAn older section.\n${END}`) + '\n# Mine\n',
    );
    const update = await run(['init', '--force', '--no-cache'], root, ['y']);
    expect(update.asked).toEqual(['Update the onsystem section in AGENTS.md? [Y/n] ']);
    const updated = read(root, 'AGENTS.md');
    expect(updated).toBe(`${agents}\n# Mine\n`);
    expect(updated.split(BEGIN)).toHaveLength(2);
    expect(update.stdout).toContain('Updated the onsystem section in AGENTS.md.');
  });

  it('writes CLAUDE.md when it does not import AGENTS.md, and asks once for both', async () => {
    const root = fixture({ ...APP, 'AGENTS.md': '# Agents\n', 'CLAUDE.md': '# Claude' });
    const { asked } = await run(['init', '--no-cache'], root, ['']);
    expect(asked).toEqual([
      'Add a short onsystem section to AGENTS.md and CLAUDE.md, so coding agents check the UI they write? [Y/n] ',
    ]);
    expect(read(root, 'AGENTS.md')).toMatch(/^# Agents\n\n<!-- BEGIN:onsystem-agent-rules -->\n/);
    expect(read(root, 'CLAUDE.md')).toMatch(/^# Claude\n\n<!-- BEGIN:onsystem-agent-rules -->\n/);
    expect(section(read(root, 'CLAUDE.md'))).toBe(section(read(root, 'AGENTS.md')));
  });

  it('keeps what follows a BEGIN marker whose END was deleted', async () => {
    const mine = `# Agents\n\n${BEGIN}\n## User notes\n\nkeep me\n`;
    const root = fixture({ ...APP, 'AGENTS.md': mine });
    // Without its END, the old BEGIN is no section: a new one is added, after the user's notes.
    const first = await run(['init', '--no-cache'], root, ['']);
    expect(first.asked).toEqual([
      'Add a short onsystem section to AGENTS.md, so coding agents check the UI they write? [Y/n] ',
    ]);
    const added = read(root, 'AGENTS.md');
    expect(added.startsWith(`${mine}\n${BEGIN}\n# Design system\n`)).toBe(true);
    expect(added.endsWith(`${END}\n`)).toBe(true);
    // The next run finds the new section current: nothing is asked, and the notes stay.
    const again = await run(['init', '--force', '--no-cache'], root, []);
    expect(again.asked).toEqual([]);
    expect(read(root, 'AGENTS.md')).toBe(added);

    // An older section after the stray BEGIN is the one updated, and the notes stay.
    fs.writeFileSync(
      path.join(root, 'AGENTS.md'),
      `${mine}\n${BEGIN}\nAn older section.\n${END}\n`,
    );
    const update = await run(['init', '--force', '--no-cache'], root, ['']);
    expect(update.asked).toEqual(['Update the onsystem section in AGENTS.md? [Y/n] ']);
    expect(read(root, 'AGENTS.md')).toBe(added);
  });

  it('writes nothing when declined, with --yes, without a terminal, or with neither file', async () => {
    const files = { ...APP, 'AGENTS.md': NEXT_AGENTS };
    const declined = fixture(files);
    const no = await run(['init', '--no-cache'], declined, ['n']);
    expect(no.asked).toHaveLength(1);
    expect(no.stdout).toContain('AGENTS.md was left as it is.');
    expect(read(declined, 'AGENTS.md')).toBe(NEXT_AGENTS);

    for (const [args, answers] of [
      [['init', '--yes', '--no-cache'], []],
      [['init', '--no-cache'], undefined],
    ] as const) {
      const root = fixture(files);
      const { code, asked } = await run([...args], root, answers && [...answers]);
      expect(code).toBe(0);
      expect(asked).toEqual([]);
      expect(read(root, 'AGENTS.md')).toBe(NEXT_AGENTS);
    }

    const none = fixture(APP);
    expect((await run(['init', '--no-cache'], none, [])).asked).toEqual([]);
    expect(fs.existsSync(path.join(none, 'AGENTS.md'))).toBe(false);
  });
});
