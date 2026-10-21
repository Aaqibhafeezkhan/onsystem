import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { parseCsv } from '../bench/v2/lib/stats.js';

// `run.mjs report`'s status colors table: for each color a prompt names, whether the file a run
// wrote kept its hue, used a chart or sidebar token instead, or neither. None of the benchmark's
// other checks could see the swap: tsc and @shadcn/lint accept chart tokens, and the blind
// labeller counted them as tokens.
const v2 = path.resolve(import.meta.dirname, '../bench/v2');
const standard = path.join(v2, 'results/standard');
const read = (file: string) => fs.readFileSync(file, 'utf8');

const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

const TASKS = {
  'settings-card': { repo: 'chatbot', file: 'components/chat/model-settings-card.tsx' },
  'release-badges': { repo: 'shadcn-website', file: 'apps/v4/components/release-badges.tsx' },
  'rate-limit-alert': { repo: 'chatbot', file: 'components/chat/rate-limit-alert.tsx' },
  'invite-member-form': {
    repo: 'saas-starter',
    file: 'app/(dashboard)/dashboard/team/invite-member-form.tsx',
  },
} as const;

/** A results folder with one run per entry: its arm, task and the file it wrote. */
function results(runs: [arm: string, task: keyof typeof TASKS, code: string][]): string {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'bench-v2-status-'));
  dirs.push(out);
  runs.forEach(([arm, task, code], i) => {
    const { repo, file } = TASKS[task];
    const id = `m${String(i)}--${arm}--${repo}--${task}--r1`;
    fs.mkdirSync(path.dirname(path.join(out, 'runs', id, 'files', file)), { recursive: true });
    fs.writeFileSync(path.join(out, 'runs', id, 'files', file), code);
    fs.writeFileSync(
      path.join(out, 'runs', id, 'result.json'),
      JSON.stringify({
        id,
        provider: 'mock',
        model: `m${String(i)}`,
        tier: 'small',
        arm,
        repo,
        task,
        repeat: 1,
        status: 'done',
        created: true,
        file,
        tscPass: true,
        tscErrors: 0,
        onsystemErrors: 0,
        onsystemWarnings: 0,
        onsystemFindings: [],
        outOfScope: 0,
        cost: 0,
        calls: 1,
        inputTokens: 0,
        outputTokens: 0,
        seconds: 1,
        hookBlocks: 0,
        mcpCalls: 0,
        skillLoads: 0,
      }),
    );
  });
  return out;
}

const run = (...args: string[]) =>
  execFileSync(process.execPath, [path.join(v2, 'run.mjs'), ...args], { stdio: 'pipe' });
const table = (out: string) => {
  const md = read(path.join(out, 'results.md'));
  return md
    .slice(md.indexOf('\n## Status colors\n'))
    .split('\n')
    .filter((line) => /^\| (?:none|skill|mcp|hook|all) \|/.test(line));
};

describe('bench/v2 report: status colors', () => {
  it('scores each color a prompt names: kept, a chart token instead, or neither', () => {
    const out = results([
      // A palette green, then the chart-2 swap, then a gray badge.
      ['none', 'settings-card', `<span className="bg-green-100 text-green-800">Connected</span>`],
      [
        'all',
        'settings-card',
        `<Badge className="text-chart-2" variant="outline">Connected</Badge>`,
      ],
      ['hook', 'settings-card', `<Badge variant="secondary">Connected</Badge>`],
      // Green, blue and amber: a status token, a variant named for the hue, a palette shade.
      [
        'none',
        'release-badges',
        `const tone = { New: "text-success", Updated: "blue", Deprecated: "bg-amber-100/50" }`,
      ],
      // Blue and amber kept, green swapped: the run still counts the chart token for green.
      [
        'mcp',
        'release-badges',
        `<><Badge className="border-chart-2">New</Badge><Badge className="dark:text-blue-400" /><Badge className="text-yellow-700" /></>`,
      ],
      // Red, as a variant; a state compared or typed is not a color.
      ['none', 'rate-limit-alert', `<Alert variant="destructive">Rate limited</Alert>`],
      [
        'all',
        'rate-limit-alert',
        `type S = "error" | "idle"; const ok = (s: S) => s === "error" ? "Retry" : "Wait"`,
      ],
      // No color asked for: not counted.
      ['none', 'invite-member-form', `<Button>Invite member</Button>`],
    ]);
    run('report', '--out', out);
    expect(table(out)).toEqual([
      '| none | 3 | 5 | 5/5 100% [57%, 100%] | 0 | 0 |',
      '| mcp | 1 | 3 | 2/3 67% [21%, 94%] | 1 | 0 |',
      '| hook | 1 | 1 | 0/1 0% [0%, 79%] | 0 | 1 |',
      '| all | 2 | 2 | 0/2 0% [0%, 66%] | 1 | 1 |',
    ]);
    const { statusColors } = JSON.parse(read(path.join(out, 'results.json'))) as {
      statusColors: { arm: string; asked: number; kept: number; scoped: number }[];
    };
    expect(statusColors.map((r) => [r.arm, r.asked, r.kept, r.scoped])).toEqual([
      ['none', 5, 5, 0],
      ['mcp', 3, 2, 1],
      ['hook', 1, 0, 0],
      ['all', 2, 0, 1],
    ]);
  });

  it('adds the role columns to the labelling sheet, and their table once filled', () => {
    const out = results([
      ['none', 'settings-card', `<span className="text-green-600">Connected</span>`],
      ['all', 'settings-card', `<Badge className="text-chart-2">Connected</Badge>`],
    ]);
    run('labels', '--out', out, '--per-cell', '1');
    const sheet = read(path.join(out, 'labels/labels.csv'));
    const columns = sheet.split('\n')[0]?.split(',');
    expect(columns?.slice(columns.indexOf('unnamed_controls'))).toEqual([
      'unnamed_controls',
      'token_role_misuse',
      'task_meaning_kept',
      'would_merge',
      'notes',
    ]);
    const key = JSON.parse(read(path.join(out, 'labels/key.json'))) as Record<
      string,
      { arm: string }
    >;
    const filled = parseCsv(sheet).map((row) => {
      const all = key[row.sample_id ?? '']?.arm === 'all';
      const cells = {
        ...row,
        token_role_misuse: all ? '1' : '',
        task_meaning_kept: all ? 'partly' : 'yes',
        would_merge: all ? 'no' : 'yes',
      };
      return Object.values(cells)
        .map((v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v))
        .join(',');
    });
    fs.writeFileSync(
      path.join(out, 'labels/labels.csv'),
      [sheet.split('\n')[0], ...filled, ''].join('\n'),
    );
    run('report', '--out', out);
    const md = read(path.join(out, 'results.md'));
    expect(md).toContain(
      [
        '| Arm | Files | Token used for another role | Task kept: yes / partly / no |',
        '| --- | --: | --: | --: |',
        '| none | 1 | 0/1 0% [0%, 79%] | 1 / 0 / 0 |',
        '| all | 1 | 1/1 100% [21%, 100%] | 0 / 1 / 0 |',
      ].join('\n'),
    );
    expect(md).not.toContain('\n\n\n');
  });

  it('on the committed runs: every arm with onsystem swapped some colors for chart tokens', () => {
    // The runs, without their transcripts or other results, in a folder of their own: report
    // writes results.md there.
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'bench-v2-status-standard-'));
    dirs.push(out);
    fs.cpSync(path.join(standard, 'runs'), path.join(out, 'runs'), { recursive: true });
    run('report', '--out', out);
    expect(table(out)).toEqual([
      '| none | 104 | 161 | 161/161 100% [98%, 100%] | 0 | 0 |',
      '| skill | 101 | 156 | 146/156 94% [89%, 96%] | 10 | 0 |',
      '| mcp | 103 | 158 | 121/158 77% [69%, 83%] | 37 | 0 |',
      '| hook | 104 | 159 | 139/159 87% [81%, 92%] | 16 | 4 |',
      '| all | 104 | 159 | 125/159 79% [72%, 84%] | 28 | 6 |',
    ]);
  });
});
