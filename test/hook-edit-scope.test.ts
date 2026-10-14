import { spawnSync } from 'node:child_process';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { fixture } from './helpers.js';

const HOOK = path.resolve(import.meta.dirname, '../plugins/onsystem/hooks/check-ui.mjs');

// Stands in for the CLI: an error on every line of the file with an arbitrary color, so the
// findings follow the file's content the way the real check's do.
const STUB = `import fs from 'node:fs';
const file = process.argv[3];
const diagnostics = fs.readFileSync(file, 'utf8').split(/\\r?\\n/).flatMap((text, i) => {
  const at = text.indexOf('bg-[#');
  if (at === -1) return [];
  const value = text.slice(at, text.indexOf(']', at) + 1);
  return [{ ruleId: 'no-hardcoded-color', severity: 'error', message: 'Hardcoded color \`' + value + '\`.', line: i + 1, column: at + 1 }];
});
console.log(JSON.stringify([{ file, diagnostics }]));
process.exit(diagnostics.length ? 1 : 0);
`;

// Older findings on lines 2 to 4, each of which also holds `}`.
const TOOLBAR = [
  'export function Toolbar() {',
  '  const save = <button className="bg-[#2563eb]" onClick={() => {}}>Save</button>;',
  '  const undo = <button className="bg-[#16a34a]" onClick={() => {}}>Undo</button>;',
  '  const redo = <button className="bg-[#dc2626]" onClick={() => {}}>Redo</button>;',
  '  return <div className="flex gap-2">{save}{undo}{redo}</div>;',
  '}',
  '',
];

const REVIEW = [
  'export function Review({ reject, accept }) {',
  '  return (',
  '    <div>',
  '      <button',
  '        className="rounded bg-[#dc2626] px-3"',
  '        onClick={reject}',
  '        title="Reject every hunk"',
  '      >',
  '        Reject',
  '      </button>',
  '      <button',
  '        onClick={accept}',
  '        className="rounded bg-[#16a34a] px-3"',
  '      >',
  '        Accept',
  '      </button>',
  '    </div>',
  '  );',
  '}',
  '',
];

const NOTE = [
  'export function Note({ label }) {',
  '  const tone = "bg-[#f59e0b]";',
  '  const title = label.trim();',
  '  return <p className="bg-[#111827]">{title}</p>;',
  '}',
  '',
];

describe('check-ui hook: what an Edit is held to', () => {
  const project = fixture({
    'stub.mjs': STUB,
    'package.json': '{"name":"app"}',
    'app/toolbar.tsx': TOOLBAR.join('\n'),
    'app/review.tsx': REVIEW.join('\n'),
    'app/note.tsx': NOTE.join('\r\n'),
  });

  function hook(file: string, input: Record<string, unknown>, response?: unknown) {
    const payload = {
      hook_event_name: 'PostToolUse',
      tool_name: 'Edit',
      cwd: project,
      tool_input: { file_path: path.join(project, 'app', file), ...input },
      ...(response === undefined ? {} : { tool_response: response }),
    };
    const run = spawnSync(process.execPath, [HOOK], {
      input: JSON.stringify(payload),
      encoding: 'utf8',
      env: { ...process.env, ONSYSTEM_BIN: path.join(project, 'stub.mjs') },
    });
    return { code: run.status, stdout: run.stdout, stderr: run.stderr };
  }
  const context = (stdout: string) =>
    (JSON.parse(stdout) as { hookSpecificOutput: { additionalContext: string } }).hookSpecificOutput
      .additionalContext;
  const silent = { code: 0, stdout: '', stderr: '' };
  /** A Claude Code structuredPatch hunk that turns `old` into REVIEW's line `at` (1-based). */
  const hunk = (at: number, old: string, line = REVIEW[at - 1]) => ({
    oldStart: at - 2,
    oldLines: 5,
    newStart: at - 2,
    newLines: 5,
    lines: [
      ` ${REVIEW[at - 3]}`,
      ` ${REVIEW[at - 2]}`,
      `-${old}`,
      `+${line}`,
      ` ${REVIEW[at]}`,
      ` ${REVIEW[at + 1]}`,
    ],
  });

  it('does not block on older findings when the new text is in the file more than once', () => {
    // A closing brace: `}` is on lines 2 to 4 too, each with an older error.
    const brace = hook('toolbar.tsx', { old_string: '};', new_string: '}' });
    expect(brace.code).toBe(0);
    expect(brace.stderr).toBe('');
    const note = context(brace.stdout);
    expect(note).toContain('could not tell which lines it changed');
    expect(note).toContain('2:35 error [no-hardcoded-color] Hardcoded color `bg-[#2563eb]`.');
    expect(note).toContain('4:35 error');
    // A distinctive line is placed, and is clean.
    expect(
      hook('toolbar.tsx', {
        old_string: '  return <div>{save}{undo}{redo}</div>;',
        new_string: TOOLBAR[4],
      }),
    ).toEqual(silent);
  });

  it('does not block on older findings when a formatter rewrote the new text', () => {
    // Claude wrote single quotes; the file has double quotes now.
    const quotes = hook('toolbar.tsx', {
      old_string: '  return <div>{save}{undo}{redo}</div>;',
      new_string: "  return <div className='flex gap-2'>{save}{undo}{redo}</div>;",
    });
    expect(quotes.code).toBe(0);
    expect(quotes.stderr).toBe('');
    expect(context(quotes.stdout)).toContain('2:35 error');
  });

  it('says nothing about an Edit that only removes text', () => {
    expect(hook('toolbar.tsx', { old_string: ' onClick={() => {}}', new_string: '' })).toEqual(
      silent,
    );
    expect(
      hook('review.tsx', {
        old_string: '        onClick={reject}\n        disabled\n',
        new_string: '        onClick={reject}\n',
      }),
    ).toEqual(silent);
  });

  it('finds the edit in a file with Windows line endings', () => {
    // Lines 3 and 4, sent with \n; the older error on line 2 is counted, not listed.
    const crlf = hook('note.tsx', {
      old_string: '  return <p>{label}</p>;',
      new_string: `${NOTE[2]}\n${NOTE[3]}`,
    });
    expect(crlf.code).toBe(2);
    expect(crlf.stderr).toContain('4:24 error');
    expect(crlf.stderr).not.toContain('2:17 error');
    expect(crlf.stderr).toContain('(1 other finding elsewhere in the file predate this edit');
  });

  it('does not blame the edit for unchanged lines it repeats around its change', () => {
    // Adds the title to the first button; its className line comes along unchanged.
    const title = hook('review.tsx', {
      old_string: [...REVIEW.slice(3, 6), REVIEW[7]].join('\n'),
      new_string: REVIEW.slice(3, 8).join('\n'),
    });
    expect(title).toEqual(silent);
    // Two changes with the unchanged className line between them.
    const around = hook('review.tsx', {
      old_string: [
        '      <button type="button"',
        REVIEW[4],
        '        onClick={() => reject()}',
      ].join('\n'),
      new_string: REVIEW.slice(3, 6).join('\n'),
    });
    expect(around).toEqual(silent);
    // A changed line between unchanged ones is the edit's.
    const color = hook('review.tsx', {
      old_string: [REVIEW[10], REVIEW[11], '        className="rounded bg-primary px-3"'].join(
        '\n',
      ),
      new_string: REVIEW.slice(10, 13).join('\n'),
    });
    expect(color.code).toBe(2);
    expect(color.stderr).toContain('13:28 error');
    expect(color.stderr).not.toContain('5:28 error');
  });

  it("places the edit from Claude Code's own diff when the new text is ambiguous", () => {
    const old = '        className="rounded bg-[#16a34a] px-4"';
    const input = { old_string: 'px-4"', new_string: 'px-3"' };
    // `px-3"` is on lines 5 and 13: without the diff, nothing blocks.
    const unplaced = hook('review.tsx', input);
    expect(unplaced.code).toBe(0);
    expect(context(unplaced.stdout)).toContain('5:28 error');
    // The diff says line 13.
    const placed = hook('review.tsx', input, {
      filePath: path.join(project, 'app/review.tsx'),
      structuredPatch: [hunk(13, old)],
    });
    expect(placed.code).toBe(2);
    expect(placed.stderr).toContain('13:28 error');
    expect(placed.stderr).not.toContain('5:28 error');
    // A diff the file no longer matches (a formatter ran) is not trusted.
    const stale = hook('review.tsx', input, {
      structuredPatch: [hunk(13, old, "        className='rounded bg-[#16a34a] px-3'")],
    });
    expect(stale.code).toBe(0);
    expect(context(stale.stdout)).toContain('5:28 error');
    // The closing brace, placed by the diff on its own clean line: nothing to say.
    const brace = {
      oldStart: 4,
      oldLines: 3,
      newStart: 4,
      newLines: 3,
      lines: [` ${TOOLBAR[3]}`, ` ${TOOLBAR[4]}`, '-};', '+}'],
    };
    expect(
      hook('toolbar.tsx', { old_string: '};', new_string: '}' }, { structuredPatch: [brace] }),
    ).toEqual(silent);
  });
});
