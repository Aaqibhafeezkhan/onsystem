import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { main, type Io } from '../src/cli.js';
import { DEMO_ROOT } from './helpers.js';

const REPO = path.resolve(import.meta.dirname, '..');
const SKILL = 'skills/onsystem/SKILL.md';
// `npx skills add dgesteves/onsystem` installs the source; the other packages carry copies.
const SOURCE = 'plugins/onsystem';
const COPIES = ['plugins/onsystem-agent', 'plugins/onsystem-cursor'];
const text = fs.readFileSync(path.join(REPO, SOURCE, SKILL), 'utf8');
const skill = text.replace(/\r\n/g, '\n');

/** Every `npx -y onsystem …` command the skill names, as CLI arguments. */
const commands = [...skill.matchAll(/`npx -y onsystem ([^`]+)`/g)].map(([, args = '']) =>
  args.split(' '),
);
function command(name: string): string[] {
  const args = commands.find(([first]) => first === name);
  if (!args) throw new Error(`The skill names no \`npx -y onsystem ${name}\` command.`);
  return args;
}

async function run(args: string[], file: string) {
  const out: string[] = [];
  const err: string[] = [];
  const io: Io = {
    cwd: DEMO_ROOT,
    color: false,
    stdout: (t) => out.push(t),
    stderr: (t) => err.push(t),
  };
  // `--no-cache` only skips the on-disk cache, which other tests read from the demo too.
  const argv = [...args.map((arg) => (arg === '<file>' ? file : arg)), '--no-cache'];
  const code = await main(argv, io);
  return { code, stdout: out.join('\n'), stderr: err.join('\n') };
}

// An agent that has the skill but not the MCP server (`npx skills add`, the route the README
// gives other agents) can still run shell commands: the skill has to name them.
describe('the skill without the MCP tools', () => {
  it('says what to run instead, only when the tools are not available', () => {
    expect(skill).toContain('\n## Without the MCP tools\n');
    const section = skill.slice(skill.indexOf('## Without the MCP tools'));
    expect(section).toMatch(
      /^## Without the MCP tools\n\nIf the onsystem MCP tools are not available/,
    );
    expect(commands.map((args) => args.join(' '))).toEqual([
      'inspect',
      'export --format design-md',
      'check <file> --format json',
    ]);
    // Each command sits in that section, next to the tool it stands in for.
    for (const [args, tool] of [
      ['inspect', 'list_components'],
      ['export --format design-md', 'get_tokens'],
      ['check <file> --format json', 'check_ui'],
    ] as const) {
      expect(section).toContain(`\`npx -y onsystem ${args}\` in place of \`${tool}\``);
    }
    // Every package carries the same text.
    for (const pkg of COPIES) {
      expect(fs.readFileSync(path.join(REPO, pkg, SKILL), 'utf8'), pkg).toBe(text);
    }
  });

  it('names commands that list the components and tokens', async () => {
    const inspect = await run(command('inspect'), '');
    expect(inspect.code).toBe(0);
    expect(inspect.stdout).toMatch(/^ {2}Button +<button> · 3 props · variant\[6\] size\[4\]/m);

    const tokens = await run(command('export'), '');
    expect(tokens.code).toBe(0);
    expect(tokens.stdout).toContain('| `destructive` |');
    expect(tokens.stdout).toContain('`bg-destructive`');
  });

  it('names a check that fails on errors, with each fix, and passes a clean file', async () => {
    const args = command('check');
    const draft = await run(args, 'app/settings/danger-zone.tsx');
    expect(draft.code).toBe(1);
    const [result] = JSON.parse(draft.stdout) as {
      file: string;
      diagnostics: { ruleId: string; severity: string; line: number; suggestion?: string }[];
    }[];
    expect(result?.file).toBe('app/settings/danger-zone.tsx');
    expect(result?.diagnostics).toContainEqual(
      expect.objectContaining({
        ruleId: 'no-hardcoded-color',
        severity: 'error',
        line: 11,
        suggestion: 'border-destructive',
      }),
    );
    expect(result?.diagnostics).toContainEqual(
      expect.objectContaining({ ruleId: 'no-unknown-variant', severity: 'error', line: 18 }),
    );

    const clean = await run(args, 'app/settings/members.tsx');
    expect(clean.code).toBe(0);
    expect(JSON.parse(clean.stdout)).toEqual([
      expect.objectContaining({ file: 'app/settings/members.tsx', diagnostics: [] }),
    ]);
  });
});
