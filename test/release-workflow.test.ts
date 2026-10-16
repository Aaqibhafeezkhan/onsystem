import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runInNewContext } from 'node:vm';

import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

// How .github/workflows/release.yml versions, publishes and completes a release. The validate job
// checks the package with read permissions, and only then the release job, the only one that can
// write or publish, versions or publishes it, with the release GitHub App's token when its secrets
// are set, and gives the version on main what it lacks of its tags, its GitHub releases, v0 and its
// MCP Registry entry. A read-only job then runs the release from npm and the Action at v0. A dry
// run, started by hand, runs a read-only job in the release job's place. The `if` conditions are
// evaluated here as GitHub would, for each kind of run, and some steps' scripts run in bash with
// stand-ins for the commands they call.

interface Step {
  id?: string;
  name?: string;
  if?: string;
  uses?: string;
  run?: string;
  with?: Record<string, string | boolean>;
  env?: Record<string, string>;
  'working-directory'?: string;
}

interface Job {
  name?: string;
  needs?: string | string[];
  if?: string;
  permissions?: Record<string, string>;
  env?: Record<string, string>;
  outputs?: Record<string, string>;
  steps: Step[];
  'timeout-minutes'?: number;
}

const root = path.resolve(import.meta.dirname, '..');
const source = fs.readFileSync(path.join(root, '.github/workflows/release.yml'), 'utf8');
const workflow = parse(source) as {
  on: Record<string, unknown>;
  concurrency?: unknown;
  permissions?: Record<string, string>;
  env?: Record<string, string>;
  jobs: Record<string, Job | undefined>;
};
const ci = parse(fs.readFileSync(path.join(root, '.github/workflows/ci.yml'), 'utf8')) as {
  on: Record<string, unknown>;
};
const jobs = workflow.jobs;
const scripts = (
  JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as {
    scripts: Record<string, string>;
  }
).scripts;
const steps = Object.values(jobs).flatMap((job) => job?.steps ?? []);
const validate = jobs.validate;
const release = jobs.release;
const published = jobs.published;
const dryRun = jobs['dry-run'];
const changesets = release?.steps.find((step) => step.uses?.startsWith('changesets/action@'));

/**
 * Whether GitHub runs a step or job with this `if`, given the values of the contexts it reads
 * (`github.event_name`, `steps.changesets.outputs.has-changesets`...) and whether a step before it
 * failed. A context with no value is ''. A condition with no status function runs only when
 * everything before it succeeded, as on GitHub (`success() && ...`); the run is never cancelled.
 */
function runs(condition: string | undefined, values: Record<string, string>, failed = false) {
  if (condition === undefined) return !failed;
  const body = condition.replace(/^\$\{\{\s*|\s*\}\}$/g, '');
  const expression = body
    .replace(/\bcancelled\(\)/g, 'false')
    .replace(/\bfailure\(\)/g, String(failed))
    .replace(/\bsuccess\(\)/g, String(!failed))
    .replace(/\balways\(\)/g, 'true')
    .replace(/\b(?:github|steps|env|vars|needs|secrets)(?:\.[\w-]+)+/g, (name) =>
      JSON.stringify(values[name] ?? ''),
    )
    .replace(/==/g, '===');
  const result = Boolean(runInNewContext(expression));
  return /\b(?:success|failure|always|cancelled)\(\)/.test(body) ? result : !failed && result;
}

/** An env value such as `${{ secrets.A != '' }}`, as the string GitHub gives a step. */
function envValue(value: string, values: Record<string, string>): string {
  return /^\$\{\{.*\}\}$/.test(value) ? String(runs(value, values)) : value;
}

const label = (step: Step) => step.name ?? step.run ?? step.uses ?? '';

/**
 * The steps of `job` that run, in order: a step's outputs (from `outputs`, by step id) exist only
 * when it runs, as on GitHub. The steps named in `fails` fail when they run, and the steps after
 * them run only if their `if` says so.
 */
function simulate(
  job: Job | undefined,
  values: Record<string, string>,
  outputs: Record<string, Record<string, string>> = {},
  fails: string[] = [],
): Step[] {
  const context = { ...values };
  for (const [name, value] of Object.entries(job?.env ?? {})) {
    context[`env.${name}`] = envValue(value, context);
  }
  const ran: Step[] = [];
  let failed = false;
  for (const step of job?.steps ?? []) {
    if (!runs(step.if, context, failed)) continue;
    ran.push(step);
    for (const [name, value] of Object.entries((step.id && outputs[step.id]) || {})) {
      context[`steps.${step.id ?? ''}.outputs.${name}`] = value;
    }
    if (fails.includes(label(step))) failed = true;
  }
  return ran;
}

/** Whether a step can change something outside the runner: npm, the repository, its releases or the MCP Registry. */
function writes(step: Step): boolean {
  if (step.uses?.startsWith('changesets/action@')) return true;
  const run = step.run ?? '';
  if (
    /gh (pr merge|workflow run|release create|api -X)|git (push|commit|tag)|changeset publish|npm publish|pnpm release|mcp-publisher (login|publish)/.test(
      run,
    )
  ) {
    return true;
  }
  return /check-published\.mjs release(?! --dry-run)/.test(run);
}

const app = (job: Job | undefined) =>
  job?.steps.find((step) => step.uses?.startsWith('actions/create-github-app-token@'));
const secrets = (hasApp: boolean) => ({
  'secrets.RELEASE_APP_ID': hasApp ? 'id' : '',
  'secrets.RELEASE_APP_PRIVATE_KEY': hasApp ? 'key' : '',
});
const on = (event: string) => ({
  'github.repository': 'dgesteves/onsystem',
  'github.event_name': event,
});
const step = (job: Job | undefined, name: string) => job?.steps.find((s) => s.name === name);

const RECONCILE = 'Create the tags and GitHub releases, and move v0, if they are missing';
const REGISTRY = 'Does the MCP Registry need this version';
const MCP = 'Publish to the MCP Registry';
const CHECK = 'The version on main is on npm';
const DISPATCH = 'Run CI on the release pull request';
const MERGE = 'Merge the release pull request once its CI passes';

/**
 * Runs a step's script in bash, as GitHub runs it, in a new folder: `files` are written there
 * first, and `bin` holds stand-ins for the commands it calls (each a sh script). Returns its exit
 * code and what it printed.
 */
function bash(
  script: string,
  {
    files = {},
    bin = {},
    env = {},
  }: {
    files?: Record<string, string | Buffer>;
    bin?: Record<string, string>;
    env?: Record<string, string>;
  } = {},
) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-step-'));
  try {
    fs.mkdirSync(path.join(dir, 'bin'));
    for (const [command, body] of Object.entries(bin)) {
      fs.writeFileSync(path.join(dir, 'bin', command), `#!/bin/sh\n${body}\n`);
      fs.chmodSync(path.join(dir, 'bin', command), 0o755);
    }
    for (const [file, content] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
      fs.writeFileSync(path.join(dir, file), content);
    }
    fs.writeFileSync(path.join(dir, 'step.sh'), script);
    const output = path.join(dir, 'github-output');
    fs.writeFileSync(output, '');
    const result = spawnSync('bash', ['--noprofile', '--norc', '-eo', 'pipefail', 'step.sh'], {
      cwd: dir,
      env: {
        PATH: `${path.join(dir, 'bin')}:${path.dirname(process.execPath)}:/usr/bin:/bin:/usr/sbin:/sbin`,
        RUNNER_TEMP: dir,
        GITHUB_OUTPUT: output,
        ...env,
      },
      encoding: 'utf8',
    });
    const outputs = Object.fromEntries(
      fs
        .readFileSync(output, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]),
    ) as Record<string, string>;
    return { status: result.status, stdout: result.stdout, stderr: result.stderr, outputs };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// The scripts need bash, tar and sha256sum, as on GitHub's Ubuntu runners.
const hasTools =
  process.platform !== 'win32' &&
  spawnSync('sh', ['-c', 'command -v bash && command -v tar && command -v sha256sum']).status === 0;

describe('release workflow', () => {
  // changesets/action splits these on spaces and runs them without a shell, so `&&` or a pipe
  // reaches the command as an argument.
  it.each(['version-script', 'publish-script'])('runs %s as one package.json script', (input) => {
    const command = changesets?.with?.[input];
    expect(command).toMatch(/^pnpm [\w:-]+$/);
    expect(scripts[String(command).slice('pnpm '.length)]).toBeDefined();
  });

  it('publishes as before: the build, then changeset publish, with the same pull request title', () => {
    expect(scripts.release).toBe('pnpm build && changeset publish');
    expect(scripts['version-packages']).toBe('changeset version && node scripts/sync-versions.mjs');
    expect(changesets?.with).toMatchObject({
      'commit-message': 'chore: release',
      'pr-title': 'chore: release',
    });
    // The tag onsystem@X.Y.Z and its GitHub release, as before.
    expect(changesets?.with?.['create-github-releases']).toBeUndefined();
    expect(changesets?.with?.['push-git-tags']).toBeUndefined();
  });

  it.each(Object.keys(jobs))('gives the %s job a timeout', (id) => {
    const minutes = jobs[id]?.['timeout-minutes'];
    expect(minutes).toBeGreaterThan(0);
    expect(minutes).toBeLessThanOrEqual(30);
  });

  // .nvmrc is what CONTRIBUTING.md and signoff-ui's release workflow read.
  it('runs the Node version in .nvmrc', () => {
    const setups = steps.filter((s) => s.uses?.startsWith('actions/setup-node@'));
    expect(setups).toHaveLength(Object.keys(jobs).length);
    for (const setup of setups) {
      expect(setup.with?.['node-version-file']).toBe('.nvmrc');
      expect(setup.with?.['node-version']).toBeUndefined();
    }
  });

  // A queued run is replaced by a newer one, but a running publish is never cancelled midway.
  it('runs one release at a time and never cancels one in progress', () => {
    expect(workflow.concurrency).toBe(
      '${{ github.workflow }}-${{ github.event_name }}-${{ github.ref }}',
    );
  });

  // A dry run only reads. In the pushes' group, one started on main could replace the waiting run
  // of the release pull request's merge, which would then publish nothing, or hold up a release.
  it('keeps a dry run out of the group the pushes to main share', () => {
    const group = (values: Record<string, string>) =>
      String(workflow.concurrency).replace(
        /\$\{\{\s*([\w.]+)\s*\}\}/g,
        (_, name: string) => values[name] ?? '',
      );
    const main = { 'github.workflow': 'Release', 'github.ref': 'refs/heads/main' };
    const push = group({ ...main, 'github.event_name': 'push' });
    expect(push).toBe('Release-push-refs/heads/main');
    expect(group({ ...main, 'github.event_name': 'workflow_dispatch' })).not.toBe(push);
  });
});

describe('the gate before a publish', () => {
  // The release job ran only `pnpm build` before publishing: no tests, no smoke test and no
  // packed install on the commit it published.
  it('validates the package in a job that can only read, before the release job', () => {
    expect(validate?.permissions).toEqual({ contents: 'read' });
    expect([release?.needs].flat()).toEqual(['validate']);
    expect([dryRun?.needs].flat()).toEqual(['validate']);
    expect(validate?.steps.map((s) => s.run).filter(Boolean)).toEqual([
      'pnpm install --frozen-lockfile',
      'pnpm typecheck',
      'pnpm build',
      'pnpm smoke',
      'pnpm test',
      'pnpm pack-test',
    ]);
  });

  it('runs validate on a push and on a dry run, in this repository only', () => {
    expect(runs(validate?.if, on('push'))).toBe(true);
    expect(runs(validate?.if, on('workflow_dispatch'))).toBe(true);
    expect(runs(validate?.if, { ...on('push'), 'github.repository': 'someone/onsystem' })).toBe(
      false,
    );
  });
});

describe('who holds which token', () => {
  // Every step of a job with id-token: write can mint the OIDC token npm trusted publishing and
  // the MCP Registry accept, so a dependency's build or test code that ran there could publish.
  it('grants nothing at the workflow level, so each job asks for its own permissions', () => {
    expect(workflow.permissions).toEqual({});
    for (const [id, job] of Object.entries(jobs)) expect(job?.permissions, id).toBeDefined();
  });

  it('lets only the release job publish, and it runs no tests', () => {
    const publishers = Object.entries(jobs).filter(([, job]) => job?.permissions?.['id-token']);
    expect(publishers.map(([id]) => id)).toEqual(['release']);
    expect(release?.permissions?.['id-token']).toBe('write');
    for (const s of release?.steps ?? []) {
      expect(s.run ?? '').not.toMatch(/pnpm (test|smoke|pack-test|lint|typecheck)|vitest/);
    }
  });

  it('runs the release and the Action from npm and v0 in a job that can only read', () => {
    expect(published?.permissions).toEqual({ contents: 'read' });
    expect(published?.steps.filter(writes).map(label)).toEqual([]);
  });

  // CI and the validate job run the dependencies' test and build code, and setup-node saves the
  // pnpm store after them: a package that ran there could leave files for the release job.
  it('restores no cache in the release job', () => {
    const cached = release?.steps.filter(
      (s) => s.uses?.startsWith('actions/cache') === true || s.with?.cache !== undefined,
    );
    expect(cached?.map(label)).toEqual([]);
  });

  // actions/checkout otherwise leaves the job's token in .git/config, for every later step. The
  // v0 move was a `git push --force` with that token; it now goes through the GitHub API.
  it('keeps no credentials in any checkout, and pushes nothing with git', () => {
    const checkouts = steps.filter((s) => s.uses?.startsWith('actions/checkout@'));
    expect(checkouts).toHaveLength(Object.keys(jobs).length);
    for (const s of checkouts) expect(s.with?.['persist-credentials']).toBe(false);
    for (const s of steps) expect(s.run ?? '').not.toMatch(/git (push|tag)/);
  });

  // A tag can be moved to other code; a commit can't. Dependabot's github-actions updates move the
  // SHA and the comment together. The one exception is the check of what `@v0` users get.
  it('pins every action to a full commit SHA, with its version in a comment', () => {
    const uses = [...source.matchAll(/^\s*(?:- )?uses: (.+)$/gm)].map((match) => match[1] ?? '');
    const pinned = uses.filter((line) => line !== 'dgesteves/onsystem@v0');
    expect(pinned.length).toBeGreaterThan(0);
    for (const line of pinned) {
      expect(line).toMatch(/^[\w.-]+\/[\w.-]+@[0-9a-f]{40} # v\d+\.\d+\.\d+$/);
    }
    expect(uses.filter((line) => line === 'dgesteves/onsystem@v0')).toHaveLength(1);
    expect(published?.steps.some((s) => s.uses === 'dgesteves/onsystem@v0')).toBe(true);
  });

  // The download was `curl ... | tar xz mcp-publisher`, run as is in the job with the OIDC token.
  it('checks the mcp-publisher archive against a pinned sha256 before running it', () => {
    expect(workflow.env?.MCP_PUBLISHER_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    expect(workflow.env?.MCP_PUBLISHER_SHA256).toMatch(/^[0-9a-f]{64}$/);
    const script = step(release, MCP)?.run ?? '';
    const checked = script.indexOf('sha256sum -c -');
    expect(checked).toBeGreaterThan(0);
    expect(script.indexOf('tar -xzf')).toBeGreaterThan(checked);
    expect(script.indexOf('mcp-publisher" login github-oidc')).toBeGreaterThan(checked);
    expect(script).not.toContain('| tar');
  });
});

describe('the release GitHub App', () => {
  // The pull_request runs of a push made with the workflow's own token waited for approval, the
  // CI run started by hand didn't count, and #49, #70, #85 and #109 each merged only after an empty
  // "chore: run CI" commit by hand.
  it('mints a token from the App when both its secrets are set', () => {
    expect(release?.env?.HAS_APP).toBe(
      "${{ secrets.RELEASE_APP_ID != '' && secrets.RELEASE_APP_PRIVATE_KEY != '' }}",
    );
    expect(app(release)?.if).toBe("env.HAS_APP == 'true'");
    expect(app(release)?.with).toEqual({
      'client-id': '${{ secrets.RELEASE_APP_ID }}',
      'private-key': '${{ secrets.RELEASE_APP_PRIVATE_KEY }}',
      'permission-contents': 'write',
      'permission-pull-requests': 'write',
    });
  });

  it('gives changesets/action the App’s token, or the workflow’s own without the App', () => {
    expect(app(release)?.id).toBe('app-token');
    expect(changesets?.with?.['github-token']).toBe(
      '${{ steps.app-token.outputs.token || github.token }}',
    );
    expect(step(release, RECONCILE)?.env?.GH_TOKEN).toBe(
      '${{ steps.app-token.outputs.token || github.token }}',
    );
    // The token comes before the checkout, so nothing the checkout or the install runs precedes it.
    expect(release?.steps.map(label).indexOf('Get a token from the release GitHub App')).toBe(0);
  });

  const versionRun = (hasApp: boolean, autoMerge = false) =>
    simulate(
      release,
      { ...on('push'), ...secrets(hasApp), 'vars.RELEASE_AUTO_MERGE': autoMerge ? 'true' : '' },
      {
        'app-token': { token: 'app token' },
        main: { version: '0.7.0' },
        changesets: { 'has-changesets': 'true', 'pr-number': '175', published: 'false' },
      },
    ).map(label);

  it('starts CI on the release pull request itself only without the App', () => {
    expect(versionRun(false)).toContain(DISPATCH);
    expect(versionRun(false)).not.toContain('Get a token from the release GitHub App');
    expect(versionRun(true)).toContain('Get a token from the release GitHub App');
    expect(versionRun(true)).not.toContain(DISPATCH);
  });

  // The fallback starts ci.yml by hand, which only a workflow_dispatch trigger allows.
  it('keeps the trigger in ci.yml that the fallback starts', () => {
    expect(step(release, DISPATCH)?.run).toBe(
      'gh workflow run ci.yml --ref changeset-release/main',
    );
    expect(Object.keys(ci.on)).toContain('workflow_dispatch');
  });

  it('merges the release pull request by itself only when RELEASE_AUTO_MERGE says so', () => {
    expect(versionRun(true)).not.toContain(MERGE);
    expect(versionRun(false, true)).not.toContain(MERGE);
    expect(versionRun(true, true)).toContain(MERGE);
  });
});

describe('a version run', () => {
  const versionRun = (fails: string[] = []) =>
    simulate(
      release,
      { ...on('push'), ...secrets(true), 'vars.RELEASE_AUTO_MERGE': 'true' },
      {
        'app-token': { token: 'app token' },
        main: { version: '0.7.0' },
        changesets: { 'has-changesets': 'true', 'pr-number': '175', published: 'false' },
      },
      fails,
    ).map(label);

  // A queued Release run is replaced by a newer push's run. Had the release pull request's merge
  // been queued, its version would never reach npm, and the next run would only update the
  // release pull request, silently.
  it('checks that npm has the version on main, and completes nothing', () => {
    const ran = versionRun();
    expect(ran).toContain(CHECK);
    expect(ran).not.toContain(RECONCILE);
    expect(ran).not.toContain(REGISTRY);
    expect(ran).not.toContain(MCP);
  });

  // changesets/action switches to changeset-release/main and runs `changeset version` there, so
  // after it package.json holds the next version, which npm can't have yet: a check that read it
  // would fail on every version run.
  it('reads the version on main before changesets/action, and checks that one', () => {
    const order = release?.steps.map((s) => s.id ?? label(s)) ?? [];
    expect(order.indexOf('main')).toBeGreaterThan(-1);
    expect(order.indexOf('main')).toBeLessThan(order.indexOf('changesets'));
    expect(step(release, CHECK)?.env?.VERSION).toBe('${{ steps.main.outputs.version }}');
    expect(step(release, RECONCILE)?.env?.VERSION).toBe('${{ steps.main.outputs.version }}');
    expect(step(release, REGISTRY)?.env?.VERSION).toBe('${{ steps.main.outputs.version }}');
    expect(release?.outputs?.version).toBe('${{ steps.main.outputs.version }}');
  });

  it.skipIf(!hasTools)('reads the version in package.json', () => {
    const read = release?.steps.find((s) => s.id === 'main');
    const { status, outputs } = bash(read?.run ?? '', {
      files: { 'package.json': '{ "name": "onsystem", "version": "0.7.0" }' },
    });
    expect(status).toBe(0);
    expect(outputs).toEqual({ version: '0.7.0' });
  });

  // Had the merge step run first, the next release pull request would merge by itself once its
  // CI passed, and the version npm never got would be skipped for good.
  it('turns on no auto-merge when npm doesn’t have the version on main', () => {
    expect(versionRun()).toEqual(expect.arrayContaining([CHECK, MERGE]));
    const ran = versionRun([CHECK]);
    expect(ran).toContain(CHECK);
    expect(ran).not.toContain(MERGE);
    const order = release?.steps.map(label) ?? [];
    expect(order.indexOf(CHECK)).toBe(order.indexOf(label(changesets ?? {})) + 1);
    expect(order.indexOf(CHECK)).toBeLessThan(order.indexOf(MERGE));
  });
});

describe('a publish', () => {
  const publishRun = (
    results: Record<string, string>,
    values: Record<string, string> = {},
    fails: string[] = [],
    registry: Record<string, string> = { publish: 'true' },
  ) =>
    simulate(
      release,
      { ...on('push'), ...values },
      {
        main: { version: '0.8.0' },
        changesets: { 'has-changesets': 'false', ...results },
        registry,
      },
      fails,
    ).map(label);

  it('completes the tags, the releases, v0 and the MCP Registry after a publish', () => {
    expect(publishRun({ published: 'true' })).toEqual(
      expect.arrayContaining([RECONCILE, REGISTRY, MCP]),
    );
    expect(step(release, RECONCILE)?.env).toEqual({
      GH_TOKEN: '${{ steps.app-token.outputs.token || github.token }}',
      VERSION: '${{ steps.main.outputs.version }}',
      PUBLISHED_PACKAGES: '${{ steps.changesets.outputs.published-packages }}',
      RELEASE_ACTION_LATEST: '${{ vars.RELEASE_ACTION_LATEST }}',
    });
    expect(step(release, RECONCILE)?.run).toBe('node scripts/check-published.mjs release');
    expect(step(release, REGISTRY)?.run).toBe('node scripts/check-published.mjs registry');
  });

  // @changesets/cli publishes only versions npm doesn't have, so a re-run after a failed tag,
  // release or v0 move published nothing (published was false), and the v0 step, which waited for
  // published == 'true', was skipped: no tag, no GitHub release, no v0.
  it('completes them on a re-run that publishes nothing new', () => {
    const ran = publishRun({ published: 'false' });
    expect(ran).toEqual(expect.arrayContaining([RECONCILE, REGISTRY, MCP]));
    expect(ran).not.toContain(CHECK);
    for (const s of release?.steps ?? []) expect(s.if ?? '').not.toContain('outputs.published ==');
  });

  // changesets/action fails when creating the release fails, after npm has the version. The
  // steps' `!cancelled()` lets them run then; `runs` reads `cancelled()` as false.
  it('runs after a failed changesets/action step too, and the registry after a failed reconcile', () => {
    const afterChangesets = publishRun({ published: 'true' }, {}, [label(changesets ?? {})]);
    expect(afterChangesets).toEqual(expect.arrayContaining([RECONCILE, REGISTRY, MCP]));
    const afterReconcile = publishRun({ published: 'true' }, {}, [RECONCILE]);
    expect(afterReconcile).toEqual(expect.arrayContaining([REGISTRY, MCP]));
    // changesets/action never ran (the install failed): no outputs, nothing to complete.
    expect(runs(step(release, RECONCILE)?.if, {}, true)).toBe(false);
    expect(runs(step(release, REGISTRY)?.if, {}, true)).toBe(false);
  });

  it('publishes to the MCP Registry only when the registry step says so', () => {
    expect(publishRun({ published: 'true' }, {}, [], { publish: 'false' })).not.toContain(MCP);
    expect(publishRun({ published: 'false' }, {}, [], {})).not.toContain(MCP);
    expect(step(release, MCP)?.if).toBe(
      "${{ !cancelled() && steps.registry.outputs.publish == 'true' }}",
    );
  });

  it('starts no CI and merges nothing after a publish', () => {
    for (const hasApp of [false, true]) {
      const ran = simulate(
        release,
        { ...on('push'), ...secrets(hasApp), 'vars.RELEASE_AUTO_MERGE': 'true' },
        {
          'app-token': { token: 'app token' },
          changesets: { 'has-changesets': 'false', published: 'true' },
        },
      );
      expect(ran.filter((s) => /gh (workflow run|pr merge)/.test(s.run ?? '')).map(label)).toEqual(
        [],
      );
    }
  });

  // The script, in bash, with stand-ins for curl (which writes `archive`) and for mcp-publisher.
  const publishStep = (archive: Buffer, sha256: string) =>
    bash(step(release, MCP)?.run ?? '', {
      bin: {
        curl: `while [ "$1" != -o ]; do shift; done; cp "$RUNNER_TEMP/archive.tgz" "$2"; echo "curl $*" >&2`,
      },
      files: { 'archive.tgz': archive },
      env: {
        MCP_PUBLISHER_VERSION: workflow.env?.MCP_PUBLISHER_VERSION ?? '',
        MCP_PUBLISHER_SHA256: sha256,
      },
    });

  /** A .tar.gz holding an mcp-publisher that prints its arguments. */
  function archive(): Buffer {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-publisher-'));
    try {
      fs.writeFileSync(path.join(dir, 'mcp-publisher'), '#!/bin/sh\necho "mcp-publisher $*"\n', {
        mode: 0o755,
      });
      fs.writeFileSync(path.join(dir, 'README.md'), 'mcp-publisher\n');
      const made = spawnSync('tar', ['-czf', 'archive.tgz', 'mcp-publisher', 'README.md'], {
        cwd: dir,
      });
      expect(made.status).toBe(0);
      return fs.readFileSync(path.join(dir, 'archive.tgz'));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  it.skipIf(!hasTools)('runs mcp-publisher when its archive matches the checksum', () => {
    const tarball = archive();
    const sha256 = createHash('sha256').update(tarball).digest('hex');
    const { status, stdout } = publishStep(tarball, sha256);
    expect(status).toBe(0);
    expect(stdout).toContain('mcp-publisher login github-oidc\nmcp-publisher publish');
  });

  it.skipIf(!hasTools)('stops before running mcp-publisher when its archive doesn’t match', () => {
    const tarball = archive();
    const { status, stdout } = publishStep(tarball, '0'.repeat(64));
    expect(status).not.toBe(0);
    expect(stdout).not.toContain('mcp-publisher login');
    expect(stdout).not.toContain('mcp-publisher publish');
  });
});

describe('the run from npm and the Action at v0', () => {
  const after = (values: Record<string, string>) => runs(published?.if, values);

  it('runs after a release job that found no pending changesets, and only then', () => {
    expect([published?.needs].flat()).toEqual(['release']);
    expect(after({ 'needs.release.outputs.has-changesets': 'false' })).toBe(true);
    expect(after({ 'needs.release.outputs.has-changesets': 'true' })).toBe(false);
    // A dry run, where the release job is skipped and has no outputs.
    expect(after({})).toBe(false);
    expect(published?.env?.VERSION).toBe('${{ needs.release.outputs.version }}');
    expect(release?.outputs?.['has-changesets']).toBe(
      '${{ steps.changesets.outputs.has-changesets }}',
    );
  });

  it('runs the version from npm, then v0 on the demo’s clean page', () => {
    const names = published?.steps.map(label) ?? [];
    expect(names).toEqual(
      expect.arrayContaining([
        'npx -y onsystem@<version> runs, and prints its version',
        "v0 runs npm's latest",
        "The Action at v0 passes the demo's clean page",
      ]),
    );
    const action = published?.steps.find((s) => s.uses === 'dgesteves/onsystem@v0');
    expect(action?.with).toEqual({
      'working-directory': 'examples/shadcn-demo',
      paths: 'app/settings/members.tsx',
    });
  });

  it.skipIf(!hasTools)('fails when npx runs another version than the one on main', () => {
    const npx = step(published, 'npx -y onsystem@<version> runs, and prints its version');
    const npm = 'exit 0';
    const ok = bash(npx?.run ?? '', {
      bin: { npm, npx: 'echo 0.8.0', sleep: 'exit 0' },
      env: { VERSION: '0.8.0' },
    });
    expect(ok.status).toBe(0);
    expect(ok.stdout).toContain('npx -y onsystem@0.8.0 --version printed 0.8.0.');
    const stale = bash(npx?.run ?? '', {
      bin: { npm, npx: 'echo 0.7.0', sleep: 'exit 0' },
      env: { VERSION: '0.8.0' },
    });
    expect(stale.status).not.toBe(0);
  });
});

describe('a dry run', () => {
  const dispatch = (hasApp: boolean) => ({
    ...on('workflow_dispatch'),
    ...secrets(hasApp),
    'vars.RELEASE_AUTO_MERGE': 'true',
  });

  it('starts by hand, on any branch', () => {
    expect(Object.keys(workflow.on).sort()).toEqual(['push', 'workflow_dispatch']);
    expect(workflow.on.workflow_dispatch).toBeNull();
    expect(workflow.on.push).toEqual({ branches: ['main'] });
  });

  it('runs no step that publishes, pushes or creates anything, with or without the App', () => {
    for (const hasApp of [false, true]) {
      const values = dispatch(hasApp);
      expect(runs(release?.if, values)).toBe(false);
      expect(runs(dryRun?.if, values)).toBe(true);
      for (const version of ['true', 'false']) {
        const ran = simulate(dryRun, values, {
          'app-token': { token: 'app token' },
          pending: { version },
        });
        expect(ran.filter(writes).map(label)).toEqual([]);
        expect(ran.map(label)).toEqual(
          expect.arrayContaining([
            'Dry run: npm, the tags, the GitHub releases and the MCP Registry',
            'Dry run: pack the package as changeset publish would, without publishing',
            'Dry run: check the mcp-publisher archive against its checksum, without running it',
          ]),
        );
        expect(
          ran
            .map(label)
            .includes(
              'Dry run: version the package as the release pull request would, without pushing',
            ),
        ).toBe(version === 'true');
        expect(ran.map(label).includes('Get a read-only token from the release GitHub App')).toBe(
          hasApp,
        );
      }
    }
  });

  it('gives the dry-run job read permissions, and the App a read-only token there', () => {
    expect(dryRun?.permissions).toEqual({ contents: 'read', 'pull-requests': 'read' });
    expect(dryRun?.env?.HAS_APP).toBe(release?.env?.HAS_APP);
    expect(app(dryRun)?.with).toMatchObject({
      'permission-contents': 'read',
      'permission-pull-requests': 'read',
    });
    expect(Object.values(app(dryRun)?.with ?? {})).not.toContain('write');
  });

  it('runs the release job only on a push, and the dry run only in its place', () => {
    expect(runs(release?.if, on('push'))).toBe(true);
    expect(runs(release?.if, on('workflow_dispatch'))).toBe(false);
    expect(runs(dryRun?.if, on('push'))).toBe(false);
    expect(runs(dryRun?.if, on('workflow_dispatch'))).toBe(true);
  });

  const checks = 'Dry run: npm, the tags, the GitHub releases and the MCP Registry';

  it.skipIf(!hasTools).each([
    ['true', 'node scripts/check-published.mjs npm'],
    [
      'false',
      'node scripts/check-published.mjs release --dry-run\nnode scripts/check-published.mjs registry --dry-run',
    ],
  ])('with pending changesets %s, checks as the release job would, read-only', (pending, ran) => {
    const { status, stdout } = bash(step(dryRun, checks)?.run ?? '', {
      bin: { node: 'echo "node $*"' },
      env: { PENDING: pending },
    });
    expect(status).toBe(0);
    expect(stdout.trim()).toBe(ran);
  });

  it('keeps the version commit and the tarball in the runner', () => {
    const version = dryRun?.steps.find((s) => s.name?.startsWith('Dry run: version'));
    expect(version?.run).toContain('pnpm version-packages');
    expect(version?.run).not.toMatch(/git (commit|push)/);
    const pack = dryRun?.steps.find((s) => s.name?.startsWith('Dry run: pack'));
    expect(pack?.run).toContain('pnpm pack --pack-destination "$RUNNER_TEMP/pack"');
  });

  it('checks mcp-publisher’s checksum as the release job does, and never runs it', () => {
    const script = step(
      dryRun,
      'Dry run: check the mcp-publisher archive against its checksum, without running it',
    )?.run;
    expect(script).toContain('echo "$MCP_PUBLISHER_SHA256  $archive" | sha256sum -c -');
    expect(script).not.toContain('mcp-publisher"');
    const download = (run = '') => run.split('\n').find((line) => line.includes('https://'));
    expect(download(script)).toBe(download(step(release, MCP)?.run));
  });

  /** The step that counts the pending changesets, run in bash with the real node. */
  function findPending(files: string[], contents: Record<string, string> = {}) {
    return bash(dryRun?.steps.find((s) => s.id === 'pending')?.run ?? '', {
      files: {
        'package.json': '{ "name": "onsystem", "version": "0.7.0" }\n',
        ...Object.fromEntries(
          files.map((file) => [path.join('.changeset', file), contents[file] ?? '---\n---\n']),
        ),
      },
    });
  }

  // Right after a release .changeset holds only its README and config, and `changeset version`
  // exits 1 ('No unreleased changesets found.'), which would fail the dry run before it packed.
  it.skipIf(!hasTools)('skips only the version step when no changeset is pending', () => {
    const found = findPending(['README.md', 'config.json', 'AGENTS.md', '.draft.md']);
    expect(found.stderr).toBe('');
    expect(found.status).toBe(0);
    expect(found.outputs).toEqual({ count: '0', version: 'false' });
    expect(found.stdout).toContain('No pending changesets: nothing to version');
    expect(found.stdout).toContain('0.7.0');
  });

  it.skipIf(!hasTools)(
    'versions the package when changesets are pending, or pre mode exits',
    () => {
      const found = findPending(['README.md', 'config.json', 'brave-cats-sing.md', 'pre/old.md']);
      expect(found.status).toBe(0);
      expect(found.outputs).toEqual({ count: '2', version: 'true' });
      expect(found.stdout).toContain('Pending changesets: 2.');
      const exit = findPending(['config.json', 'pre.json'], {
        'pre.json': '{ "mode": "exit", "tag": "next", "initialVersions": {}, "changesets": [] }\n',
      });
      expect(exit.outputs).toEqual({ count: '0', version: 'true' });
    },
  );
});
