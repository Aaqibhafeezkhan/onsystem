import fs from 'node:fs';
import path from 'node:path';

import { globSync } from 'tinyglobby';
import ts from 'typescript';

import { propertyName } from '../extract/cva.js';
import type { Token } from '../types.js';
import { isInside } from '../util/paths.js';
import { isBareRgb } from './color.js';
import { evaluateLength } from './units.js';
import { usageFor } from './usage.js';

/** Resolves an import specifier from a file to a project file, or undefined (installed packages). */
export type ModuleResolver = (specifier: string, fromFile: string) => string | undefined;

export interface TailwindColors {
  /** Custom property → color key: `--primary` → `primary`, `--sidebar-background` → `sidebar`. */
  colors: Map<string, string>;
  /** Custom properties the config reads as RGB channels: `rgb(var(--success) / <alpha-value>)`. */
  rgb: Set<string>;
  /** The files read: the config and the project modules it imports. */
  files: string[];
}

/** A preset chain is a few files deep; anything beyond is not a Tailwind config. */
const MAX_FILES = 12;

/**
 * Reads which custom property backs which color class from a Tailwind v3
 * config, without running it: every `colors` object in the file
 * (`primary: { DEFAULT: "hsl(var(--primary))" }`), then in the project modules
 * it imports, such as a shared preset. The config's own entries win.
 */
export function readTailwindColors(file: string, resolve: ModuleResolver): TailwindColors {
  const colors = new Map<string, string>();
  const rgb = new Set<string>();
  const files: string[] = [];
  const queue = [file];
  while (queue.length && files.length < MAX_FILES) {
    const current = queue.shift() ?? '';
    if (files.includes(current)) continue;
    let text: string;
    try {
      text = fs.readFileSync(current, 'utf8');
    } catch {
      continue;
    }
    files.push(current);
    const source = ts.createSourceFile(
      current,
      text,
      ts.ScriptTarget.Latest,
      true,
      scriptKind(current),
    );
    const visit = (node: ts.Node): void => {
      if (
        ts.isPropertyAssignment(node) &&
        propertyName(node.name) === 'colors' &&
        ts.isObjectLiteralExpression(node.initializer)
      ) {
        collect(node.initializer, [], colors, rgb);
        return;
      }
      const specifier = importedSpecifier(node);
      const target = specifier === undefined ? undefined : resolve(specifier, current);
      if (target && /\.[cm]?[jt]s$/.test(target)) queue.push(target);
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return { colors, rgb, files };
}

/** `primary: { DEFAULT: "hsl(var(--primary))", foreground: … }` → `--primary` → `primary`, `--primary-foreground` → `primary-foreground`. */
function collect(
  object: ts.ObjectLiteralExpression,
  keys: string[],
  colors: Map<string, string>,
  rgb: Set<string>,
): void {
  for (const property of object.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const key = propertyName(property.name);
    if (key === undefined) continue;
    const value = property.initializer;
    const nested = [...keys, key];
    if (ts.isObjectLiteralExpression(value)) {
      collect(value, nested, colors, rgb);
      continue;
    }
    if (!ts.isStringLiteralLike(value)) continue;
    const variable = /var\(\s*(--[\w-]+)/.exec(value.text)?.[1];
    const name = nested.filter((k) => k !== 'DEFAULT').join('-');
    if (!variable || !name || colors.has(variable)) continue;
    colors.set(variable, name);
    if (/^\s*rgba?\(\s*var\(/.test(value.text)) rgb.add(variable);
  }
}

export interface TailwindRadii {
  /** borderRadius key → raw value: `sm` → `calc(var(--radius) - 4px)`. */
  radii: Map<string, string>;
  /** The files read: the config and the project modules it imports. */
  files: string[];
}

/**
 * Reads `borderRadius` entries from a Tailwind v3 config without running it:
 * every `borderRadius` object in the file, then in the project modules it
 * imports, such as a shared preset. The config's own entries win.
 */
export function readTailwindRadii(file: string, resolve: ModuleResolver): TailwindRadii {
  const radii = new Map<string, string>();
  const files: string[] = [];
  const queue = [file];
  while (queue.length && files.length < MAX_FILES) {
    const current = queue.shift() ?? '';
    if (files.includes(current)) continue;
    let text: string;
    try {
      text = fs.readFileSync(current, 'utf8');
    } catch {
      continue;
    }
    files.push(current);
    const source = ts.createSourceFile(
      current,
      text,
      ts.ScriptTarget.Latest,
      true,
      scriptKind(current),
    );
    const visit = (node: ts.Node): void => {
      if (
        ts.isPropertyAssignment(node) &&
        propertyName(node.name) === 'borderRadius' &&
        ts.isObjectLiteralExpression(node.initializer)
      ) {
        collectRadius(node.initializer, radii);
        return;
      }
      const specifier = importedSpecifier(node);
      const target = specifier === undefined ? undefined : resolve(specifier, current);
      if (target && /\.[cm]?[jt]s$/.test(target)) queue.push(target);
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return { radii, files };
}

/** `sm: "calc(var(--radius) - 4px)"` → `sm` → raw string; first seen wins. */
function collectRadius(object: ts.ObjectLiteralExpression, radii: Map<string, string>): void {
  for (const property of object.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const key = propertyName(property.name);
    if (key === undefined) continue;
    const value = property.initializer;
    let raw: string | undefined;
    if (ts.isStringLiteralLike(value)) {
      raw = value.text;
    } else if (ts.isNumericLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) {
      raw = value.text;
    }
    // SpreadElement (`...defaultTheme.borderRadius`) cannot be resolved
    // statically; those steps are skipped (documented limitation).
    if (raw === undefined || radii.has(key)) continue;
    radii.set(key, raw);
  }
}

/**
 * Gives radius tokens their Tailwind v3 class names: each config entry is
 * evaluated (its `var()` against radius token values, so
 * `calc(var(--radius) - 4px)` resolves with the theme), then radius tokens
 * whose px matches exactly take the entry key. Entries with no matching
 * token add a synthetic one, so the scale step exists as a candidate
 * (mirrors the spacing-steps synthesis); without it the literal would keep
 * matching the nearest unrelated token. Config entries win over presets.
 */
export function applyTailwindRadii(
  tokens: Token[],
  radii: Map<string, string>,
  configFile = 'tailwind.config',
): void {
  const byVar = new Map<string, string>();
  for (const token of tokens) {
    if (token.category === 'radius' && token.cssVar) byVar.set(token.cssVar, token.value);
  }
  const resolve = (name: string): string | undefined => byVar.get(name);
  const byPx = new Map<number, string>();
  for (const [key, raw] of radii) {
    const px = evaluateLength(raw, resolve);
    if (px !== undefined && !byPx.has(px)) byPx.set(px, key);
  }
  const havePx = new Set<number>();
  for (const token of tokens) {
    if (token.category !== 'radius') continue;
    const px = evaluateLength(token.value, resolve);
    if (px === undefined) continue;
    havePx.add(px);
    const key = byPx.get(px);
    if (key === undefined) continue;
    token.tailwind = key;
    token.usage = usageFor(token, '--radius');
  }
  for (const [px, key] of byPx) {
    if (havePx.has(px)) continue;
    const token: Token = {
      name: `radius-${key}`,
      category: 'radius',
      value: `${px}px`,
      tailwind: key,
      usage: usageFor({ category: 'radius', tailwind: key } as Token, '--radius'),
      source: { file: configFile, line: 1 },
    };
    tokens.push(token);
    havePx.add(px);
  }
}

/** The specifier of `require("x")`, `import x from "x"`, `export { default } from "x"` or `import("x")`. */
function importedSpecifier(node: ts.Node): string | undefined {
  if (
    (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
    node.moduleSpecifier &&
    ts.isStringLiteral(node.moduleSpecifier)
  ) {
    return node.moduleSpecifier.text;
  }
  if (
    ts.isCallExpression(node) &&
    (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
      (ts.isIdentifier(node.expression) && node.expression.text === 'require')) &&
    node.arguments[0] &&
    ts.isStringLiteralLike(node.arguments[0])
  ) {
    return node.arguments[0].text;
  }
  return undefined;
}

function scriptKind(file: string): ts.ScriptKind {
  return /\.[cm]?ts$/.test(file) ? ts.ScriptKind.TS : ts.ScriptKind.JS;
}

/**
 * shadcn/ui's Tailwind v3 color names, as its `tailwind.config` maps them,
 * used when the project's config cannot be read: `--sidebar-background` is
 * `bg-sidebar`, every other variable is the class of the same name.
 */
const SHADCN_COLORS = new Set([
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'destructive-foreground',
  'border',
  'input',
  'ring',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'sidebar-background',
  'sidebar-foreground',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'sidebar-ring',
]);

/**
 * Gives color tokens their Tailwind v3 class names: the key the config maps
 * the custom property to, or, when the config has no colors we can read,
 * shadcn/ui's convention. Tokens that already have a key (`@theme`) keep it.
 * A property the config reads as RGB channels (`rgb(var(--success) / <alpha-value>)`)
 * is a color token when its values are such channels (`22 163 74`), which the
 * stylesheet alone leaves undecided.
 */
export function applyTailwindColors(
  tokens: Token[],
  colors: Map<string, string>,
  rgb: ReadonlySet<string> = new Set(),
): void {
  for (const token of tokens) {
    if (
      token.category === 'other' &&
      token.cssVar &&
      rgb.has(token.cssVar) &&
      [token.value, ...Object.values(token.modes ?? {})].every(isBareRgb)
    ) {
      token.category = 'color';
    }
    if (token.category !== 'color' || token.tailwind !== undefined || !token.cssVar) continue;
    const name = token.cssVar.slice(2);
    const key = colors.size
      ? colors.get(token.cssVar)
      : SHADCN_COLORS.has(name)
        ? name.replace(/^sidebar-background$/, 'sidebar')
        : undefined;
    if (key === undefined) continue;
    token.tailwind = key;
    token.usage = usageFor(token, '--color');
  }
}

/** Enough of a package's stylesheets to find its theme, without reading a whole design system. */
const MAX_PRESET_STYLESHEETS = 200;

/**
 * The stylesheets that set the custom properties a Tailwind v3 config maps to colors, when
 * they sit in a workspace package the config reads its presets from rather than in the
 * project: Dub's `@dub/tailwind-config`, whose `themes.css` sets `--content-error` for the
 * `content-error` its config maps. Each CSS file of such a package (outside `node_modules`
 * and build output) that declares one of them, in path order. The project's own folder, and
 * a folder that holds it (a preset at the workspace root), are not searched.
 */
export function presetStylesheets(read: TailwindColors, root: string): string[] {
  if (!read.colors.size) return [];
  const packages = new Set<string>();
  for (const file of read.files) {
    const dir = packageDir(path.dirname(file));
    if (dir && !isInside(dir, root)) packages.add(dir);
  }
  const out: string[] = [];
  for (const dir of packages) {
    const sheets = globSync('**/*.css', {
      cwd: dir,
      absolute: true,
      ignore: ['**/node_modules/**', '**/{dist,build,out,.next,.turbo,coverage}/**'],
    })
      .sort()
      .slice(0, MAX_PRESET_STYLESHEETS);
    for (const sheet of sheets) {
      let text: string;
      try {
        text = fs.readFileSync(sheet, 'utf8');
      } catch {
        continue;
      }
      const declares = [...text.matchAll(/(--[\w-]+)\s*:/g)].some((m) =>
        read.colors.has(m[1] ?? ''),
      );
      if (declares) out.push(path.resolve(sheet));
    }
  }
  return out;
}

/** The nearest folder at or above `dir` with a package.json. */
function packageDir(dir: string): string | undefined {
  for (let current = dir; ; current = path.dirname(current)) {
    if (fs.existsSync(path.join(current, 'package.json'))) return current;
    if (current === path.dirname(current)) return undefined;
  }
}

/** The project's Tailwind v3 config: `tailwind.config` in components.json, else `tailwind.config.*` in the root. */
export function findTailwindConfig(root: string): string | undefined {
  try {
    const json = JSON.parse(fs.readFileSync(path.join(root, 'components.json'), 'utf8')) as {
      tailwind?: { config?: unknown };
    };
    const config = json.tailwind?.config;
    if (typeof config === 'string' && config && fs.existsSync(path.join(root, config))) {
      return path.join(root, config);
    }
  } catch {
    // No components.json, or not one we can read.
  }
  return ['ts', 'js', 'cjs', 'mjs', 'cts', 'mts']
    .map((ext) => path.join(root, `tailwind.config.${ext}`))
    .find((file) => fs.existsSync(file));
}
