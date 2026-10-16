import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

// scripts/check-published.mjs, which the release workflow runs after changesets/action: with
// pending changesets, that npm has the version on main; with none, the tags, the GitHub releases
// and the v0 move that npm's version lacks, all at the commit it was published from, and whether
// the MCP Registry needs it. A release whose tag, GitHub release or v0 move failed after npm took
// the version could not be finished: a re-run publishes nothing new, changesets/action then makes
// no tag or release, and the v0 step waited for a publish. npm, the GitHub API and the MCP
// Registry are stand-ins here.

interface Options {
  env?: Record<string, string | undefined>;
  fetch?: (url: string, init?: RequestInit) => Promise<Response>;
  root?: string;
  log?: (line: string) => void;
  sleep?: (ms: number) => Promise<void>;
}
interface CheckPublished {
  run: (argv: string[], options?: Options) => Promise<number>;
  changelogEntry: (changelog: string, version: string) => string | undefined;
  provenanceCommit: (attestations: unknown, repo: string) => string | undefined;
  actionNotes: (repo: string, version: string) => string;
}

const repoRoot = path.resolve(import.meta.dirname, '..');
const { run, changelogEntry, provenanceCommit, actionNotes } = (await import(
  pathToFileURL(path.join(repoRoot, 'scripts/check-published.mjs')).href
)) as CheckPublished;

/** The commit 0.8.0 was published from, the commit of 0.7.0, and a later push's (GITHUB_SHA). */
const MERGE = '8b1e5c0d7a2f4e6b9c3d1a0f5e7b2c4d6a8e0f13';
const BEFORE = '1d54d1e20041fd5941f4d8d5ad221dc2378daf6e';
const LATER = 'a2fd869aa1b2c3d4e5f60718293a4b5c6d7e8f90';
const API = 'https://api.github.com/repos/dgesteves/onsystem';

const base64 = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64');

/**
 * npm's attestations for a version published by the release workflow from `commit`, in the shape
 * of onsystem@0.7.0's (`/-/npm/v1/attestations/onsystem@0.7.0`): npm's publish attestation, then
 * the SLSA provenance, each a DSSE envelope around a base64 in-toto statement. The sigstore
 * certificates and signatures are left out.
 */
function attestations(commit: string, repo = 'dgesteves/onsystem', version = '0.8.0') {
  const subject = [{ name: `pkg:npm/onsystem@${version}`, digest: { sha512: 'e135' } }];
  return {
    attestations: [
      {
        predicateType: 'https://github.com/npm/attestation/tree/main/specs/publish/v0.1',
        bundle: {
          dsseEnvelope: {
            payload: base64({
              predicateType: 'https://github.com/npm/attestation/tree/main/specs/publish/v0.1',
              subject,
              predicate: { name: 'onsystem', version, registry: 'https://registry.npmjs.org' },
            }),
          },
        },
      },
      {
        predicateType: 'https://slsa.dev/provenance/v1',
        bundle: {
          dsseEnvelope: {
            payload: base64({
              predicateType: 'https://slsa.dev/provenance/v1',
              subject,
              predicate: {
                buildDefinition: {
                  externalParameters: {
                    workflow: {
                      ref: 'refs/heads/main',
                      repository: `https://github.com/${repo}`,
                      path: '.github/workflows/release.yml',
                    },
                  },
                  resolvedDependencies: [
                    {
                      uri: `git+https://github.com/${repo}@refs/heads/main`,
                      digest: { gitCommit: commit },
                    },
                  ],
                },
              },
            }),
          },
        },
      },
    ],
  };
}

const CHANGELOG = `# onsystem (formerly @dgesteves/design-system-mcp)

## 0.8.0

### Minor Changes

- [#174](https://github.com/dgesteves/onsystem/pull/174) A rule reports more.

## 0.7.0

### Patch Changes

- A fix.
`;

const roots: string[] = [];
afterEach(() => {
  for (const dir of roots.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

/** A checkout with onsystem at `version`, its CHANGELOG.md and server.json. */
function checkout(version: string, changelog = CHANGELOG): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-published-'));
  roots.push(dir);
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'onsystem', version }));
  fs.writeFileSync(path.join(dir, 'CHANGELOG.md'), changelog);
  fs.writeFileSync(
    path.join(dir, 'server.json'),
    JSON.stringify({ name: 'io.github.dgesteves/onsystem', version }),
  );
  return dir;
}

interface Call {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: Record<string, unknown>;
}

/**
 * npm, the GitHub API and the MCP Registry, holding these versions (npm's latest is the last one,
 * unless `latest` says otherwise), tags (by name, the commit each names), releases and listed
 * versions, and npm's attestations by version. A version in `servedAfter` is served from that read
 * on. Tags and releases the script creates or moves are kept, as GitHub would.
 */
function services({
  npm = [] as string[],
  latest = undefined as string | undefined,
  tags = {} as Record<string, string>,
  releases = [] as string[],
  listed = [] as string[],
  provenance = {} as Record<string, unknown>,
  servedAfter = {} as Record<string, number>,
  refuse = 0,
  down = false,
}) {
  const calls: Call[] = [];
  const reads: Record<string, number> = {};
  const fetch = (url: string, init: RequestInit = {}) => {
    const method = init.method ?? 'GET';
    const headers = (init.headers ?? {}) as Record<string, string>;
    // The script sends JSON.stringify's output.
    const body =
      typeof init.body === 'string'
        ? (JSON.parse(init.body) as Record<string, unknown>)
        : undefined;
    calls.push({ method, url, headers, ...(body ? { body } : {}) });
    if (down) return Promise.reject(new TypeError('fetch failed'));
    const json = (value: unknown, status = 200) =>
      Promise.resolve(Response.json(value, { status }));
    const missing = () => Promise.resolve(new Response('Not Found', { status: 404 }));

    if (method !== 'GET') {
      if (refuse) return Promise.resolve(new Response('Forbidden', { status: refuse }));
      if (method === 'POST' && url === `${API}/git/refs`) {
        const { ref, sha } = body as { ref: string; sha: string };
        tags[ref.replace('refs/tags/', '')] = sha;
        return json({ ref, object: { sha, type: 'commit' } }, 201);
      }
      if (method === 'PATCH' && url.startsWith(`${API}/git/refs/tags/`)) {
        const name = decodeURIComponent(url.slice(`${API}/git/refs/tags/`.length));
        tags[name] = String(body?.sha);
        return json({ object: { sha: body?.sha, type: 'commit' } });
      }
      if (method === 'POST' && url === `${API}/releases`) {
        const name = String(body?.tag_name);
        releases.push(name);
        return json(
          { html_url: `https://github.com/dgesteves/onsystem/releases/tag/${name}` },
          201,
        );
      }
      return missing();
    }

    const npmVersion = /^https:\/\/registry\.npmjs\.org\/onsystem\/(.+)$/.exec(url)?.[1];
    if (npmVersion !== undefined) {
      reads[npmVersion] = (reads[npmVersion] ?? 0) + 1;
      const after = servedAfter[npmVersion];
      const served = after === undefined ? npm.includes(npmVersion) : reads[npmVersion] >= after;
      return served ? json({ version: npmVersion }) : missing();
    }
    if (url === 'https://registry.npmjs.org/-/package/onsystem/dist-tags') {
      return json({ latest: latest ?? npm.at(-1) });
    }
    const attested =
      /^https:\/\/registry\.npmjs\.org\/-\/npm\/v1\/attestations\/onsystem@(.+)$/.exec(url)?.[1];
    if (attested !== undefined) {
      const found = provenance[attested];
      return found ? json(found) : missing();
    }
    const tag = new RegExp(`^${API}/git/ref/tags/(.+)$`).exec(url)?.[1];
    if (tag !== undefined) {
      const sha = tags[decodeURIComponent(tag)];
      return sha ? json({ object: { sha, type: 'commit' } }) : missing();
    }
    const release = new RegExp(`^${API}/releases/tags/(.+)$`).exec(url)?.[1];
    if (release !== undefined) {
      return releases.includes(decodeURIComponent(release)) ? json({}) : missing();
    }
    const registry =
      /^https:\/\/registry\.modelcontextprotocol\.io\/v0\.1\/servers\/io\.github\.dgesteves%2Fonsystem\/versions\/(.+)$/.exec(
        url,
      )?.[1];
    if (registry !== undefined) {
      return listed.includes(decodeURIComponent(registry)) ? json({}) : missing();
    }
    return Promise.reject(new Error(`No stand-in for ${method} ${url}`));
  };
  return {
    fetch,
    calls,
    tags,
    releases,
    writes: () => calls.filter((call) => call.method !== 'GET'),
  };
}

async function check(
  argv: string[],
  version: string,
  world: ReturnType<typeof services>,
  env: Options['env'] = {},
) {
  const lines: string[] = [];
  const dir = checkout(version);
  const output = path.join(dir, 'github-output');
  fs.writeFileSync(output, '');
  const sleeps: number[] = [];
  const code = await run(argv, {
    root: dir,
    fetch: world.fetch,
    env: {
      GH_TOKEN: 'token',
      GITHUB_REPOSITORY: 'dgesteves/onsystem',
      GITHUB_SHA: LATER,
      GITHUB_OUTPUT: output,
      ...env,
    },
    log: (line) => lines.push(line),
    sleep: (ms) => {
      sleeps.push(ms);
      return Promise.resolve();
    },
  });
  return { code, log: lines.join('\n'), output: fs.readFileSync(output, 'utf8'), sleeps };
}

const publishedHere = (version: string) => ({
  PUBLISHED_PACKAGES: JSON.stringify([{ name: 'onsystem', version }]),
});

describe('changelogEntry', () => {
  it('takes a version’s entry, as changesets/action does for the releases it creates', () => {
    expect(changelogEntry(CHANGELOG, '0.8.0')).toBe(
      '### Minor Changes\n\n- [#174](https://github.com/dgesteves/onsystem/pull/174) A rule reports more.',
    );
    expect(changelogEntry(CHANGELOG, '0.7.0')).toBe('### Patch Changes\n\n- A fix.');
    expect(changelogEntry(CHANGELOG, '0.6.0')).toBeUndefined();
  });

  it('reads past a heading inside fenced code', () => {
    const changelog =
      '## 1.0.0\n\n- Run:\n\n```md\n## not a version\n```\n\n- More.\n\n## 0.9.0\n\n- Old.\n';
    expect(changelogEntry(changelog, '1.0.0')).toBe(
      '- Run:\n\n```md\n## not a version\n```\n\n- More.',
    );
  });

  it('finds the entry of the version on main in this repository’s CHANGELOG.md', () => {
    const { version } = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'),
    ) as {
      version: string;
    };
    const entry = changelogEntry(
      fs.readFileSync(path.join(repoRoot, 'CHANGELOG.md'), 'utf8'),
      version,
    );
    expect(entry).toMatch(/^### (Major|Minor|Patch) Changes\n/);
    expect(entry).not.toMatch(/^## /m);
  });
});

describe('provenanceCommit', () => {
  it('reads the commit the SLSA provenance names, for this repository', () => {
    expect(provenanceCommit(attestations(MERGE), 'dgesteves/onsystem')).toBe(MERGE);
  });

  it('names no commit for another repository, a publish attestation alone, or a payload it can’t read', () => {
    expect(provenanceCommit(attestations(MERGE, 'someone/onsystem'), 'dgesteves/onsystem')).toBe(
      undefined,
    );
    // A repository whose name starts with this one's.
    expect(
      provenanceCommit(attestations(MERGE, 'dgesteves/onsystem-fork'), 'dgesteves/onsystem'),
    ).toBeUndefined();
    const [publish, slsa] = attestations(MERGE).attestations;
    expect(provenanceCommit({ attestations: [publish] }, 'dgesteves/onsystem')).toBeUndefined();
    const unreadable = { ...slsa, bundle: { dsseEnvelope: { payload: 'not base64 json' } } };
    expect(provenanceCommit({ attestations: [unreadable] }, 'dgesteves/onsystem')).toBeUndefined();
    expect(provenanceCommit(attestations('main'), 'dgesteves/onsystem')).toBeUndefined();
    expect(provenanceCommit({}, 'dgesteves/onsystem')).toBeUndefined();
    expect(provenanceCommit(null, 'dgesteves/onsystem')).toBeUndefined();
  });
});

describe('actionNotes', () => {
  // A `uses:` ref is split on @ into exactly two parts, so the Marketplace's "Use latest version"
  // on a release tagged onsystem@0.6.0 gave `dgesteves/onsystem@onsystem@0.6.0`, which doesn't run.
  it('pins the Action by a tag a `uses:` ref can hold, and links the release notes', () => {
    const notes = actionNotes('dgesteves/onsystem', '0.8.0');
    expect(notes).toBe(
      "onsystem's GitHub Action at 0.8.0. Pin it with `uses: dgesteves/onsystem@v0.8.0`, or use `@v0` to follow each release.\n\n" +
        'Release notes: https://github.com/dgesteves/onsystem/releases/tag/onsystem%400.8.0',
    );
    for (const [, ref = ''] of notes.matchAll(/`uses: ([^`]+)`/g)) {
      expect(ref.split('@')).toHaveLength(2);
    }
    expect(actionNotes('dgesteves/onsystem', '1.2.0')).toContain('use `@v1` to follow');
  });
});

describe('check-published npm, with pending changesets', () => {
  // VERSION is the version on main, read before changesets/action moved package.json to the next.
  it('passes when npm has the version on main, whatever package.json says now', async () => {
    const world = services({ npm: ['0.7.0'] });
    expect(await check(['npm'], '0.8.0', world, { VERSION: '0.7.0' })).toMatchObject({
      code: 0,
      log: 'npm has onsystem@0.7.0, or it has its tag: the version on main was released.',
    });
  });

  // npm can take minutes to serve a version: changesets/action tags it right after the publish.
  it('passes when the version has its tag, while npm doesn’t serve it yet', async () => {
    const world = services({ tags: { 'onsystem@0.8.0': MERGE } });
    expect((await check(['npm'], '0.8.0', world)).code).toBe(0);
  });

  // The Release run for the release pull request's merge waited behind another, a newer push
  // replaced it, and that push's run found pending changesets: 0.8.0 was never published.
  it('fails, saying to re-run the replaced run, when the version on main was never published', async () => {
    const world = services({ npm: ['0.7.0'], tags: { 'onsystem@0.7.0': BEFORE } });
    const { code, log } = await check(['npm'], '0.8.0', world);
    expect(code).toBe(1);
    expect(log).toMatch(
      /^::error::onsystem@0\.8\.0 is the version on main, but npm doesn't have it/,
    );
    expect(log).toContain('re-run that run');
    expect(world.writes()).toEqual([]);
  });

  it('only warns when npm or GitHub can’t be reached', async () => {
    const { code, log } = await check(['npm'], '0.8.0', services({ down: true }));
    expect(code).toBe(0);
    expect(log).toMatch(
      /^::warning::Could not check whether npm has onsystem@0\.8\.0: fetch failed/,
    );
  });
});

describe('check-published release, with no pending changesets', () => {
  const done = {
    npm: ['0.7.0', '0.8.0'],
    tags: { 'onsystem@0.8.0': MERGE, 'v0.8.0': MERGE, v0: MERGE },
    releases: ['onsystem@0.8.0', 'v0.8.0'],
  };

  it('does nothing when the version has its tags and releases, and v0 names its commit', async () => {
    const world = services(done);
    expect(await check(['release'], '0.8.0', world)).toMatchObject({
      code: 0,
      log: 'onsystem@0.8.0 has its tags and GitHub releases, and v0 names its commit: nothing to do.',
    });
    expect(world.writes()).toEqual([]);
  });

  // changesets/action published 0.8.0, and created its tag and GitHub release.
  it('after a publish, creates vX.Y.Z and its release, and moves v0, at the commit of the tag', async () => {
    const world = services({
      npm: ['0.7.0'],
      tags: { 'onsystem@0.7.0': BEFORE, 'onsystem@0.8.0': MERGE, v0: BEFORE },
      releases: ['onsystem@0.7.0', 'onsystem@0.8.0'],
    });
    const { code, log } = await check(['release'], '0.8.0', world, publishedHere('0.8.0'));
    expect(code).toBe(0);
    expect(log.split('\n').slice(0, 4)).toEqual([
      `npm has onsystem@0.8.0. At ${MERGE}, the commit onsystem@0.8.0 names, this run will:`,
      '- create the tag v0.8.0',
      '- create the GitHub release v0.8.0',
      `- move v0 from ${BEFORE}`,
    ]);
    expect(world.writes()).toEqual([
      {
        method: 'POST',
        url: `${API}/git/refs`,
        headers: expect.objectContaining({ authorization: 'Bearer token' }) as unknown,
        body: { ref: 'refs/tags/v0.8.0', sha: MERGE },
      },
      expect.objectContaining({
        method: 'POST',
        url: `${API}/releases`,
        body: {
          tag_name: 'v0.8.0',
          name: 'v0.8.0',
          body: actionNotes('dgesteves/onsystem', '0.8.0'),
          prerelease: false,
          // onsystem@0.8.0 stays the latest release (D-29 b).
          make_latest: 'false',
        },
      }),
      expect.objectContaining({
        method: 'PATCH',
        url: `${API}/git/refs/tags/v0`,
        body: { sha: MERGE, force: true },
      }),
    ]);
    expect(world.tags).toMatchObject({ 'v0.8.0': MERGE, v0: MERGE });
  });

  // The finding's case: npm took 0.8.0, then the GitHub release or the v0 move failed. The re-run
  // publishes nothing, so `published` is false and PUBLISHED_PACKAGES is [].
  it('on a re-run that publishes nothing, creates the missing release and tags, and moves v0', async () => {
    const world = services({
      npm: ['0.7.0', '0.8.0'],
      tags: { 'onsystem@0.8.0': MERGE, v0: BEFORE },
      releases: ['onsystem@0.7.0'],
    });
    const { code, log } = await check(['release'], '0.8.0', world, { PUBLISHED_PACKAGES: '[]' });
    expect(code).toBe(0);
    expect(log).toContain(
      [
        '- create the GitHub release onsystem@0.8.0, as the latest release',
        '- create the tag v0.8.0',
        '- create the GitHub release v0.8.0',
        `- move v0 from ${BEFORE}`,
      ].join('\n'),
    );
    expect(world.writes()[0]?.body).toEqual({
      tag_name: 'onsystem@0.8.0',
      name: 'onsystem@0.8.0',
      body: '### Minor Changes\n\n- [#174](https://github.com/dgesteves/onsystem/pull/174) A rule reports more.',
      prerelease: false,
      make_latest: 'true',
    });
    expect(world.releases).toEqual(['onsystem@0.7.0', 'onsystem@0.8.0', 'v0.8.0']);
    expect(world.tags).toMatchObject({ 'v0.8.0': MERGE, v0: MERGE });
    // The next run finds it all done.
    world.calls.length = 0;
    expect((await check(['release'], '0.8.0', world)).log).toContain('nothing to do');
    expect(world.writes()).toEqual([]);
  });

  // changesets/action only warns when it can't create a tag.
  it('tags the commit this run published when the publish left no tag', async () => {
    const world = services({ npm: ['0.7.0'], tags: { v0: BEFORE } });
    const { code } = await check(['release'], '0.8.0', world, publishedHere('0.8.0'));
    expect(code).toBe(0);
    expect(world.tags).toEqual({ 'onsystem@0.8.0': LATER, 'v0.8.0': LATER, v0: LATER });
  });

  // A re-run checks out the commit it published, but the next push's run checks out a later one,
  // which npm never got: the tags go where npm's provenance says.
  it('tags the commit npm’s provenance names, not a later push’s, for a version npm has', async () => {
    const world = services({
      npm: ['0.7.0', '0.8.0'],
      tags: { v0: BEFORE },
      provenance: { '0.8.0': attestations(MERGE) },
    });
    const { code, log } = await check(['release'], '0.8.0', world);
    expect(code).toBe(0);
    expect(log).toContain(`At ${MERGE}, the commit npm's provenance says it was published from`);
    expect(world.tags).toEqual({ 'onsystem@0.8.0': MERGE, 'v0.8.0': MERGE, v0: MERGE });
    // npm gets no GitHub token.
    const npm = world.calls.filter((call) => call.url.startsWith('https://registry.npmjs.org/'));
    for (const call of npm) expect(call.headers).toEqual({ accept: 'application/json' });
  });

  it('warns, and creates nothing, when no provenance names the commit npm’s version came from', async () => {
    for (const provenance of [{}, { '0.8.0': attestations(MERGE, 'someone/onsystem') }]) {
      const world = services({ npm: ['0.8.0'], provenance });
      const { code, log } = await check(['release'], '0.8.0', world);
      expect(code).toBe(0);
      expect(log).toMatch(
        /^::warning::npm has onsystem@0\.8\.0, and it has no tag, but no provenance/,
      );
      expect(world.writes()).toEqual([]);
    }
  });

  // A rollback makes the version before npm's latest and puts v0 back on it (RELEASING.md); the
  // next push to main, which still holds the bad version, must not move v0 forward again.
  it('leaves v0 where it is while npm’s latest is another version', async () => {
    const world = services({ ...done, latest: '0.7.0', tags: { ...done.tags, v0: BEFORE } });
    const { code, log } = await check(['release'], '0.8.0', world);
    expect(code).toBe(0);
    expect(log).toContain("npm's latest is 0.7.0, not 0.8.0, so v0 stays where it is");
    expect(world.writes()).toEqual([]);
    expect(world.tags.v0).toBe(BEFORE);
  });

  // D-29 (a): the Marketplace's "Use latest version" may follow the repository's latest release.
  it('marks vX.Y.Z as the latest release when RELEASE_ACTION_LATEST is true', async () => {
    const world = services({ ...done, releases: ['onsystem@0.8.0'] });
    await check(['release'], '0.8.0', world, { RELEASE_ACTION_LATEST: 'true' });
    expect(world.writes().map((call) => call.body?.make_latest)).toEqual(['true']);
  });

  // Whoever pinned v0.8.0 keeps the code they pinned.
  it('never moves a vX.Y.Z tag that names another commit', async () => {
    const world = services({ ...done, tags: { ...done.tags, 'v0.8.0': BEFORE } });
    const { code, log } = await check(['release'], '0.8.0', world);
    expect(code).toBe(0);
    expect(log).toMatch(
      /^::warning::v0\.8\.0 names 1d54d1e.*, not 8b1e5c0.*, the commit of onsystem@0\.8\.0/,
    );
    expect(world.writes()).toEqual([]);
  });

  it('creates the major version’s tag when there is none yet, as for 1.0.0', async () => {
    const changelog = '## 1.0.0\n\n- Stable.\n';
    const world = services({
      npm: ['0.8.0', '1.0.0'],
      tags: { 'onsystem@1.0.0': MERGE, v0: BEFORE },
      releases: ['onsystem@1.0.0'],
    });
    const lines: string[] = [];
    await run(['release'], {
      root: checkout('1.0.0', changelog),
      fetch: world.fetch,
      env: { GH_TOKEN: 'token' },
      log: (line) => lines.push(line),
    });
    expect(world.tags).toEqual({ 'onsystem@1.0.0': MERGE, 'v1.0.0': MERGE, v0: BEFORE, v1: MERGE });
    expect(world.writes().at(-1)?.body).toEqual({ ref: 'refs/tags/v1', sha: MERGE });
  });

  it('marks a prerelease as one, not as the latest, and moves no major tag for it', async () => {
    const changelog = '## 1.0.0-next.0\n\n- Early.\n';
    const world = services({ npm: ['0.8.0'], tags: { v0: BEFORE } });
    const lines: string[] = [];
    await run(['release'], {
      root: checkout('1.0.0-next.0', changelog),
      fetch: world.fetch,
      env: { GH_TOKEN: 'token', GITHUB_SHA: LATER, ...publishedHere('1.0.0-next.0') },
      log: (line) => lines.push(line),
    });
    const releases = world.writes().filter((call) => call.url.endsWith('/releases'));
    expect(releases.map((call) => call.body)).toEqual([
      expect.objectContaining({
        tag_name: 'onsystem@1.0.0-next.0',
        prerelease: true,
        make_latest: 'false',
      }),
      expect.objectContaining({
        tag_name: 'v1.0.0-next.0',
        prerelease: true,
        make_latest: 'false',
      }),
    ]);
    expect(world.tags).not.toHaveProperty('v1');
  });

  it('creates nothing for a version npm doesn’t have', async () => {
    const world = services({ npm: ['0.7.0'] });
    for (const published of ['[]', '', 'not json', '{}']) {
      const { code, log } = await check(['release'], '0.8.0', world, {
        PUBLISHED_PACKAGES: published,
      });
      expect(code).toBe(0);
      expect(log).toBe(
        "::notice::npm doesn't have onsystem@0.8.0, so it gets no tags or GitHub releases yet.",
      );
    }
    expect(world.writes()).toEqual([]);
  });

  it('fails without a CHANGELOG.md entry for the version, or a commit to tag', async () => {
    const noEntry = await check(
      ['release'],
      '0.8.1',
      services({ npm: ['0.8.1'], tags: { 'onsystem@0.8.1': MERGE } }),
    );
    expect(noEntry.code).toBe(1);
    expect(noEntry.log).toMatch(/^::error::CHANGELOG\.md has no entry for 0\.8\.1/);
    const noSha = await check(['release'], '0.8.0', services({}), {
      GITHUB_SHA: undefined,
      ...publishedHere('0.8.0'),
    });
    expect(noSha.code).toBe(1);
    expect(noSha.log).toMatch(/^::error::onsystem@0\.8\.0 has no tag, and GITHUB_SHA/);
  });

  // A re-run tries again, from what is still missing.
  it('throws when GitHub refuses a change, so the step fails', async () => {
    const world = services({ npm: ['0.8.0'], tags: { 'onsystem@0.8.0': MERGE }, refuse: 403 });
    await expect(check(['release'], '0.8.0', world)).rejects.toThrow(
      /^Could not create the GitHub release onsystem@0\.8\.0, as the latest release: 403 Forbidden$/,
    );
  });
});

describe('check-published release --dry-run', () => {
  it('says what it would create and move, and changes nothing', async () => {
    const world = services({
      npm: ['0.7.0', '0.8.0'],
      tags: { 'onsystem@0.8.0': MERGE, v0: BEFORE },
      releases: ['onsystem@0.8.0'],
    });
    const { code, log } = await check(['release', '--dry-run'], '0.8.0', world);
    expect(code).toBe(0);
    expect(log).toBe(
      [
        `npm has onsystem@0.8.0. At ${MERGE}, the commit onsystem@0.8.0 names, a run would:`,
        '- create the tag v0.8.0',
        '- create the GitHub release v0.8.0',
        `- move v0 from ${BEFORE}`,
      ].join('\n'),
    );
    expect(world.writes()).toEqual([]);
  });

  it('says a publish would come first for a version npm doesn’t have', async () => {
    const { log } = await check(['release', '--dry-run'], '0.8.0', services({ npm: ['0.7.0'] }));
    expect(log).toBe(
      "npm doesn't have onsystem@0.8.0: a publish would publish it, and changesets/action would create its tag and GitHub release.",
    );
  });
});

describe('check-published registry, with no pending changesets', () => {
  it('publishes nothing when the registry lists the version', async () => {
    const world = services({ npm: ['0.8.0'], listed: ['0.8.0'] });
    expect(await check(['registry'], '0.8.0', world)).toMatchObject({
      code: 0,
      log: 'The MCP Registry lists io.github.dgesteves/onsystem 0.8.0: nothing to publish.',
      output: 'publish=false\n',
    });
  });

  it('publishes a version npm serves as its latest, and the registry doesn’t list', async () => {
    const world = services({ npm: ['0.7.0', '0.8.0'], listed: ['0.7.0'] });
    const result = await check(['registry'], '0.8.0', world);
    expect(result).toMatchObject({ code: 0, output: 'publish=true\n', sleeps: [] });
    expect(result.log).toBe(
      "The MCP Registry doesn't list io.github.dgesteves/onsystem 0.8.0: the next step publishes server.json.",
    );
  });

  // The registry refuses a version npm doesn't serve, and npm can take minutes to serve a
  // version it has just accepted.
  it('waits for npm to serve a version this run published', async () => {
    const world = services({ npm: ['0.7.0'], servedAfter: { '0.8.0': 4 } });
    const result = await check(['registry'], '0.8.0', world, publishedHere('0.8.0'));
    expect(result).toMatchObject({ code: 0, output: 'publish=true\n' });
    expect(result.sleeps).toEqual([10_000, 10_000, 10_000]);
  });

  it('fails, saying to re-run, when npm never serves it, after about 5 minutes', async () => {
    const world = services({ npm: ['0.7.0'], servedAfter: { '0.8.0': 1000 } });
    const result = await check(['registry'], '0.8.0', world, publishedHere('0.8.0'));
    expect(result.code).toBe(1);
    expect(result.output).toBe('publish=false\n');
    expect(result.log).toMatch(/^::error::npm doesn't serve onsystem@0\.8\.0 yet/);
    expect(result.sleeps.reduce((sum, ms) => sum + ms, 0)).toBe(290_000);
  });

  it('publishes nothing, and doesn’t wait, for a version npm doesn’t have that this run didn’t publish', async () => {
    const world = services({ npm: ['0.7.0'] });
    const result = await check(['registry'], '0.8.0', world);
    expect(result).toMatchObject({
      code: 0,
      output: 'publish=false\n',
      sleeps: [],
      log: "::notice::npm doesn't have onsystem@0.8.0, so the MCP Registry gets nothing yet.",
    });
  });

  it('publishes nothing while npm’s latest is another version, after a rollback', async () => {
    const world = services({ npm: ['0.7.0', '0.8.0'], latest: '0.7.0' });
    const result = await check(['registry'], '0.8.0', world);
    expect(result).toMatchObject({ code: 0, output: 'publish=false\n' });
    expect(result.log).toContain(
      "npm's latest is 0.7.0, not 0.8.0, so the MCP Registry gets nothing",
    );
  });

  it('says what it would do in a dry run, and publishes nothing', async () => {
    const world = services({ npm: ['0.8.0'] });
    const result = await check(['registry', '--dry-run'], '0.8.0', world);
    expect(result).toMatchObject({
      code: 0,
      output: 'publish=false\n',
      log: "The MCP Registry doesn't list io.github.dgesteves/onsystem 0.8.0: a run would publish server.json.",
    });
  });
});
