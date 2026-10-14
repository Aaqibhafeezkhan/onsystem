import fs from 'node:fs';
import path from 'node:path';

import changelog from '@changesets/changelog-github';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parse } from 'yaml';

// The next release, as `changeset version` writes it into CHANGELOG.md and the release notes.
// Each test reads a pending changeset and skips once a release has consumed it.
const root = path.resolve(import.meta.dirname, '..');
const changesetPath = (name: string) => path.join(root, '.changeset', name);

function readChangeset(name: string): { releases: Record<string, string>; summary: string } {
  const text = fs.readFileSync(changesetPath(name), 'utf8');
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text);
  if (!match) throw new Error(`${name} has no front matter`);
  return {
    releases: parse(match[1] ?? '') as Record<string, string>,
    summary: (match[2] ?? '').trim(),
  };
}

describe.skipIf(!fs.existsSync(changesetPath('shared-tailwind-config.md')))(
  'the shared Tailwind config change (#107)',
  () => {
    // 0.6.0 ran no color rule in a project that keeps its tokens in such a package ("No color
    // tokens found"), and this change reports its colors: in Dub's apps/web, 10,024 errors and
    // 164 warnings that a baseline written with 0.6.0 does not hold. A patch would reach every
    // `^0.6.0` range and fail its CI with no word of why.
    it('is a minor release', () => {
      expect(readChangeset('shared-tailwind-config.md').releases).toEqual({ onsystem: 'minor' });
    });

    it('says what to expect when upgrading, and how', () => {
      const { summary } = readChangeset('shared-tailwind-config.md');
      expect(summary).toContain('Upgrading from 0.6.0');
      expect(summary).toContain('onsystem check . --update-baseline');
      expect(summary).toContain('--max-warnings');
      expect(summary).toContain('pin it to a commit SHA');
    });
  },
);

describe.skipIf(!fs.existsSync(changesetPath('svg-mask-stops.md')))(
  'the SVG mask stops fix (#110)',
  () => {
    afterEach(() => {
      vi.unstubAllGlobals();
      vi.unstubAllEnvs();
    });

    // What GitHub's API says about the pull request and the commit that added the changeset
    // (#111), which is where the changelog generator looks unless the changeset names its own.
    const user = (login: string) => ({ login, url: `https://github.com/${login}` });
    const commitUrl = (sha: string) => `https://github.com/dgesteves/onsystem/commit/${sha}`;
    const github = {
      pull__110: {
        url: 'https://github.com/dgesteves/onsystem/pull/110',
        author: user('CRYPTONIKAV'),
        mergeCommit: {
          abbreviatedOid: 'b06d065',
          commitUrl: commitUrl('b06d06540122843f1958dba9cd5f87bcb85ce98d'),
        },
      },
      commit__641d22dbfc7c0af83abbdc0b7956f6808747a801: {
        commitUrl: commitUrl('641d22dbfc7c0af83abbdc0b7956f6808747a801'),
        associatedPullRequests: {
          nodes: [
            {
              number: 111,
              url: 'https://github.com/dgesteves/onsystem/pull/111',
              mergedAt: '2026-10-13T09:38:47Z',
              author: user('dgesteves'),
            },
          ],
        },
        author: { user: user('dgesteves') },
      },
    };

    it('thanks the contributor who wrote it in its release line', async () => {
      // A stand-in token: the fetch below answers in place of GitHub, so nothing goes out.
      vi.stubEnv('GITHUB_TOKEN', 'test');
      vi.stubEnv('GITHUB_SERVER_URL', 'https://github.com');
      vi.stubEnv('GITHUB_GRAPHQL_URL', 'https://api.github.com/graphql');
      vi.stubGlobal('fetch', () => Promise.resolve(Response.json({ data: { repo__0: github } })));

      const line = await changelog.getReleaseLine(
        {
          id: 'svg-mask-stops',
          summary: readChangeset('svg-mask-stops.md').summary,
          releases: [{ name: 'onsystem', type: 'patch' }],
          commit: '641d22dbfc7c0af83abbdc0b7956f6808747a801',
        },
        'patch',
        { repo: 'dgesteves/onsystem' },
      );

      expect(line).toContain(
        '[#110](https://github.com/dgesteves/onsystem/pull/110) [`b06d065`](https://github.com/dgesteves/onsystem/commit/b06d06540122843f1958dba9cd5f87bcb85ce98d) Thanks [@CRYPTONIKAV](https://github.com/CRYPTONIKAV)! - `no-hardcoded-color` no longer flags',
      );
      expect(line).not.toContain('@dgesteves');
    });
  },
);
