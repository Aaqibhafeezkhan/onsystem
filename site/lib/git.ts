import { execFileSync } from 'node:child_process';
import path from 'node:path';

/**
 * When files in the repository last changed, from git at build time: the sitemap's lastmod and
 * the docs' "Last updated". Unknown (null) rather than wrong when git or the history is missing,
 * as in a shallow clone (Vercel's), where the oldest fetched commit seems to add every file.
 */

// The site builds from site/; the repository is its parent.
const REPO_ROOT = path.resolve(process.cwd(), '..');

function git(root: string, args: string[]): string | null {
  try {
    const out = execFileSync('git', ['--literal-pathspecs', ...args], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return out.trim() || null;
  } catch {
    return null;
  }
}

const shallow = new Map<string, boolean>();

/** A shallow clone, whose oldest fetched commits have no parents and seem to add every file. */
function isShallow(root: string): boolean {
  let known = shallow.get(root);
  if (known === undefined) {
    known = git(root, ['rev-parse', '--is-shallow-repository']) === 'true';
    shallow.set(root, known);
  }
  return known;
}

const cache = new Map<string, Date | null>();

/**
 * The date of the last commit that changed any of `paths`, relative to the repository root
 * (`root`, this repository by default).
 */
export function lastModified(paths: readonly string[], root = REPO_ROOT): Date | null {
  const key = [root, ...paths].join('\0');
  const cached = cache.get(key);
  if (cached !== undefined) return cached;
  // The commit's date and its parents: none for a root commit, or a shallow clone's oldest one.
  const out = git(root, ['log', '-1', '--format=%cI %P', '--', ...paths]);
  const [date = '', ...parents] = out?.split(' ') ?? [];
  const known = date && (parents.length > 0 || !isShallow(root)) ? new Date(date) : null;
  const result = known && !Number.isNaN(known.getTime()) ? known : null;
  cache.set(key, result);
  return result;
}
