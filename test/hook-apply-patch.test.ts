import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { main, type Io } from '../src/cli.js';
import { fixture } from './helpers.js';

const HOOK = path.resolve(import.meta.dirname, '../plugins/onsystem/hooks/check-ui.mjs');

// Stands in for the CLI: `check <files…> --format json` reports an error on every line of each
// file with an arbitrary color, named as the CLI names files, relative to the folder it runs in.
// With STUB_ANSWER set, it prints that answer instead, which a test gets from the real CLI.
const STUB = `import fs from 'node:fs';
import path from 'node:path';
fs.appendFileSync(path.join(import.meta.dirname, 'runs.log'), JSON.stringify(process.argv.slice(2)) + '\\n');
if (process.env.STUB_ANSWER) {
  const answer = JSON.parse(fs.readFileSync(process.env.STUB_ANSWER, 'utf8'));
  process.stdout.write(answer.stdout);
  process.exit(answer.code);
}
const args = process.argv.slice(3);
const files = args.slice(0, args.indexOf('--format'));
const results = files.map((target) => {
  const diagnostics = fs.readFileSync(target, 'utf8').split(/\\r?\\n/).flatMap((text, i) => {
    const at = text.indexOf('bg-[#');
    if (at === -1) return [];
    const value = text.slice(at, text.indexOf(']', at) + 1);
    return [{ ruleId: 'no-hardcoded-color', severity: 'error', message: 'Hardcoded color \`' + value + '\`.', line: i + 1, column: at + 1 }];
  });
  const file = path.relative(process.cwd(), path.resolve(target)).split(path.sep).join('/');
  return { file, diagnostics };
});
console.log(JSON.stringify(results));
process.exit(results.some((r) => r.diagnostics.length) ? 1 : 0);
`;

// An older finding on line 3; the button on line 5 is what the patch below changes.
const CARD = [
  'export function SettingsCard() {',
  '  return (',
  '    <div className="rounded bg-[#fafafa] p-4">',
  '      <h2 className="text-lg">Settings</h2>',
  '      <button className="bg-[#2563eb] text-white">Save</button>',
  '    </div>',
  '  );',
  '}',
  '',
];

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

const BANNER = [
  'export function Banner() {',
  '  return <p className="bg-[#f59e0b] px-2">Sale</p>;',
  '}',
  '',
];

/** A Codex apply_patch, as its PostToolUse input carries it in `tool_input.command`. */
const patch = (...sections: string[]) =>
  ['*** Begin Patch', ...sections, '*** End Patch'].join('\n');
/** The hunk that turned the card's button from bg-primary into a hardcoded color. */
const CARD_HUNK = [
  `@@ ${CARD[0]}`,
  ` ${CARD[3]}`,
  '-      <button className="bg-primary text-white">Save</button>',
  `+${CARD[4]}`,
  ` ${CARD[5]}`,
].join('\n');
const add = (file: string, lines: string[]) =>
  [`*** Add File: ${file}`, ...lines.slice(0, -1).map((l) => `+${l}`)].join('\n');

describe('check-ui hook: a Codex apply_patch', () => {
  const project = fixture({
    'stub.mjs': STUB,
    'package.json': '{"name":"app"}',
    'app/settings-card.tsx': CARD.join('\n'),
    'app/toolbar.tsx': TOOLBAR.join('\n'),
    'app/banner.tsx': BANNER.join('\n'),
    'app/moved/banner.tsx': BANNER.join('\n'),
    'app/notes.md': 'bg-[#000000]\n',
    // A design system, for the real CLI: components and the colors above as tokens.
    'components/ui/button.tsx':
      'export function Button(props: React.ComponentProps<"button">) { return <button {...props} /> }\n',
    'app/globals.css': ':root { --primary: #2563eb; --muted: #fafafa; --warning: #f59e0b; }\n',
  });
  const runs = path.join(project, 'runs.log');

  function hook(toolInput: Record<string, unknown>, tool = 'apply_patch', answer?: string) {
    fs.rmSync(runs, { force: true });
    const payload = {
      session_id: 'codex-session',
      hook_event_name: 'PostToolUse',
      tool_name: tool,
      tool_use_id: 'call-apply-patch',
      cwd: project,
      tool_input: toolInput,
      tool_response: 'Success. Updated the following files:',
    };
    const run = spawnSync(process.execPath, [HOOK], {
      input: JSON.stringify(payload),
      encoding: 'utf8',
      env: {
        ...process.env,
        ONSYSTEM_BIN: path.join(project, 'stub.mjs'),
        STUB_ANSWER: answer ?? '',
      },
    });
    const started = fs.existsSync(runs)
      ? fs
          .readFileSync(runs, 'utf8')
          .trim()
          .split('\n')
          .map((line) => JSON.parse(line) as string[])
      : [];
    return { code: run.status, stdout: run.stdout, stderr: run.stderr, started };
  }
  const silent = { code: 0, stdout: '', stderr: '', started: [] };
  const context = (stdout: string) =>
    (JSON.parse(stdout) as { hookSpecificOutput: { additionalContext: string } }).hookSpecificOutput
      .additionalContext;

  it('checks the file an Update File names, held to the lines its hunks changed', () => {
    // The finding's repro: an absolute path, as Codex may write it.
    for (const file of [path.join(project, 'app/settings-card.tsx'), 'app/settings-card.tsx']) {
      const { code, stdout, stderr } = hook({
        command: patch(`*** Update File: ${file}`, CARD_HUNK),
      });
      expect(code).toBe(2);
      expect(stdout).toBe('');
      expect(stderr).toBe(
        "app/settings-card.tsx: this change breaks the project's design system (onsystem check). Fix these errors before moving on; get_component and get_tokens list the valid props, variants and tokens.\n\n" +
          '5:26 error [no-hardcoded-color] Hardcoded color `bg-[#2563eb]`.\n' +
          '(1 other finding elsewhere in the file predate this edit; leave them unless asked.)\n',
      );
    }
    // A hunk that changes a clean line says nothing about the older finding.
    const heading = hook({
      command: patch(
        '*** Update File: app/settings-card.tsx',
        ['@@', `-      <h2>Settings</h2>`, `+${CARD[3]}`].join('\n'),
      ),
    });
    expect(heading).toEqual({ ...silent, started: [expect.any(Array)] });
  });

  it('checks a file the patch adds as a whole, and a moved file where it moved to', () => {
    const added = hook({ command: patch(add('app/banner.tsx', BANNER)) });
    expect(added.code).toBe(2);
    expect(added.stderr).toContain('app/banner.tsx: this change breaks');
    expect(added.stderr).toContain('2:24 error [no-hardcoded-color]');
    const moved = hook({
      command: patch(
        '*** Update File: app/banner.tsx',
        '*** Move to: app/moved/banner.tsx',
        '@@',
        '-  return <p className="px-2">Sale</p>;',
        `+${BANNER[1]}`,
      ),
    });
    expect(moved.code).toBe(2);
    expect(moved.stderr).toMatch(/^app\/moved\/banner\.tsx: this change breaks/);
    expect(moved.started).toEqual([
      expect.arrayContaining([`.${path.sep}${path.join('app', 'moved', 'banner.tsx')}`]),
    ]);
  });

  it('checks every UI file of a patch in one run, and names each one', () => {
    const both = hook({
      command: patch(
        add('app/banner.tsx', BANNER),
        '*** Update File: app/settings-card.tsx',
        CARD_HUNK,
        '*** Update File: app/notes.md',
        '@@',
        '+bg-[#000000]',
        '*** Delete File: app/old.tsx',
      ),
    });
    expect(both.code).toBe(2);
    expect(both.started).toHaveLength(1);
    expect(both.started[0]?.slice(0, 3)).toEqual([
      'check',
      `.${path.sep}${path.join('app', 'banner.tsx')}`,
      `.${path.sep}${path.join('app', 'settings-card.tsx')}`,
    ]);
    const [banner, card] = both.stderr.split('\n\n').filter((s) => s.includes('this change'));
    expect(banner).toMatch(/^app\/banner\.tsx: this change breaks/);
    expect(both.stderr).toContain(
      '\n2:24 error [no-hardcoded-color] Hardcoded color `bg-[#f59e0b]`.',
    );
    expect(card).toMatch(/^app\/settings-card\.tsx: this change breaks/);
    expect(both.stderr).toContain(
      '\n5:26 error [no-hardcoded-color] Hardcoded color `bg-[#2563eb]`.',
    );
    expect(both.stderr).not.toMatch(/^3:\d+ error/m);
  });

  it('leaves a patch alone when it changes no .tsx or .jsx file it can check', () => {
    for (const command of [
      patch('*** Update File: app/notes.md', '@@', '+bg-[#000000]'),
      patch('*** Delete File: app/settings-card.tsx'),
      '',
    ]) {
      expect(hook({ command })).toEqual(silent);
    }
    expect(hook({ command: 42 })).toEqual(silent);
    // A shell command is not a patch, even when it names a file.
    expect(hook({ command: 'cat app/settings-card.tsx' }, 'Bash')).toEqual(silent);
  });

  it('passes the findings on as a note when it cannot tell which lines a hunk changed', () => {
    // A closing brace: `}` is on lines 2 to 4 too, each with an older error.
    const brace = hook({
      command: patch('*** Update File: app/toolbar.tsx', ['@@', '-};', '+}'].join('\n')),
    });
    expect(brace.code).toBe(0);
    expect(brace.stderr).toBe('');
    expect(context(brace.stdout)).toContain('could not tell which lines it changed');
  });

  it('reads the file from path or filePath, as other clients name it', () => {
    // A file written whole.
    const created = hook({ path: path.join(project, 'app/banner.tsx'), file_text: '' }, 'create');
    expect(created.code).toBe(2);
    expect(created.stderr).toContain('2:24 error');
    // An edit, held to the lines it changed.
    const edited = hook(
      {
        filePath: path.join(project, 'app/settings-card.tsx'),
        oldString: '      <button className="bg-primary text-white">Save</button>',
        newString: CARD[4],
      },
      'replace_string_in_file',
    );
    expect(edited.code).toBe(2);
    expect(edited.stderr).toContain('5:26 error');
    expect(edited.stderr).not.toMatch(/^3:\d+ error/m);
    // A tool that reads the file names it the same way: it is not checked.
    const card = path.join(project, 'app/settings-card.tsx');
    expect(hook({ filePath: card, startLine: 1, endLine: 9 }, 'read_file')).toEqual(silent);
    expect(hook({ path: card }, 'view')).toEqual(silent);
  });

  it("finds each file's findings in the real CLI's answer", async () => {
    // The command the hook ran for a patch of two files, run by the real CLI in that folder.
    const command = patch(
      '*** Update File: app/settings-card.tsx',
      CARD_HUNK,
      add('app/banner.tsx', BANNER),
    );
    const [args] = hook({ command }).started;
    const out: string[] = [];
    const io: Io = { cwd: project, color: false, stdout: (t) => out.push(t), stderr: () => {} };
    const code = await main([...(args ?? []), '--no-cache'], io);
    const real = JSON.parse(out.join('\n')) as { file: string }[];
    // In its own order, not the order it was given them.
    expect(real.map((r) => r.file)).toEqual(['app/banner.tsx', 'app/settings-card.tsx']);
    const answer = path.join(project, 'answer.json');
    fs.writeFileSync(answer, JSON.stringify({ stdout: out.join('\n'), code }));
    const { stderr } = hook({ command }, 'apply_patch', answer);
    expect(stderr).toMatch(/^app\/settings-card\.tsx: this change breaks/);
    expect(stderr).toMatch(/^5:\d+ error \[no-hardcoded-color\]/m);
    expect(stderr).not.toMatch(/^3:\d+ error/m);
    expect(stderr).toContain('\n\napp/banner.tsx: this change breaks');
    expect(stderr).toContain('2:24 error [no-hardcoded-color]');
  });
});
