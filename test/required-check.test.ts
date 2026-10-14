import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { onChangedLines, parseDiff } from '../action/check.mjs';
import type { DesignSystem } from '../src/design-system.js';
import { DEMO_ROOT, fixture, loadOnce } from './helpers.js';

// What the Action's changed-lines gate (action/check.mjs) reports when a pull request removes a
// button's accessible name, and whether docs/required-check.md says so: the demo's design system
// checks the file after the change, git diff gives the changed lines with the Action's own flags,
// and onChangedLines splits the findings the way the Action does.

const RULE = 'icon-button-accessible-name';
const FILE = 'app/row-actions.tsx';

let ds: DesignSystem;
beforeAll(async () => {
  ds = await loadOnce(DEMO_ROOT);
});

function git(cwd: string, ...args: string[]): string {
  const result = spawnSync(
    'git',
    [
      '-c',
      'user.name=onsystem test',
      '-c',
      'user.email=test@example.com',
      '-c',
      'commit.gpgsign=false',
      '-c',
      'init.defaultBranch=main',
      ...args,
    ],
    { cwd, encoding: 'utf8' },
  );
  if (result.status !== 0) throw new Error(`git ${args.join(' ')}: ${result.stderr}`);
  return result.stdout;
}

/** A component that returns `jsx`. */
function component(jsx: string[]): string {
  return [
    'import { Trash2 } from "lucide-react"',
    '',
    'import { Button } from "@/components/ui/button"',
    '',
    'export function RowActions({ onDelete }: { onDelete: () => void }) {',
    '  return (',
    ...jsx.map((line) => `    ${line}`),
    '  )',
    '}',
    '',
  ].join('\n');
}

/** The accessible-name findings on `after`, split into what the Action reports and what it leaves out. */
function gate(before: string[], after: string[]) {
  const root = fixture({ [FILE]: component(before) });
  git(root, 'init', '--quiet');
  git(root, 'add', '.');
  git(root, 'commit', '--quiet', '--no-verify', '-m', 'base');
  fs.writeFileSync(path.join(root, FILE), component(after));
  const diff = git(
    root,
    '-c',
    'core.quotePath=false',
    'diff',
    '--no-color',
    '--no-ext-diff',
    '--no-relative',
    '--find-renames',
    '--unified=0',
    '--src-prefix=a/',
    '--dst-prefix=b/',
    'HEAD',
    '--',
  );
  const named = (lines: string[]) =>
    ds
      .check(component(lines), FILE)
      .diagnostics.filter((d) => d.ruleId === RULE)
      .map((d) => ({ ...d, file: FILE }));
  // The pull request is what takes the name away.
  expect(named(before)).toEqual([]);
  expect(named(after)).toHaveLength(1);
  return onChangedLines(named(after), parseDiff(diff));
}

/** `lines` without the ones `drop` matches. */
const without = (lines: string[], drop: RegExp) => lines.filter((line) => !drop.test(line));

describe('the changed-lines gate on a removed accessible name', () => {
  it('catches it when the tag is on one line, or the name sat on the line after the tag name', () => {
    const oneLine = (label: string) => [
      `<Button variant="ghost" size="icon"${label} onClick={onDelete}>`,
      '  <Trash2 />',
      '</Button>',
    ];
    expect(gate(oneLine(' aria-label="Delete row"'), oneLine(''))).toMatchObject({
      reported: [{ ruleId: RULE, line: 7 }],
      outside: [],
    });

    const labelFirst = [
      '<Button',
      '  aria-label="Delete row"',
      '  variant="ghost"',
      '  size="icon"',
      '  onClick={onDelete}',
      '>',
      '  <Trash2 />',
      '</Button>',
    ];
    expect(gate(labelFirst, without(labelFirst, /aria-label/))).toMatchObject({
      reported: [{ ruleId: RULE, line: 7 }],
      outside: [],
    });
  });

  it('misses it further down a multi-line tag, and below the icon', () => {
    // Prettier puts each attribute of a long tag on its own line. The finding is on the
    // `<Button` line; a deletion counts only the lines either side of it.
    const prettier = [
      '<Button',
      '  variant="ghost"',
      '  size="icon"',
      '  aria-label="Delete row"',
      '  onClick={onDelete}',
      '>',
      '  <Trash2 />',
      '</Button>',
    ];
    expect(gate(prettier, without(prettier, /aria-label/))).toMatchObject({
      reported: [],
      outside: [{ ruleId: RULE, line: 7 }],
    });

    const srOnly = [
      '<Button variant="ghost" size="icon" onClick={onDelete}>',
      '  <Trash2 />',
      '  <span className="sr-only">Delete row</span>',
      '</Button>',
    ];
    expect(gate(srOnly, without(srOnly, /sr-only/))).toMatchObject({
      reported: [],
      outside: [{ ruleId: RULE, line: 7 }],
    });
  });

  it("matches docs/required-check.md's example of a removal the check passes", () => {
    const doc = fs.readFileSync(
      path.join(import.meta.dirname, '..', 'docs/required-check.md'),
      'utf8',
    );
    const example = /^```diff\n([\s\S]*?)\n```$/m.exec(doc)?.[1];
    expect(example, 'docs/required-check.md shows no deletion the check passes').toBeDefined();
    const lines = (example ?? '').split('\n');
    const side = (keep: string) =>
      lines.filter((line) => line[0] === ' ' || line[0] === keep).map((line) => line.slice(1));
    const { reported, outside } = gate(side('-'), side('+'));
    expect(reported).toEqual([]);
    expect(outside).toHaveLength(1);
  });
});
