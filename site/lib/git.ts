import { execFileSync } from 'node:child_process';
import path from 'node:path';

/**
 * When files in the repository last changed, from git at build time: the sitemap's lastmod and
 * the docs' "Last updated". Unknown (null) rather than wrong when git or the history is missing,
 * as in a shallow clone (Vercel's), where the oldest fetched commit seems to add every file.
 */

// The site builds from site/; the repository is its parent.
const REPO_ROOT = path.resolve(process.cwd(), '..');

function git(args: string[]): string | null {
  try {
    const out = execFileSync('git', ['--literal-pathspecs', ...args], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return out.trim() || null;
  } catch {
    return null;
  }
}

let shallow: boolean | undefined;

/** A shallow clone, whose oldest fetched commits have no parents and seem to add every file. */
function isShallow(): boolean {
  shallow ??= git(['rev-parse', '--is-shallow-repository']) === 'true';
  return shallow;
}

const cache = new Map<string, Date | null>();

/** The date of the last commit that changed any of `paths` (relative to the repository root). */
export function lastModified(paths: readonly string[]): Date | null {
  const key = paths.join('\0');
  const cached = cache.get(key);
  if (cached !== undefined) return cached;
  // The commit's date and its parents: none for a root commit, or a shallow clone's oldest one.
  const out = git(['log', '-1', '--format=%cI %P', '--', ...paths]);
  const [date = '', ...parents] = out?.split(' ') ?? [];
  const known = date && (parents.length > 0 || !isShallow()) ? new Date(date) : null;
  const result = known && !Number.isNaN(known.getTime()) ? known : null;
  cache.set(key, result);
  return result;
}
