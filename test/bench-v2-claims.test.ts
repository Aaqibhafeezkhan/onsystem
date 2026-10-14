import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

// What bench/v2's text says its numbers cannot show: the onsystem version that scored them, that
// onsystem counts the errors its own MCP server and hook feed back, where agents swapped a
// status color for a chart token, and how small the blind sample is. Every number it quotes is
// recomputed here from the committed runs and labels, as test/readme.test.ts does for the README.
const root = path.resolve(import.meta.dirname, '..');
const v2 = path.join(root, 'bench/v2');
const out = path.join(v2, 'results/standard');
const read = (file: string) => fs.readFileSync(file, 'utf8');
const flat = (text: string) => text.replace(/\s+/g, ' ');

const readme = read(path.join(v2, 'README.md'));
const threats = flat(
  readme.slice(readme.indexOf('### Threats to validity'), readme.indexOf('## Sizes')),
);
// Caveats written by hand, which `run.mjs report` puts into results.md.
const notesFile = path.join(out, 'notes.md');
const notes = fs.existsSync(notesFile) ? read(notesFile) : '';
const info = JSON.parse(read(path.join(out, 'run-info.json'))) as { onsystem: string };

interface Result {
  arm: string;
  repo: string;
  task: string;
  onsystemErrors: number;
  outOfScope: number;
}
const runs = fs.readdirSync(path.join(out, 'runs')).map((id) => {
  const dir = path.join(out, 'runs', id);
  const files = path.join(dir, 'files');
  const text = fs.existsSync(files)
    ? fs
        .readdirSync(files, { recursive: true, encoding: 'utf8' })
        .map((file) => path.join(files, file))
        .filter((file) => fs.statSync(file).isFile())
        .map(read)
        .join('\n')
    : '';
  return { ...(JSON.parse(read(path.join(dir, 'result.json'))) as Result), text };
});

describe('bench/v2 results', () => {
  it('report puts notes.md under the opening line of results.md', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bench-v2-notes-'));
    try {
      const ids = fs
        .readdirSync(path.join(out, 'runs'))
        .filter((id) => id.startsWith('gpt-6.1-sol--') && id.includes('--settings-card--'));
      expect(ids.length).toBe(5);
      for (const id of ids) {
        fs.mkdirSync(path.join(tmp, 'runs', id), { recursive: true });
        fs.copyFileSync(
          path.join(out, 'runs', id, 'result.json'),
          path.join(tmp, 'runs', id, 'result.json'),
        );
      }
      fs.writeFileSync(path.join(tmp, 'notes.md'), 'A caveat the tables cannot show.\n');
      execFileSync(process.execPath, [path.join(v2, 'run.mjs'), 'report', '--out', tmp], {
        stdio: 'pipe',
      });
      const lines = read(path.join(tmp, 'results.md')).split('\n');
      expect(lines.slice(0, 2)).toEqual(['# Results: benchmark v2', '']);
      expect(lines.slice(3, 6)).toEqual(['', 'A caveat the tables cannot show.', '']);
      expect(lines[6]).toMatch(/^\| Model \| Arm \|/);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('results.md carries the notes, so a new report keeps them', () => {
    expect(notes).not.toBe('');
    const results = read(path.join(out, 'results.md'));
    expect(results).toContain(`\n\n${notes.trim()}\n\n| Model | Arm |`);
    expect(read(path.join(v2, 'run.mjs'))).toContain("'notes.md'");
    expect(readme).toContain('notes.md');
  });

  it('names the onsystem version that scored the runs, and what changed in dub since', () => {
    const results = flat(readme.slice(0, readme.indexOf('## What changes from v1')));
    expect(results).toContain(`**Results (2026-10-12, onsystem ${info.onsystem}):**`);
    expect(results).toContain(`as onsystem ${info.onsystem} counts them`);
    expect(flat(notes)).toContain(`They are onsystem ${info.onsystem}'s own count`);
    // 0.5.0 found no color tokens in dub; #107 reads dub's shared Tailwind config.
    const dubRow = readme.split('\n').find((line) => line.startsWith('| [dubinc/dub]'));
    expect(dubRow).toContain(`${info.onsystem}: no color tokens`);
    for (const text of [threats, flat(notes)]) {
      expect(text).toContain('[#107](https://github.com/dgesteves/onsystem/pull/107)');
      expect(text).toContain("re-scoring these outputs with it raises dub's count in every arm");
    }
  });

  it('says that onsystem counts the errors it feeds back, and that no run hid one', () => {
    const suppressed = runs.filter((r) => /onsystem-disable|eslint-disable/.test(r.text));
    const elsewhere = runs.filter((r) => r.outOfScope > 0);
    expect([suppressed.length, elsewhere.length]).toEqual([0, 0]);
    expect(threats).toContain(
      "The MCP server's `check_ui` and the hook give the agent the same errors that `onsystem check` counts afterwards",
    );
    expect(threats).toContain(
      'No run added a suppression comment or changed a file other than its own.',
    );
  });

  it('counts the runs that used a chart token for a green status label', () => {
    // The two tasks that ask for a small green status label in a design system with no success
    // token: chatbot's and saas-starter's globals.css at the pinned commits define chart-1 to
    // chart-5 and no green or success color.
    const tasks = (
      JSON.parse(read(path.join(v2, 'config/tasks.json'))) as {
        tasks: { id: string; repo: string; prompt: string }[];
      }
    ).tasks;
    const green = [
      { repo: 'chatbot', task: 'settings-card' },
      { repo: 'saas-starter', task: 'plan-summary-card' },
    ];
    for (const { repo, task } of green) {
      expect(tasks.find((t) => t.id === task && t.repo === repo)?.prompt).toContain(
        "small green '",
      );
    }
    const inGreen = runs.filter((r) => green.some((g) => g.task === r.task && g.repo === r.repo));
    const chart = /\b(?:bg|text|border|fill|stroke|ring|outline|decoration)-chart-\d|--chart-\d/;
    const used = (arm: string) => {
      const list = inGreen.filter((r) => r.arm === arm);
      return `${String(list.filter((r) => chart.test(r.text)).length)} of ${String(list.length)}`;
    };
    const none = runs.filter((r) => r.arm === 'none');
    const errors = (list: Result[]) => list.reduce((n, r) => n + r.onsystemErrors, 0);
    const greenErrors = errors(none.filter((r) => inGreen.includes(r)));

    for (const text of [threats, flat(notes)]) {
      expect(text).toContain('`settings-card` (chatbot)');
      expect(text).toContain('`plan-summary-card` (saas-starter)');
      expect(text).toContain(
        `(${used('all')} runs with all three, ${used('none')} without onsystem), which onsystem counts as clean`,
      );
      expect(text).toContain(
        `Those two tasks hold ${String(greenErrors)} of the ${String(errors(none))} errors without onsystem.`,
      );
    }
  });

  it('says the blind sample is too small to settle the count, and what it found', () => {
    const key = JSON.parse(read(path.join(out, 'labels/key.json'))) as Record<
      string,
      { arm: string }
    >;
    const [header = '', ...rows] = read(path.join(out, 'labels/labels.csv')).trim().split('\n');
    const columns = header.split(',');
    // The sample id, the repository and the four counts come before any quoted cell.
    const labels = rows
      .filter((row) => /^S\d+,/.test(row))
      .map((row) => {
        const cells = row.split(',');
        const at = (name: string) => cells[columns.indexOf(name)] ?? '';
        return { id: at('sample_id'), repo: at('repo'), arm: key[at('sample_id')]?.arm, row };
      });
    const perArm = new Set(
      ['none', 'skill', 'mcp', 'hook', 'all'].map((a) => labels.filter((l) => l.arm === a).length),
    );
    expect(perArm.size).toBe(1);
    // In the hook and all arms, every file with a violation is a dub file whose violations are
    // all hardcoded values: the palette colors the labeller's notes name.
    const counts = (row: string) => {
      const m = /,(yes|no|partly),(\d+),(\d+),(\d+),(\d+),(yes|no),/.exec(row);
      expect(m, row.slice(0, 40)).not.toBeNull();
      return (m?.slice(2, 6) ?? []).map(Number);
    };
    const violating = labels.filter(
      (l) => (l.arm === 'hook' || l.arm === 'all') && counts(l.row).some((n) => n > 0),
    );
    expect(violating.length).toBeGreaterThan(0);
    for (const l of violating) {
      const [invented, hardcoded, native, unnamed] = counts(l.row);
      expect([l.id, l.repo, invented, native, unnamed], l.id).toEqual([l.id, 'dub', 0, 0, 0]);
      expect(hardcoded).toBeGreaterThan(0);
      expect(l.row).toMatch(/where dub (?:tokens fit|has)/);
    }
    for (const text of [threats, flat(notes)]) {
      expect(text).toContain(
        `${String([...perArm][0])} files per arm are too few to confirm or contradict`,
      );
      expect(text).toContain(
        'Every violation the labeller found with the hook or with all three is a palette color in a dub file where dub has a token',
      );
    }
  });

  it('says "no measurable change" in tsc pass rate, as the interval allows', () => {
    const { deltas } = JSON.parse(read(path.join(out, 'results.json'))) as {
      deltas: { model: string; arm: string; tscPass: { low: number; high: number } }[];
    };
    const tsc = deltas.find((d) => d.model === 'all models' && d.arm === 'all')?.tscPass;
    expect(tsc && tsc.low <= 0 && tsc.high >= 0).toBe(true);
    expect(readme).not.toContain('no change in `tsc` pass rate');
    expect(flat(readme)).toContain('with no measurable change in `tsc` pass rate (');
  });
});
