import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The changelog entries `changeset version` writes, from the module .changeset/config.json names,
// loaded as changesets loads it. Each entry links its pull request and commit, and thanks whoever
// wrote the changeset, except the maintainer: CHANGELOG.md has "Thanks [@dgesteves](...)!" on
// nearly every entry, and so did the release pull requests and the GitHub releases (23 times in
// 0.7.0's). GitHub's GraphQL API is a stand-in here.

interface Changeset {
  id: string;
  summary: string;
  releases: { name: string; type: string }[];
  commit?: string;
}
type Options = Record<string, unknown>;
interface Changelog {
  getReleaseLine: (changeset: Changeset, type: string, options: Options) => Promise<string>;
  getDependencyReleaseLine: (
    changesets: Changeset[],
    dependencies: unknown[],
    options: Options,
  ) => Promise<string>;
}

const root = path.resolve(import.meta.dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root, '.changeset/config.json'), 'utf8')) as {
  changelog: [string, Options];
};
const [specifier, options] = config.changelog;
// As @changesets/apply-release-plan resolves it: from the .changeset directory.
const resolved = createRequire(path.join(root, '.changeset', 'x.mjs')).resolve(specifier);
const changelog = ((await import(pathToFileURL(resolved).href)) as { default: Changelog }).default;

/** Who wrote each commit, and in which pull request, as GitHub's GraphQL API answers. */
const COMMITS: Record<string, { pull: number; author: string }> = {
  '9ecb46d7de5eea5ab5c259e0228ad5bc6cdafb35': { pull: 107, author: 'dgesteves' },
  b06d06540122843f1958dba9cd5f87bcb85ce98d: { pull: 110, author: 'CRYPTONIKAV' },
  '641d22dbfc7c0af83abbdc0b7956f6808747a801': { pull: 111, author: 'DGEsteves' },
};

beforeEach(() => {
  // A stand-in token: the fetch below answers in place of GitHub, so nothing goes out.
  vi.stubEnv('GITHUB_TOKEN', 'test');
  vi.stubEnv('GITHUB_SERVER_URL', 'https://github.com');
  vi.stubEnv('GITHUB_GRAPHQL_URL', 'https://api.github.com/graphql');
  vi.stubGlobal('fetch', (_url: string, init: { body: string }) => {
    const { query } = JSON.parse(init.body) as { query: string };
    const repo__0: Record<string, unknown> = {};
    for (const [, sha = ''] of query.matchAll(/commit__(\w+): object/g)) {
      const commit = COMMITS[sha];
      if (!commit) continue;
      const author = { login: commit.author, url: `https://github.com/${commit.author}` };
      repo__0[`commit__${sha}`] = {
        commitUrl: `https://github.com/dgesteves/onsystem/commit/${sha}`,
        associatedPullRequests: {
          nodes: [
            {
              number: commit.pull,
              url: `https://github.com/dgesteves/onsystem/pull/${String(commit.pull)}`,
              mergedAt: '2026-10-15T00:00:00Z',
              author,
            },
          ],
        },
        author: { user: author },
      };
    }
    return Promise.resolve(Response.json({ data: { repo__0 } }));
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const line = (summary: string, commit?: string) =>
  changelog.getReleaseLine(
    {
      id: 'a-changeset',
      summary,
      releases: [{ name: 'onsystem', type: 'patch' }],
      ...(commit ? { commit } : {}),
    },
    'patch',
    options,
  );

const pr = (n: number) =>
  `[#${String(n)}](https://github.com/dgesteves/onsystem/pull/${String(n)})`;
const sha = (full: string) =>
  `[\`${full.slice(0, 7)}\`](https://github.com/dgesteves/onsystem/commit/${full})`;

describe('the changelog', () => {
  it('links the pull request and the commit, and doesn’t thank the maintainer', async () => {
    expect(
      await line('Zero config finds the tokens.', '9ecb46d7de5eea5ab5c259e0228ad5bc6cdafb35'),
    ).toBe(
      `\n\n- ${pr(107)} ${sha('9ecb46d7de5eea5ab5c259e0228ad5bc6cdafb35')} - Zero config finds the tokens.\n`,
    );
  });

  it('leaves out the maintainer however GitHub cases the login', async () => {
    expect(await line('A fix.', '641d22dbfc7c0af83abbdc0b7956f6808747a801')).not.toContain(
      'Thanks',
    );
  });

  // #110, the merge commit of a contributor's pull request.
  it('thanks anyone else who wrote a changeset', async () => {
    expect(await line('SVG mask stops.', 'b06d06540122843f1958dba9cd5f87bcb85ce98d')).toBe(
      `\n\n- ${pr(110)} ${sha('b06d06540122843f1958dba9cd5f87bcb85ce98d')} ` +
        'Thanks [@CRYPTONIKAV](https://github.com/CRYPTONIKAV)! - SVG mask stops.\n',
    );
  });

  // A changeset can name its authors on `author:` lines.
  it('keeps the other authors a changeset names', async () => {
    expect(
      await line(
        'author: @dgesteves\nauthor: @CRYPTONIKAV\nA fix.',
        '9ecb46d7de5eea5ab5c259e0228ad5bc6cdafb35',
      ),
    ).toBe(
      `\n\n- ${pr(107)} ${sha('9ecb46d7de5eea5ab5c259e0228ad5bc6cdafb35')} ` +
        'Thanks [@CRYPTONIKAV](https://github.com/CRYPTONIKAV)! - A fix.\n',
    );
  });

  it('keeps the lines after the first, and a "Thanks" in the text', async () => {
    expect(
      await line(
        'author: @dgesteves\nThanks [@dgesteves](https://github.com/dgesteves)! - a quote.\n\nMore.',
      ),
    ).toBe('\n\n- Thanks [@dgesteves](https://github.com/dgesteves)! - a quote.\n  \n  More.');
  });

  it('writes the dependency lines as @changesets/changelog-github does', async () => {
    expect(await changelog.getDependencyReleaseLine([], [], options)).toBe('');
  });
});
