import { spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterAll, describe, expect, it } from 'vitest';

import { fixture } from './helpers.js';

const REPO = path.resolve(import.meta.dirname, '..');
const HOOK = path.join(REPO, 'plugins/onsystem/hooks/check-ui.mjs');
const { version: VERSION } = JSON.parse(
  fs.readFileSync(path.join(REPO, 'package.json'), 'utf8'),
) as { version: string };
const PINNED = ['--yes', `onsystem@${VERSION}`];
// The hook's time limit in these tests, shortened from 55 seconds.
const LIMIT = 3_000;

// Stands in for npx, and for a project's own install: logs the arguments before `check` (npm's
// flags and the package, for npx), then acts out what npm does by file name.
// - cached.tsx: the package is in npm's cache, and the registry cannot be reached.
// - stale.tsx: npm's cached list of versions is older than this release; the registry answers.
// - down.tsx: the package is not cached, and the registry cannot be reached.
// - broken.tsx: the package is cached and the CLI runs, but the project's config is invalid; the
//   registry cannot be reached. The project's folder has "network" in its name, as npm's errors do.
// - hang.tsx: it never finishes, until the hook stops it at its time limit.
// - killed.tsx: it is stopped from outside, as when the system runs out of memory.
const STUB = `import fs from 'node:fs';
const args = process.argv.slice(2);
const at = args.indexOf('check');
fs.appendFileSync(process.env.STUB_LOG, JSON.stringify(args.slice(0, at)) + '\\n');
const file = args[at + 1];
const name = file.split(/[\\\\/]/).pop();
const offline = args.includes('--prefer-offline');
const findings = () => {
  const d = { ruleId: 'no-hardcoded-color', severity: 'error', message: 'Hardcoded color.', line: 1, column: 2 };
  console.log(JSON.stringify([{ file, diagnostics: [d] }]));
  process.exit(1);
};
const unreachable = () => {
  console.error('npm error code ENOTFOUND\\nnpm error network request to https://registry.npmjs.org/onsystem failed, reason: getaddrinfo ENOTFOUND registry.npmjs.org');
  process.exit(1);
};
if (name === 'cached.tsx') offline ? findings() : unreachable();
if (name === 'stale.tsx') {
  if (!offline) findings();
  console.error('npm error code ETARGET\\nnpm error notarget No matching version found for onsystem.');
  process.exit(1);
}
if (name === 'down.tsx') unreachable();
if (name === 'broken.tsx') {
  if (!offline) unreachable();
  console.error('Invalid config in /work/network-app/onsystem.config.json:\\n✖ Unrecognized key: "rule"');
  process.exit(2);
}
if (name === 'hang.tsx') setInterval(() => {}, 1_000);
else if (name === 'killed.tsx') process.kill(process.pid, 'SIGKILL');
else console.log(JSON.stringify([{ file, diagnostics: [] }]));
`;

describe('check-ui hook: npm and the registry', () => {
  const project = fixture({ 'npx.mjs': STUB, 'package.json': '{"name":"app"}' });
  const installed = fixture({
    'package.json': '{"name":"app","devDependencies":{"onsystem":"*"}}',
    'node_modules/onsystem/package.json': '{"name":"onsystem","bin":{"onsystem":"cli.mjs"}}',
    'node_modules/onsystem/cli.mjs': STUB,
  });
  // The hook's markers, in the system temp folder: removed after the tests, like the fixtures.
  const markers: string[] = [];
  afterAll(() => {
    for (const marker of markers.splice(0)) fs.rmSync(marker, { force: true });
  });

  /**
   * A Claude Code session in `root`: `edit` runs the hook on a Write of `app/<file>`, `runs`
   * lists the stand-in's starts so far, and `pause` is the hook's marker after npm could not
   * reach the registry or npx ran out of time.
   */
  function session(root = project) {
    const id = randomUUID();
    const log = path.join(root, `runs-${id}.log`);
    fs.writeFileSync(log, '');
    const edit = (file: string) => {
      const run = spawnSync(process.execPath, [HOOK], {
        input: JSON.stringify({
          hook_event_name: 'PostToolUse',
          tool_name: 'Write',
          session_id: id,
          cwd: root,
          tool_input: { file_path: path.join(root, 'app', file) },
        }),
        encoding: 'utf8',
        env: {
          ...withoutBin(process.env),
          ONSYSTEM_NPX: path.join(project, 'npx.mjs'),
          ONSYSTEM_HOOK_TIMEOUT: String(LIMIT),
          STUB_LOG: log,
        },
      });
      return { code: run.status, stdout: run.stdout, stderr: run.stderr };
    };
    const runs = () =>
      fs
        .readFileSync(log, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line) as string[]);
    // Named as the hook names its markers: per session and project.
    const key = createHash('sha256').update(`${id}\0${root}`).digest('hex').slice(0, 16);
    const marker = (kind: string) => path.join(os.tmpdir(), 'onsystem', `${kind}-${key}`);
    markers.push(marker('offline'), marker('hook-notice'));
    return { edit, runs, pause: marker('offline') };
  }
  const silent = { code: 0, stdout: '', stderr: '' };
  const notice = (stdout: string) =>
    (JSON.parse(stdout) as { systemMessage: string }).systemMessage;

  it("checks from npm's cache through npx, so an offline machine is not held up", () => {
    // npm otherwise asks the registry about the package on every run, and waits for it offline.
    const { edit, runs } = session();
    const cached = edit('cached.tsx');
    expect(cached.code).toBe(2);
    expect(cached.stderr).toContain('1:2 error [no-hardcoded-color] Hardcoded color.');
    expect(runs()).toEqual([['--prefer-offline', ...PINNED]]);
    expect(edit('clean.tsx')).toEqual(silent);
    expect(runs()).toEqual([
      ['--prefer-offline', ...PINNED],
      ['--prefer-offline', ...PINNED],
    ]);
  });

  it("asks the registry once more when npm's cached versions predate this release", () => {
    // A cache from before the release the plugin moved to: --prefer-offline alone would fail
    // on every edit until the cache is cleared.
    const { edit, runs } = session();
    const stale = edit('stale.tsx');
    expect(stale.code).toBe(2);
    expect(stale.stderr).toContain('1:2 error [no-hardcoded-color]');
    expect(runs()).toEqual([
      ['--prefer-offline', ...PINNED],
      ['--prefer-online', ...PINNED],
    ]);
  });

  it('waits for an unreachable registry once, not on every edit', () => {
    const { edit, runs, pause } = session();
    const down = edit('down.tsx');
    expect(down.code).toBe(0);
    expect(notice(down.stdout)).toBe(
      'onsystem could not check app/down.tsx, so edits are not being checked against the design system: npm could not reach the registry (offline?). Install it in the project to run it without npx: npm install --save-dev onsystem',
    );
    // Asking again without the cache cannot reach it either.
    expect(runs()).toHaveLength(1);
    // The next edits in the session do not start npx at all.
    expect(edit('cached.tsx')).toEqual(silent);
    expect(edit('down.tsx')).toEqual(silent);
    expect(runs()).toHaveLength(1);
    // Ten minutes on, it tries again.
    const earlier = new Date(Date.now() - 11 * 60_000);
    fs.utimesSync(pause, earlier, earlier);
    expect(edit('cached.tsx').code).toBe(2);
    expect(runs()).toHaveLength(2);
    // Another session tries at once.
    expect(session().edit('cached.tsx').code).toBe(2);
  });

  it('reports a failure of the CLI itself at once, without asking the registry', () => {
    // npm ran the cached CLI, which found the config invalid: the registry would not change that,
    // and offline, asking it would only wait for npm to give up and hide the real cause.
    const { edit, runs, pause } = session();
    const broken = edit('broken.tsx');
    expect(broken.code).toBe(0);
    const text = notice(broken.stdout);
    expect(text).toContain(
      'not being checked against the design system: Invalid config in /work/network-app/onsystem.config.json:',
    );
    expect(text).toContain('Fix the config, or run `onsystem inspect` to see the problem.');
    expect(text).not.toContain('registry');
    expect(runs()).toEqual([['--prefer-offline', ...PINNED]]);
    // Not npm's failure: no pause, and the next edit checks again, once the config is fixed.
    expect(fs.existsSync(pause)).toBe(false);
    expect(edit('broken.tsx')).toEqual(silent);
    expect(edit('cached.tsx').code).toBe(2);
    expect(runs()).toHaveLength(3);
  });

  it("does not claim a cause when npx runs out of time, and doesn't wait again", () => {
    // npm waiting for an unreachable registry, a slow download or a slow check look the same.
    const { edit, runs, pause } = session();
    const hang = edit('hang.tsx');
    expect(hang.code).toBe(0);
    expect(notice(hang.stdout)).toContain(
      `: it did not finish within ${LIMIT / 1000} seconds; npm may not have reached the registry (offline?). Install it in the project`,
    );
    expect(runs()).toEqual([['--prefer-offline', ...PINNED]]);
    expect(fs.existsSync(pause)).toBe(true);
    expect(edit('hang.tsx')).toEqual(silent);
    expect(runs()).toHaveLength(1);
  });

  // A signal from outside; Windows has none.
  it.skipIf(process.platform === 'win32')(
    'does not take a CLI stopped from outside for a timeout',
    () => {
      const { edit, runs, pause } = session();
      const killed = edit('killed.tsx');
      expect(killed.code).toBe(0);
      expect(notice(killed.stdout)).toContain(
        ': it was stopped by SIGKILL. Install it in the project',
      );
      expect(runs()).toHaveLength(1);
      expect(fs.existsSync(pause)).toBe(false);
      expect(edit('killed.tsx')).toEqual(silent);
      expect(runs()).toHaveLength(2);
    },
  );

  it("runs the project's own install as it is: no npm flags, no second try, no pause", () => {
    const { edit, runs } = session(installed);
    expect(edit('stale.tsx').code).toBe(2);
    expect(runs()).toEqual([[]]);
    // A failure there is not npm's: the next edit runs it again.
    expect(edit('down.tsx').code).toBe(0);
    expect(edit('down.tsx')).toEqual(silent);
    expect(runs()).toEqual([[], [], []]);
    const hang = session(installed).edit('hang.tsx');
    expect(notice(hang.stdout)).toContain(
      `: it did not finish within ${LIMIT / 1000} seconds. Run \`onsystem`,
    );
  });
});

/** The environment without the variables that point the hook at a CLI. */
function withoutBin({
  ONSYSTEM_BIN: _bin,
  DESIGN_SYSTEM_MCP_BIN: _legacy,
  ONSYSTEM_NPX: _npx,
  ...env
}: NodeJS.ProcessEnv) {
  return env;
}
