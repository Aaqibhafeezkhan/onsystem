import fs from 'node:fs';
import path from 'node:path';

import { declarationsPackages } from '../detect.js';
import type { ComponentInfo, Token } from '../types.js';
import { mui } from './mui.js';

/**
 * How to read a package's components from its type declarations: its package, how to read its
 * declarations and the theme an app gives it. A design-system package published without its
 * sources has one of its own ({@link packageAdapter}); a published library has a
 * {@link LibraryAdapter}.
 */
export interface DeclarationsAdapter {
  /** The package apps depend on and import components from: `@mui/material`. */
  package: string;
  /** Its name, for `inspect` and messages: `MUI`. */
  title: string;
  /**
   * Source that augments the library's types, which the app's own files can do to add or remove
   * variant values (`declare module "@mui/material/Button"`). Files that match are read with the
   * declarations, so the values they add are allowed.
   */
  augments: RegExp;
  /** A component's description from its JSDoc, or undefined for none. Default: the JSDoc as is. */
  describe?(jsdoc: string, name: string): string | undefined;
  /** What the library's types do not say about a component: a child its Tooltip labels. */
  annotate?(component: ComponentInfo): void;
  /** The theme the app creates for the library, read from its source: tokens and added values. */
  theme?: ThemeReader;
}

/**
 * A published component library that onsystem reads from its type declarations rather than
 * from source: what an app gets from `npm install`, with no components folder of its own. Each
 * library is an adapter. MUI is the first; Chakra UI, Mantine, HeroUI and Radix Themes fit the
 * same shape.
 */
export interface LibraryAdapter extends DeclarationsAdapter {
  /** Its id in the config's `libraries` list: `mui`. */
  id: LibraryId;
}

/** Reads the app's theme from the source files that `matches` selects. */
export interface ThemeReader {
  /** Which files to read. */
  matches: RegExp;
  read(
    files: { file: string; text: string }[],
    root: string,
  ): {
    tokens: Token[];
    warnings: string[];
    values: AddedValue[];
    /** Other files read, such as the modules a theme imports its colors from. */
    files?: string[];
  };
}

/**
 * A value the app's theme adds to a prop at runtime, which a JavaScript app need not declare in
 * types: a custom palette color (`teal`) or component variant (`dashed`).
 */
export interface AddedValue {
  /** The component it applies to; without one, each of the library's components. */
  component?: string | undefined;
  prop: string;
  value: string;
  /** Without a component, only props that already allow this value (`primary`): palette colors. */
  alongside?: string | undefined;
}

/** The ids of the libraries onsystem can read, for the config's `libraries` list. */
export const LIBRARY_IDS = ['mui'] as const;
export type LibraryId = (typeof LIBRARY_IDS)[number];

/** The libraries onsystem can read, by package. */
export const LIBRARIES: readonly LibraryAdapter[] = [mui];

/**
 * Published component libraries onsystem does not read yet, by package. A project that depends
 * on one is told so, since nothing in it is checked and a clean result would look like a
 * misconfigured one.
 */
export const UNREAD_LIBRARIES: readonly { package: string; title: string }[] = [
  { package: '@chakra-ui/react', title: 'Chakra UI' },
  { package: '@mantine/core', title: 'Mantine' },
  { package: '@heroui/react', title: 'HeroUI' },
  { package: '@radix-ui/themes', title: 'Radix Themes' },
  { package: 'antd', title: 'Ant Design' },
];

/** A library an app depends on, and where it is installed. */
export interface LibrarySource {
  package: string;
  /** The installed package's folder, absolute; undefined when it is a dependency but not installed. */
  dir?: string | undefined;
  /** The installed version. */
  version?: string | undefined;
  /**
   * A design-system package installed without its component sources, read from its type
   * declarations ({@link declarationsPackages}) rather than as a library onsystem knows.
   */
  designSystem?: true | undefined;
}

export function libraryAdapter(name: string): LibraryAdapter | undefined {
  return LIBRARIES.find((library) => library.package === name);
}

/** What a design-system package read from its type declarations is called in messages. */
const PACKAGE_TITLE = 'Design-system package';

/** A library's name for messages, read or not: `MUI`, `Chakra UI`, `Design-system package`. */
export function libraryTitle(name: string): string {
  return (
    [...LIBRARIES, ...UNREAD_LIBRARIES].find((l) => l.package === name)?.title ?? PACKAGE_TITLE
  );
}

/**
 * The adapter for a design-system package read from its type declarations (`@acme/ui`): its
 * components and their props, with no theme to read, and the app's augmentations of its modules.
 */
export function packageAdapter(name: string): DeclarationsAdapter {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return {
    package: name,
    title: PACKAGE_TITLE,
    augments: new RegExp(`declare\\s+module\\s+['"]${escaped}(?:/[\\w./-]*)?['"]`),
  };
}

/** Why a library in `UNREAD_LIBRARIES` is not read: `a dependency onsystem does not read yet (…)`. */
export function notReadYet(): string {
  return `a dependency onsystem does not read yet (it reads only ${LIBRARIES.map((l) => l.title).join(', ')} so far)`;
}

/**
 * The libraries `root`'s package.json depends on (dependencies, devDependencies or
 * peerDependencies), each found where Node.js would find it: in `node_modules` at the root or a
 * folder above it, as a monorepo hoists it. Nothing in the package is run. `ids` is the config's
 * `libraries`: undefined reads every library onsystem supports, false none, a list those named;
 * the dependencies it leaves out are `off`. Those in `UNREAD_LIBRARIES` are `unread`.
 *
 * The design-system packages installed without their component sources that the app depends
 * on ({@link declarationsPackages}) come after them, read from their type declarations unless
 * `libraries` is false. A list names libraries, not packages, so it leaves them in.
 */
export function detectLibraries(
  root: string,
  ids?: false | readonly LibraryId[],
): { read: LibrarySource[]; off: LibrarySource[]; unread: LibrarySource[] } {
  const pkg = readJson(path.join(root, 'package.json'));
  if (!pkg) return { read: [], off: [], unread: [] };
  const dependencies = new Set(
    ['dependencies', 'devDependencies', 'peerDependencies'].flatMap((field) => {
      const value = pkg[field];
      return value && typeof value === 'object' ? Object.keys(value) : [];
    }),
  );
  const sourceOf = (name: string): LibrarySource => {
    const dir = installedPackage(root, name);
    const version = dir ? readJson(path.join(dir, 'package.json'))?.version : undefined;
    return { package: name, dir, version: typeof version === 'string' ? version : undefined };
  };
  const found = LIBRARIES.filter((library) => dependencies.has(library.package)).map((library) => ({
    id: library.id,
    source: sourceOf(library.package),
  }));
  const wanted = (id: LibraryId) => ids === undefined || (ids !== false && ids.includes(id));
  const packages = declarationsPackages(root).map((p): LibrarySource => ({
    package: p.name,
    dir: p.dir,
    version: p.version,
    designSystem: true,
  }));
  return {
    read: [
      ...found.filter((f) => wanted(f.id)).map((f) => f.source),
      ...(ids === false ? [] : packages),
    ],
    off: [
      ...found.filter((f) => !wanted(f.id)).map((f) => f.source),
      ...(ids === false ? packages : []),
    ],
    unread: UNREAD_LIBRARIES.filter((library) => dependencies.has(library.package)).map((library) =>
      sourceOf(library.package),
    ),
  };
}

/** The folder `name` is installed in for code in `root`, looking up through `node_modules` folders. */
function installedPackage(root: string, name: string): string | undefined {
  for (let dir = path.resolve(root); ; dir = path.dirname(dir)) {
    const candidate = path.join(dir, 'node_modules', ...name.split('/'));
    if (fs.existsSync(path.join(candidate, 'package.json'))) return candidate;
    if (dir === path.dirname(dir)) return undefined;
  }
}

function readJson(file: string): Record<string, unknown> | undefined {
  try {
    const value = JSON.parse(fs.readFileSync(file, 'utf8')) as unknown;
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}
