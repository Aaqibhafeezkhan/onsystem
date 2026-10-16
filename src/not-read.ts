import fs from 'node:fs';
import path from 'node:path';

import type { DesignSystem } from './design-system.js';
import { nodeModulesFor } from './explain.js';
import { LIBRARIES, libraryTitle } from './libraries/index.js';
import { plural } from './util/strings.js';

/** A project a run read: its design system and, at a monorepo root, its folder. */
export interface ReadProject {
  ds: DesignSystem;
  dir?: string | undefined;
}

const LIMITS_DOCS = 'https://onsystem.vercel.app/docs/how-it-works#limits';

/**
 * What `check` and `check_ui` could not read, said after the results as the notice for missing
 * components and tokens is, so a clean result is not mistaken for a checked one: a component
 * library the project depends on that onsystem does not read yet, and dependencies that are not
 * installed. Projects with the same gap share one notice that names them.
 */
export function notReadNotices(projects: readonly ReadProject[]): string[] {
  return [...unreadLibraries(projects), missingDependencies(projects)].filter(
    (notice): notice is string => notice !== undefined,
  );
}

/**
 * A component library onsystem does not read yet (Chakra UI, Mantine), in a project without
 * components of its own, whose code is then checked by the accessibility rule alone. One notice
 * per set of libraries.
 */
function unreadLibraries(projects: readonly ReadProject[]): string[] {
  const groups = new Map<string, { packages: string[]; dirs: string[] }>();
  for (const { ds, dir } of projects) {
    const packages = (ds.config.librariesUnread ?? []).map((library) => library.package);
    if (!packages.length || ds.components.length) continue;
    const key = packages.join(' ');
    const group = groups.get(key) ?? { packages, dirs: [] };
    if (dir !== undefined) group.dirs.push(dir);
    groups.set(key, group);
  }
  return [...groups.values()].map(({ packages, dirs }) => {
    const one = packages.length === 1;
    const names = listOf(
      packages.map((name) => `${libraryTitle(name)} (${name})`),
      packages.length,
    );
    const of = dirs.length ? ` of ${listOf(dirs)}` : '';
    return (
      `${names} ${one ? 'is a dependency' : 'are dependencies'}${of}, but onsystem does not read ${one ? 'it' : 'them'} yet: ` +
      `of the published component libraries, it reads only ${LIBRARIES.map((l) => l.title).join(', ')} so far. Wrap ${one ? 'its' : 'their'} components in your own and point "components" in the config at those. See ${LIMITS_DOCS}`
    );
  });
}

/**
 * Dependencies that are not installed: no `node_modules` at or above a project that declares
 * some, so the props of components that come from them (Radix, React's own) do not resolve and
 * `no-unknown-prop` skips those components. For plain `inspect` too, on stderr.
 */
export function missingDependencies(projects: readonly ReadProject[]): string | undefined {
  const dirs: string[] = [];
  let skipped = 0;
  for (const { ds, dir } of projects) {
    if (ds.config.rules['no-unknown-prop'].severity === 'off') continue;
    const open = ds.components.filter((c) => c.openProps).length;
    if (!open || nodeModulesFor(ds.config.root) || !declaresDependencies(ds.config.root)) continue;
    skipped += open;
    if (dir !== undefined) dirs.push(dir);
  }
  if (!skipped) return undefined;
  const of = dirs.length ? ` of ${listOf(dirs)}` : '';
  return `The dependencies${of} are not installed (no node_modules): no-unknown-prop skips ${plural(skipped, 'component')} whose props come from them. Install them (npm install, pnpm install) and run again.`;
}

/** Whether `root`'s package.json lists dependencies, devDependencies or peerDependencies. */
function declaresDependencies(root: string): boolean {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as Record<
      string,
      unknown
    >;
    return ['dependencies', 'devDependencies', 'peerDependencies'].some((field) => {
      const value = pkg[field];
      return Boolean(value && typeof value === 'object' && Object.keys(value).length);
    });
  } catch {
    return false;
  }
}

/** `apps/web`, `apps/web and packages/ui`, `a, b, c and 4 more`. */
function listOf(items: readonly string[], max = 3): string {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length <= max) return `${items.slice(0, -1).join(', ')} and ${items.at(-1) ?? ''}`;
  return `${items.slice(0, max).join(', ')} and ${items.length - max} more`;
}
