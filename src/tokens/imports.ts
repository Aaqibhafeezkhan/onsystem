import fs from 'node:fs';

import postcss, { type Root } from 'postcss';

/**
 * Resolves an `@import` specifier from a stylesheet to a project file, or a stylesheet of an
 * installed design-system package, or undefined.
 */
export type StylesheetResolver = (specifier: string, fromFile: string) => string | undefined;

/** Enough stylesheets for a theme split over files, without reading a whole design system. */
const MAX_IMPORTED = 50;

/**
 * The specifiers a stylesheet `@import`s: `@import "./theme.css" layer(base)`,
 * `@import url(theme.css)`, `@import "@acme/theme"`. Empty for CSS that does not parse.
 */
export function cssImports(css: string): string[] {
  let root: Root;
  try {
    root = postcss.parse(css);
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const node of root.nodes) {
    if (node.type !== 'atrule' || node.name !== 'import') continue;
    const match = /^\s*(?:url\(\s*)?(?:"([^"]+)"|'([^']+)'|([^\s"')]+)\s*\))/.exec(node.params);
    const specifier = match?.[1] ?? match?.[2] ?? match?.[3];
    if (specifier) out.push(specifier);
  }
  return out;
}

/**
 * The stylesheets `files` import, and the ones those import in turn, each once and in the
 * order they are imported. The files themselves are not repeated.
 */
export function importedStylesheets(
  files: readonly string[],
  resolve: StylesheetResolver,
): string[] {
  const seen = new Set(files);
  const out: string[] = [];
  const visit = (file: string): void => {
    let text: string;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch {
      return;
    }
    for (const specifier of cssImports(text)) {
      const target = resolve(specifier, file);
      if (!target || seen.has(target) || out.length >= MAX_IMPORTED) continue;
      seen.add(target);
      out.push(target);
      visit(target);
    }
  };
  for (const file of files) visit(file);
  return out;
}
