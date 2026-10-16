// What the release workflow (.github/workflows/release.yml) checks, and completes, on npm, GitHub
// and the MCP Registry for the version of onsystem on main. RELEASING.md says when each runs, and
// what to do when one fails.
//
//   node scripts/check-published.mjs npm
//     With pending changesets, the version on main is the last release: npm has it, or it has its
//     tag (npm can take minutes to serve a version it has just accepted). With neither, the
//     Release run for the release pull request's merge was replaced before it started, or its
//     publish failed, and that version was never published: exit 1.
//
//   node scripts/check-published.mjs release [--dry-run]
//     With no pending changesets, when npm has the version (or this run published it, as
//     PUBLISHED_PACKAGES says), creates what it lacks of:
//     - the tag onsystem@X.Y.Z, and its GitHub release, with the version's CHANGELOG.md entry;
//     - the tag vX.Y.Z, and its GitHub release, the one the Marketplace lists: a `uses:` ref
//       can't hold an @, so `uses: dgesteves/onsystem@onsystem@X.Y.Z` doesn't run. Not marked as
//       the latest release unless RELEASE_ACTION_LATEST is 'true';
//     and moves v0 (vX for version X.Y.Z), which `uses: dgesteves/onsystem@v0` runs, to the
//     version's commit, while npm's latest is this version: after a rollback, npm's latest is
//     the version before it, and v0 stays where the rollback put it.
//     Each goes on the commit the version was published from: the commit of the tag
//     onsystem@X.Y.Z when it exists, GITHUB_SHA when this run published it, or else the commit
//     npm's provenance for it names (a later push's GITHUB_SHA is code npm never got). Without
//     provenance, it warns and creates nothing. changesets/action creates onsystem@X.Y.Z and its
//     release after a publish; this creates the rest, and covers a publish whose tags or releases
//     failed, on a re-run (which publishes nothing new) or on the next push. With --dry-run it
//     says what it would create or move, and changes nothing.
//
//   node scripts/check-published.mjs registry [--dry-run]
//     With no pending changesets, whether to publish server.json to the MCP Registry: writes
//     publish=true to GITHUB_OUTPUT when the registry doesn't list the version, npm serves it and
//     it is npm's latest; publish=false otherwise. The registry checks that npm serves the
//     version, so when this run published it, this waits for npm first, about 5 minutes at most.
//
// Environment: VERSION (the version on main, read before changesets/action, which switches to the
// release branch and versions the package there; package.json's version by default), GH_TOKEN
// (without it, GitHub is read anonymously and nothing can be created), GITHUB_REPOSITORY
// (dgesteves/onsystem by default), GITHUB_SHA, GITHUB_API_URL, GITHUB_OUTPUT, NPM_REGISTRY
// (https://registry.npmjs.org by default), MCP_REGISTRY (https://registry.modelcontextprotocol.io
// by default), PUBLISHED_PACKAGES (changesets/action's `published-packages` output,
// [{ "name", "version" }]) and RELEASE_ACTION_LATEST.
import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.join(import.meta.dirname, '..');
const TIMEOUT_MS = 30_000;
const SLSA_PROVENANCE = 'https://slsa.dev/provenance/v1';
// How long the registry step waits for npm to serve a version this run published: 30 tries 10
// seconds apart, as the workflow waited before.
const NPM_TRIES = 30;
const NPM_WAIT_MS = 10_000;

/**
 * The commit that npm's attestations for a version (the JSON of
 * `/-/npm/v1/attestations/<name>@<version>`) say it was built from in `repo`: the release workflow
 * publishes with provenance, an SLSA statement whose resolved dependency is the checkout, as
 * `git+https://github.com/<repo>@<ref>` with its `gitCommit`. undefined when they name none.
 */
export function provenanceCommit(attestations, repo) {
  for (const attestation of Array.isArray(attestations?.attestations)
    ? attestations.attestations
    : []) {
    if (attestation?.predicateType !== SLSA_PROVENANCE) continue;
    let statement;
    try {
      statement = JSON.parse(
        Buffer.from(attestation.bundle.dsseEnvelope.payload, 'base64').toString('utf8'),
      );
    } catch {
      continue;
    }
    const dependencies = statement?.predicate?.buildDefinition?.resolvedDependencies;
    for (const dependency of Array.isArray(dependencies) ? dependencies : []) {
      const commit = dependency?.digest?.gitCommit;
      if (
        typeof dependency?.uri === 'string' &&
        dependency.uri.startsWith(`git+https://github.com/${repo}@`) &&
        typeof commit === 'string' &&
        /^[0-9a-f]{40}$/.test(commit)
      ) {
        return commit;
      }
    }
  }
  return undefined;
}

/**
 * The entry for `version` in a CHANGELOG.md, without its heading, found as changesets/action finds
 * the notes of the releases it creates: from the heading that reads `version` to the next heading
 * of its depth, skipping fenced code.
 */
export function changelogEntry(changelog, version) {
  const heading = /^(#{1,6})\s(.*)$|^(`{3,})/gm;
  let start;
  let end;
  for (let match; (match = heading.exec(changelog)) !== null;) {
    if (match[3]) {
      const fence = new RegExp(`^${match[3]}`, 'gm');
      fence.lastIndex = heading.lastIndex;
      if (!fence.exec(changelog)) break;
      heading.lastIndex = fence.lastIndex;
      continue;
    }
    const depth = match[1].length;
    if (match[2].trim() === version) {
      start = { index: heading.lastIndex, depth };
    } else if (start && depth === start.depth) {
      end = match.index;
      break;
    }
  }
  return start ? changelog.slice(start.index, end).trim() : undefined;
}

/** The notes of the release vX.Y.Z, the GitHub Action's: how to pin it, and where the notes are. */
export function actionNotes(repo, version) {
  const major = version.split('.')[0];
  return (
    `onsystem's GitHub Action at ${version}. Pin it with \`uses: ${repo}@v${version}\`, ` +
    `or use \`@v${major}\` to follow each release.\n\n` +
    `Release notes: https://github.com/${repo}/releases/tag/onsystem%40${version}`
  );
}

/**
 * Runs `npm`, `release` or `registry` (see the top of this file) and returns the exit code. Lines
 * for the log, `::error::`, `::warning::` and `::notice::` annotations included, go to `log`.
 */
export async function run(
  argv,
  {
    env = process.env,
    fetch = globalThis.fetch,
    root = ROOT,
    log = console.log,
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  } = {},
) {
  const [command] = argv;
  const dryRun = argv.includes('--dry-run');
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const { name } = pkg;
  const version = env.VERSION || pkg.version;
  const tag = `${name}@${version}`;
  const actionTag = `v${version}`;
  const majorTag = `v${version.split('.')[0]}`;
  const prerelease = version.includes('-');
  const repo = env.GITHUB_REPOSITORY || 'dgesteves/onsystem';
  const api = `${env.GITHUB_API_URL || 'https://api.github.com'}/repos/${repo}`;
  const registry = (env.NPM_REGISTRY || 'https://registry.npmjs.org').replace(/\/$/, '');
  const mcpRegistry = (env.MCP_REGISTRY || 'https://registry.modelcontextprotocol.io').replace(
    /\/$/,
    '',
  );
  const headers = {
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
    'user-agent': 'onsystem-release',
    ...(env.GH_TOKEN ? { authorization: `Bearer ${env.GH_TOKEN}` } : {}),
  };
  // npm and the MCP Registry get no GitHub token.
  const plain = { accept: 'application/json' };

  /** The JSON at `url`, or undefined when it isn't there (404). Any other answer throws. */
  const read = async (url, init) => {
    const response = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (response.status === 404) return undefined;
    if (!response.ok)
      throw new Error(`${url} answered ${response.status}: ${await response.text()}`);
    return response.json();
  };
  const exists = async (url, init) => (await read(url, init)) !== undefined;
  /** Sends `body` to the GitHub API to `change` something, and throws when GitHub refuses it. */
  const send = async (method, url, body, change) => {
    const response = await fetch(url, {
      method,
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`Could not ${change}: ${response.status} ${await response.text()}`);
    }
    return response.json();
  };

  const onNpm = () => exists(`${registry}/${name}/${version}`, { headers: plain });
  const npmLatest = async () =>
    (await read(`${registry}/-/package/${name}/dist-tags`, { headers: plain }))?.latest;
  /** The commit a tag names, or undefined when there is no such tag. */
  const tagCommit = async (tagName) => {
    const ref = await read(`${api}/git/ref/tags/${encodeURIComponent(tagName)}`, { headers });
    if (!ref) return undefined;
    // An annotated tag names a tag object, which names the commit.
    if (ref.object.type === 'tag') {
      return (await read(`${api}/git/tags/${ref.object.sha}`, { headers }))?.object?.sha;
    }
    return ref.object.sha;
  };
  const hasRelease = (tagName) =>
    exists(`${api}/releases/tags/${encodeURIComponent(tagName)}`, { headers });
  /** The commit npm's provenance says the version was published from, or undefined. */
  const publishedFrom = async () =>
    provenanceCommit(
      await read(`${registry}/-/npm/v1/attestations/${name}@${version}`, { headers: plain }),
      repo,
    );
  const publishedHere = () => {
    let published;
    try {
      published = JSON.parse(env.PUBLISHED_PACKAGES || '[]');
    } catch {
      // Not changesets/action's JSON: read npm instead.
    }
    return (
      Array.isArray(published) &&
      published.some((entry) => entry?.name === name && entry?.version === version)
    );
  };
  const output = (key, value) => {
    if (env.GITHUB_OUTPUT) fs.appendFileSync(env.GITHUB_OUTPUT, `${key}=${value}\n`);
  };

  if (command === 'npm') {
    let released;
    try {
      released = (await onNpm()) || (await tagCommit(tag)) !== undefined;
    } catch (error) {
      // This runs after the release pull request is updated, so a registry or API outage only warns.
      log(`::warning::Could not check whether npm has ${tag}: ${error.message}`);
      return 0;
    }
    if (released) {
      log(`npm has ${tag}, or it has its tag: the version on main was released.`);
      return 0;
    }
    log(
      `::error::${tag} is the version on main, but npm doesn't have it and it has no tag, so it was never published. ` +
        'The Release run for the merge of its release pull request was replaced by a newer run before it started, ' +
        'or its publish failed: re-run that run. RELEASING.md has the steps.',
    );
    return 1;
  }

  if (command === 'release') {
    const here = publishedHere();
    if (!here && !(await onNpm())) {
      log(
        dryRun
          ? `npm doesn't have ${tag}: a publish would publish it, and changesets/action would create its tag and GitHub release.`
          : `::notice::npm doesn't have ${tag}, so it gets no tags or GitHub releases yet.`,
      );
      return 0;
    }

    // The commit the version was published from, where every tag goes.
    const tagged = await tagCommit(tag);
    let commit = tagged;
    let where = `the commit ${tag} names`;
    if (!commit && here) {
      commit = env.GITHUB_SHA;
      where = 'the commit this run published';
      if (!commit) {
        log(`::error::${tag} has no tag, and GITHUB_SHA doesn't say which commit to tag.`);
        return 1;
      }
    } else if (!commit) {
      commit = await publishedFrom();
      where = "the commit npm's provenance says it was published from";
      if (!commit) {
        log(
          `::warning::npm has ${tag}, and it has no tag, but no provenance names the commit it was published ` +
            `from, so ${dryRun ? 'a run would create' : 'this run creates'} no tag or release for it. Create them ` +
            'by hand at the merge commit of its release pull request: RELEASING.md has the commands.',
        );
        return 0;
      }
    }

    /** What is missing, in the order it is made: [what to do, how]. */
    const todo = [];
    const createTag = (tagName) => {
      const change = `create the tag ${tagName}`;
      return [
        change,
        () => send('POST', `${api}/git/refs`, { ref: `refs/tags/${tagName}`, sha: commit }, change),
      ];
    };
    const createRelease = (tagName, body, latest) => {
      const change = `create the GitHub release ${tagName}${latest ? ', as the latest release' : ''}`;
      const release = {
        tag_name: tagName,
        name: tagName,
        body,
        prerelease,
        make_latest: String(latest),
      };
      return [change, () => send('POST', `${api}/releases`, release, change)];
    };

    if (!tagged) todo.push(createTag(tag));
    if (!(await hasRelease(tag))) {
      const notes = changelogEntry(
        fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8'),
        version,
      );
      if (!notes) {
        log(
          `::error::CHANGELOG.md has no entry for ${version}, the notes of the GitHub release ${tag}.`,
        );
        return 1;
      }
      todo.push(createRelease(tag, notes, !prerelease));
    }

    const actionCommit = await tagCommit(actionTag);
    if (!actionCommit) {
      todo.push(createTag(actionTag));
    } else if (actionCommit !== commit) {
      // Whoever pins a version's tag expects its code never to change.
      log(
        `::warning::${actionTag} names ${actionCommit}, not ${commit}, the commit of ${tag}. ` +
          'A version tag is never moved, so it stays: RELEASING.md says what to check.',
      );
    }
    if (!(await hasRelease(actionTag))) {
      const latest = !prerelease && env.RELEASE_ACTION_LATEST === 'true';
      todo.push(createRelease(actionTag, actionNotes(repo, version), latest));
    }

    // changeset publish makes what it publishes npm's latest, unless it is a prerelease.
    const latest = here ? (prerelease ? undefined : version) : await npmLatest();
    if (latest === version) {
      const majorCommit = await tagCommit(majorTag);
      if (!majorCommit) {
        todo.push(createTag(majorTag));
      } else if (majorCommit !== commit) {
        const change = `move ${majorTag} from ${majorCommit}`;
        todo.push([
          change,
          () =>
            send(
              'PATCH',
              `${api}/git/refs/tags/${encodeURIComponent(majorTag)}`,
              { sha: commit, force: true },
              change,
            ),
        ]);
      }
    } else {
      log(
        `npm's latest is ${latest ?? 'no version'}, not ${version}, so ${majorTag} stays where it is: ` +
          'after a rollback (RELEASING.md), it names the version npm gives.',
      );
    }

    if (todo.length === 0) {
      log(
        `${tag} has its tags and GitHub releases, and ${majorTag} names its commit: nothing to do.`,
      );
      return 0;
    }
    const list = todo.map(([change]) => `- ${change}`).join('\n');
    if (dryRun) {
      log(`npm has ${tag}. At ${commit}, ${where}, a run would:\n${list}`);
      return 0;
    }
    log(`npm has ${tag}. At ${commit}, ${where}, this run will:\n${list}`);
    for (const [change, make] of todo) {
      const result = await make();
      log(`Done: ${change}${result?.html_url ? `, ${result.html_url}` : ''}.`);
    }
    return 0;
  }

  if (command === 'registry') {
    const server = JSON.parse(fs.readFileSync(path.join(root, 'server.json'), 'utf8'));
    const entry = `${server.name} ${version}`;
    // The lookup by name and version: the registry's search takes seconds.
    const listed = await exists(
      `${mcpRegistry}/v0.1/servers/${encodeURIComponent(server.name)}/versions/${encodeURIComponent(version)}`,
      { headers: plain },
    );
    if (listed) {
      log(`The MCP Registry lists ${entry}: nothing to publish.`);
      output('publish', 'false');
      return 0;
    }
    const here = publishedHere();
    let served = await onNpm();
    for (let attempt = 1; !served && here && !dryRun && attempt < NPM_TRIES; attempt++) {
      await sleep(NPM_WAIT_MS);
      served = await onNpm();
    }
    if (!served) {
      output('publish', 'false');
      if (here && !dryRun) {
        log(
          `::error::npm doesn't serve ${tag} yet, and the MCP Registry only lists a version npm serves. ` +
            `Re-run this job once \`npm view ${tag} version\` prints it: RELEASING.md has the steps.`,
        );
        return 1;
      }
      log(
        dryRun
          ? `npm doesn't have ${tag}: a publish would publish it, then server.json to the MCP Registry.`
          : `::notice::npm doesn't have ${tag}, so the MCP Registry gets nothing yet.`,
      );
      return 0;
    }
    const latest = here ? (prerelease ? undefined : version) : await npmLatest();
    if (latest !== version) {
      log(
        `npm's latest is ${latest ?? 'no version'}, not ${version}, so the MCP Registry gets nothing: ` +
          'it would list this version as the latest (RELEASING.md, rolling back).',
      );
      output('publish', 'false');
      return 0;
    }
    log(
      dryRun
        ? `The MCP Registry doesn't list ${entry}: a run would publish server.json.`
        : `The MCP Registry doesn't list ${entry}: the next step publishes server.json.`,
    );
    output('publish', String(!dryRun));
    return 0;
  }

  log('Usage: node scripts/check-published.mjs npm | release [--dry-run] | registry [--dry-run]');
  return 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  try {
    process.exitCode = await run(process.argv.slice(2));
  } catch (error) {
    console.log(`::error::${error.message}`);
    process.exitCode = 1;
  }
}
