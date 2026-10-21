import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { changedLinesByPath, cli, run } from '../action/check.mjs';
import { main, type Io } from '../src/cli.js';
import { fixture } from './helpers.js';

// The required check and the baseline: a pull request that copies a baselined finding above the
// original used to pass, since the baseline accepted the copy and the leftover finding was on a
// line the pull request did not change. And the action ran its own version of the CLI through
// npx, not the one the project pins.

const repo = path.join(import.meta.dirname, '..');
const { version: VERSION } = JSON.parse(
  fs.readFileSync(path.join(repo, 'package.json'), 'utf8'),
) as { version: string };

// A stand-in for the CLI: keeps the changed lines it is given (STUB_KEEP), and prints what
// STUB_REPLAY holds with the exit code STUB_STATUS, or no results.
const STUB = `import fs from 'node:fs';
const lines = process.env.ONSYSTEM_CHANGED_LINES;
if (process.env.STUB_KEEP) {
  fs.writeFileSync(process.env.STUB_KEEP, lines ? fs.readFileSync(lines, 'utf8') : 'null');
}
if (process.env.STUB_RAN) fs.writeFileSync(process.env.STUB_RAN, process.argv[1]);
if (process.env.STUB_REPLAY) {
  process.stdout.write(fs.readFileSync(process.env.STUB_REPLAY, 'utf8'));
  process.exit(Number(process.env.STUB_STATUS ?? 0));
}
console.log('[]');
`;
const BIN = path.join(fixture({ 'stub.mjs': STUB }), 'stub.mjs');

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
  return result.stdout.trim();
}

function action(cwd: string, env: Record<string, string>) {
  const dir = fixture({});
  const out: string[] = [];
  const code = run({
    cwd,
    env: { GITHUB_OUTPUT: path.join(dir, 'output'), INPUT_PATHS: '.', ...env },
    stdout: (text: string) => out.push(text),
    stderr: () => {},
  });
  return { code, stdout: out.join('\n') };
}

/** A pull request event whose changes are measured from `base`. */
function pullRequest(base: string): Record<string, string> {
  const event = path.join(fixture({}), 'event.json');
  fs.writeFileSync(event, JSON.stringify({ pull_request: { base: { sha: base } } }));
  return { GITHUB_EVENT_NAME: 'pull_request', GITHUB_EVENT_PATH: event };
}

async function check(args: string[], cwd: string, env: Record<string, string> = {}) {
  const out: string[] = [];
  const err: string[] = [];
  const io: Io = {
    cwd,
    color: false,
    stdout: (t) => out.push(t),
    stderr: (t) => err.push(t),
    env,
  };
  const code = await main(args, io);
  return { code, stdout: out.join('\n'), stderr: err.join('\n') };
}

const BUTTON =
  'export function Button(props: React.ComponentProps<"button">) { return <button {...props} /> }';
const section = (text: string) => `    <section className="bg-[#f7f7f7]">${text}</section>`;
const page = (...sections: string[]) =>
  ['export const Page = () => (', '  <>', ...sections, '  </>', ')', ''].join('\n');

/**
 * A repository whose main has a page with two `bg-[#f7f7f7]` in the baseline, and a `feature`
 * branch that inserts a third above them, on line 3.
 */
async function copiedAbove() {
  const root = fixture({
    'components/ui/button.tsx': BUTTON,
    'app/globals.css': ':root { --primary: oklch(0.205 0 0); --muted: #f4f4f5; }',
    'app/page.tsx': page(section('a'), section('b')),
  });
  const recorded = await check(['check', '.', '--update-baseline', '--no-cache'], root);
  expect(recorded.stdout).toBe('Baseline: 2 findings in 1 file → onsystem.baseline.json');
  git(root, 'init', '--quiet');
  git(root, 'add', '.');
  git(root, 'commit', '--quiet', '--no-verify', '-m', 'base');
  const base = git(root, 'rev-parse', 'HEAD');
  git(root, 'checkout', '--quiet', '-b', 'feature');
  fs.writeFileSync(
    path.join(root, 'app/page.tsx'),
    page(section('new'), section('a'), section('b')),
  );
  git(root, 'commit', '--quiet', '--no-verify', '-am', 'copy the section');
  return { root, base };
}

describe('a finding copied above baselined ones', () => {
  it('is the one check reports when it is told which lines changed', async () => {
    const { root } = await copiedAbove();
    const lines = path.join(fixture({}), 'changed.json');
    fs.writeFileSync(
      lines,
      JSON.stringify({ [fs.realpathSync.native(path.join(root, 'app/page.tsx'))]: [[3, 3]] }),
    );
    const told = await check(['check', '.', '--no-cache', '--format', 'json'], root, {
      ONSYSTEM_CHANGED_LINES: lines,
    });
    expect(told.code).toBe(1);
    const results = JSON.parse(told.stdout) as {
      file: string;
      baselined: number;
      diagnostics: { line: number }[];
    }[];
    expect(results.map((r) => [r.file, r.baselined, r.diagnostics.map((d) => d.line)])).toEqual([
      ['app/page.tsx', 2, [3]],
    ]);

    // Without the changed lines, the count is the same and the baseline goes in file order.
    const plain = await check(['check', '.', '--no-cache', '--format', 'json'], root);
    expect(plain.code).toBe(1);
    expect((JSON.parse(plain.stdout) as typeof results)[0]?.diagnostics.map((d) => d.line)).toEqual(
      [5],
    );
  });

  it('fails the pull request in the GitHub Action, on the line it added', async () => {
    const { root, base } = await copiedAbove();
    const scratch = fixture({});
    const keep = path.join(scratch, 'changed.json');
    // The action, with a stand-in that keeps the changed lines it passes to check.
    action(root, { ...pullRequest(base), ONSYSTEM_BIN: BIN, STUB_KEEP: keep });
    const page = fs.realpathSync.native(path.join(root, 'app/page.tsx'));
    expect(JSON.parse(fs.readFileSync(keep, 'utf8'))).toEqual({ [page]: [[3, 3]] });

    // check with those lines, as the action runs it, and the action with what it printed.
    const checked = await check(['check', '.', '--format', 'json', '--no-cache'], root, {
      ONSYSTEM_CHANGED_LINES: keep,
    });
    const replay = path.join(scratch, 'results.json');
    fs.writeFileSync(replay, checked.stdout);
    const result = action(root, {
      ...pullRequest(base),
      ONSYSTEM_BIN: BIN,
      STUB_REPLAY: replay,
      STUB_STATUS: String(checked.code),
    });
    expect(result.code).toBe(1);
    expect(result.stdout).toContain('::error file=app/page.tsx,line=3,');
    expect(result.stdout).toContain(
      'onsystem: 1 error and 0 warnings on lines this pull request changed in 1 file checked.',
    );
  });

  it('passes no changed lines outside a pull request, or when every line is reported', () => {
    const root = fixture({ 'app/page.tsx': page(section('a')) });
    git(root, 'init', '--quiet');
    git(root, 'add', '.');
    git(root, 'commit', '--quiet', '--no-verify', '-m', 'base');
    const base = git(root, 'rev-parse', 'HEAD');
    const keep = path.join(fixture({}), 'changed.json');
    const events: Record<string, string>[] = [
      { GITHUB_EVENT_NAME: 'push' },
      { ...pullRequest(base), INPUT_ONLY_CHANGED_LINES: 'false' },
    ];
    for (const env of events) {
      action(root, { ...env, ONSYSTEM_BIN: BIN, STUB_KEEP: keep, ONSYSTEM_CHANGED_LINES: 'x' });
      expect(fs.readFileSync(keep, 'utf8')).toBe('null');
    }
  });

  it('names each file by its real path, as check finds it', () => {
    const root = fixture({ 'app/page.tsx': '', 'app/b c.tsx': '' });
    const link = `${root}-link`;
    fs.symlinkSync(root, link);
    try {
      const changed = new Map<string, [number, number][]>([
        ['app/page.tsx', [[1, 2]]],
        ['app/b c.tsx', [[4, 4]]],
      ]);
      expect(changedLinesByPath(changed, link)).toEqual({
        [fs.realpathSync.native(path.join(root, 'app/page.tsx'))]: [[1, 2]],
        [fs.realpathSync.native(path.join(root, 'app/b c.tsx'))]: [[4, 4]],
      });
    } finally {
      fs.rmSync(link);
    }
  });

  it('stops check when the changed lines cannot be read', async () => {
    const root = fixture({
      'components/ui/button.tsx': BUTTON,
      'app/globals.css': ':root { --muted: #f4f4f5; }',
      'app/page.tsx': page(section('a')),
    });
    await check(['check', '.', '--update-baseline', '--no-cache'], root);
    const bad = path.join(fixture({}), 'changed.json');
    for (const [content, message] of [
      [undefined, `ONSYSTEM_CHANGED_LINES: could not read ${bad}: `],
      ['[]', `ONSYSTEM_CHANGED_LINES: ${bad} must map files to line ranges`],
      [
        '{"app/page.tsx": [[1]]}',
        `ONSYSTEM_CHANGED_LINES: ${bad} › "app/page.tsx" must be a list of [start, end] lines`,
      ],
    ] as const) {
      if (content === undefined) fs.rmSync(bad, { force: true });
      else fs.writeFileSync(bad, content);
      const result = await check(['check', '.', '--no-cache'], root, {
        ONSYSTEM_CHANGED_LINES: bad,
      });
      expect(result.code).toBe(2);
      expect(result.stderr).toContain(message);
      // Outside the Action, the variable is left over: say what sets it and what to do.
      expect(result.stderr).toContain(
        'The GitHub Action sets this variable to a file of the lines a pull request changed; unset it when you run check yourself.',
      );
    }
  });
});

describe('a copy of a moved file whose new path the baseline does not record yet', () => {
  const legacy = (text: string) =>
    ['export const Old = () => (', '  <div>', section(text), '  </div>', ')', ''].join('\n');

  /**
   * Three commits: main records app/legacy/old.tsx in the baseline; a merged pull request renames
   * it to app/legacy/zzz.tsx and leaves the baseline as it was; a `feature` branch adds `added`,
   * with another copy of its finding on line 3.
   */
  async function renamedThenCopied(added: string) {
    const root = fixture({
      'components/ui/button.tsx': BUTTON,
      'app/globals.css': ':root { --primary: oklch(0.205 0 0); --muted: #f4f4f5; }',
      'app/legacy/old.tsx': legacy('old'),
    });
    await check(['check', '.', '--update-baseline', '--no-cache'], root);
    git(root, 'init', '--quiet');
    git(root, 'add', '.');
    git(root, 'commit', '--quiet', '--no-verify', '-m', 'base');
    git(root, 'mv', 'app/legacy/old.tsx', 'app/legacy/zzz.tsx');
    git(root, 'commit', '--quiet', '--no-verify', '-m', 'rename, without --prune-baseline');
    const base = git(root, 'rev-parse', 'HEAD');
    git(root, 'checkout', '--quiet', '-b', 'feature');
    fs.writeFileSync(path.join(root, added), legacy('new'));
    git(root, 'add', '.');
    git(root, 'commit', '--quiet', '--no-verify', '-m', 'copy the page');
    return { root, base };
  }

  // The renamed file keeps the entries: its finding is on a line the pull request did not
  // change. Before, the copy took them, by path order or by the old file's name.
  for (const added of ['app/aaa.tsx', 'app/old.tsx']) {
    it(`fails the pull request in the GitHub Action, on the copy (${added})`, async () => {
      const { root, base } = await renamedThenCopied(added);
      const scratch = fixture({});
      const keep = path.join(scratch, 'changed.json');
      action(root, { ...pullRequest(base), ONSYSTEM_BIN: BIN, STUB_KEEP: keep });
      expect(JSON.parse(fs.readFileSync(keep, 'utf8'))).toEqual({
        [fs.realpathSync.native(path.join(root, added))]: [[1, 5]],
      });

      const checked = await check(['check', '.', '--format', 'json', '--no-cache'], root, {
        ONSYSTEM_CHANGED_LINES: keep,
      });
      expect(checked.stderr).toContain(
        'Baseline: app/legacy/zzz.tsx has the findings recorded for app/legacy/old.tsx, which no longer exists, so they are accepted as moved.',
      );
      const replay = path.join(scratch, 'results.json');
      fs.writeFileSync(replay, checked.stdout);
      const result = action(root, {
        ...pullRequest(base),
        ONSYSTEM_BIN: BIN,
        STUB_REPLAY: replay,
        STUB_STATUS: String(checked.code),
      });
      expect(result.code).toBe(1);
      expect(result.stdout).toContain(`::error file=${added},line=3,`);
      expect(result.stdout).not.toContain('file=app/legacy/zzz.tsx');
      expect(result.stdout).toContain(
        'onsystem: 1 error and 0 warnings on lines this pull request changed in 2 files checked.',
      );
    });
  }
});

describe('a move whose findings are all on changed lines, after an earlier move of a file with the same finding', () => {
  const slate = (...texts: string[]) =>
    [
      'export const Legacy = () => (',
      '  <div>',
      ...texts.map((text) => `    <p className="text-slate-500">${text}</p>`),
      '  </div>',
      ')',
      '',
    ].join('\n');

  /**
   * Main records app/legacy/a.tsx with two `text-slate-500` and app/legacy/b.tsx with one; a
   * merged pull request renames b.tsx to b2.tsx and leaves the baseline as it was; a `feature`
   * branch moves a.tsx to a2.tsx and rewrites the text of both lines with the findings.
   */
  async function movedTwice() {
    const root = fixture({
      'components/ui/button.tsx': BUTTON,
      'app/globals.css': ':root { --primary: oklch(0.205 0 0); --muted: #f4f4f5; }',
      'app/legacy/a.tsx': slate('one', 'two'),
      'app/legacy/b.tsx': slate('bee'),
    });
    await check(['check', '.', '--update-baseline', '--no-cache'], root);
    git(root, 'init', '--quiet');
    git(root, 'add', '.');
    git(root, 'commit', '--quiet', '--no-verify', '-m', 'base');
    git(root, 'mv', 'app/legacy/b.tsx', 'app/legacy/b2.tsx');
    git(root, 'commit', '--quiet', '--no-verify', '-m', 'rename, without --prune-baseline');
    const base = git(root, 'rev-parse', 'HEAD');
    git(root, 'checkout', '--quiet', '-b', 'feature');
    git(root, 'mv', 'app/legacy/a.tsx', 'app/legacy/a2.tsx');
    fs.writeFileSync(path.join(root, 'app/legacy/a2.tsx'), slate('first item', 'second item'));
    git(root, 'commit', '--quiet', '--no-verify', '-am', 'move a.tsx and reword it');
    return { root, base };
  }

  // b2.tsx matches the entries of a.tsx as well as those of b.tsx, one finding off the changed
  // lines either way. The closer match wins, so a2.tsx gets the entries of a.tsx. Before, path
  // order gave a.tsx to b2.tsx, and a2.tsx failed on one of its two findings.
  it('passes the pull request in the GitHub Action, and pairs each file with its own entries', async () => {
    const { root, base } = await movedTwice();
    const scratch = fixture({});
    const keep = path.join(scratch, 'changed.json');
    action(root, { ...pullRequest(base), ONSYSTEM_BIN: BIN, STUB_KEEP: keep });
    const changed = JSON.parse(fs.readFileSync(keep, 'utf8')) as Record<string, unknown>;
    expect(Object.keys(changed)).toEqual([
      fs.realpathSync.native(path.join(root, 'app/legacy/a2.tsx')),
    ]);

    const checked = await check(['check', '.', '--format', 'json', '--no-cache'], root, {
      ONSYSTEM_CHANGED_LINES: keep,
    });
    expect(checked.code).toBe(0);
    expect(checked.stderr).toContain(
      '(app/legacy/a.tsx → app/legacy/a2.tsx and app/legacy/b.tsx → app/legacy/b2.tsx)',
    );
    const replay = path.join(scratch, 'results.json');
    fs.writeFileSync(replay, checked.stdout);
    const result = action(root, {
      ...pullRequest(base),
      ONSYSTEM_BIN: BIN,
      STUB_REPLAY: replay,
      STUB_STATUS: String(checked.code),
    });
    expect(result.code).toBe(0);
    expect(result.stdout).not.toContain('::error');

    // check without the changed lines, as with only-changed-lines: false, pairs them the same way.
    const plain = await check(['check', '.', '--no-cache'], root);
    expect(plain.code).toBe(0);
    expect(plain.stdout).toContain(
      '(app/legacy/a.tsx → app/legacy/a2.tsx and app/legacy/b.tsx → app/legacy/b2.tsx)',
    );
  });
});

/** An onsystem package installed in `dir`, whose CLI is the stand-in. */
function install(dir: string, version: string, name = 'onsystem') {
  const pkg = path.join(dir, 'node_modules', 'onsystem');
  fs.mkdirSync(pkg, { recursive: true });
  fs.writeFileSync(
    path.join(pkg, 'package.json'),
    JSON.stringify({ name, version, bin: { onsystem: 'dist/cli.js' } }),
  );
  fs.mkdirSync(path.join(pkg, 'dist'));
  fs.writeFileSync(path.join(pkg, 'dist/cli.js'), STUB);
  return fs.realpathSync.native(path.join(pkg, 'dist/cli.js'));
}

describe('the GitHub Action and the CLI the project installs', () => {
  const monorepo = () => {
    const root = fixture({ 'apps/web/app/page.tsx': page(section('a')) });
    git(root, 'init', '--quiet');
    return { root, web: path.join(root, 'apps/web') };
  };

  it('runs the nearest install up to the repository root, and says when it is another version', () => {
    const { root, web } = monorepo();
    const atRoot = install(root, '0.0.1');
    const ran = path.join(fixture({}), 'ran');
    const push = { GITHUB_EVENT_NAME: 'push', STUB_RAN: ran };

    const result = action(web, push);
    expect(result.code).toBe(0);
    expect(fs.readFileSync(ran, 'utf8')).toBe(atRoot);
    expect(result.stdout).toContain(
      `::notice title=onsystem::Running onsystem 0.0.1, the project's install in node_modules/onsystem, rather than ${VERSION}, the version of this action.`,
    );

    // The app's own install comes first; at the action's version there is nothing to say.
    const inApp = install(web, VERSION);
    const same = action(web, push);
    expect(fs.readFileSync(ran, 'utf8')).toBe(inApp);
    expect(same.stdout).not.toContain('::notice');

    // ONSYSTEM_BIN still decides.
    expect(cli({ ONSYSTEM_BIN: '/x/cli.js' }, repo, { cwd: web, top: root })).toEqual({
      command: process.execPath,
      args: ['/x/cli.js'],
      shell: false,
    });
  });

  it('runs npx at its own version without an install in the repository', () => {
    const outside = fixture({});
    install(outside, '0.0.1');
    const root = path.join(outside, 'repo');
    fs.mkdirSync(path.join(root, 'apps/web'), { recursive: true });
    git(root, 'init', '--quiet');
    // Another package installed under the name is not it either.
    install(path.join(root, 'apps/web'), '1.0.0', 'not-onsystem');
    const npx = { command: 'npx', args: ['--yes', `onsystem@${VERSION}`] };
    const top = fs.realpathSync.native(root);
    expect(cli({}, repo, { cwd: path.join(root, 'apps/web'), top })).toMatchObject(npx);
    expect(cli({}, repo)).toMatchObject(npx);
  });
});
