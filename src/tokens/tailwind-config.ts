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

/** A config or preset module, which is read for its theme. */
const SCRIPT_FILE = /\.[cm]?[jt]s$/;

/** Tailwind's own modules, such as `tailwindcss/defaultTheme`, which hold its defaults. */
const TAILWIND_MODULE = /^tailwindcss(?:\/|$)/;

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
      if (target && SCRIPT_FILE.test(target)) queue.push(target);
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

/**
 * Tailwind v3's default `borderRadius` scale, which `theme.extend.borderRadius` adds to and
 * `theme.borderRadius` replaces. `none` (0) is left out, as the rule skips zero, and `full`
 * is the token index's own `rounded-full`.
 */
const TAILWIND_V3_RADIUS: Readonly<Record<string, string>> = {
  sm: '0.125rem',
  DEFAULT: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
};

/** borderRadius entries by key, and which of them are Tailwind's default scale rather than the config's. */
export class RadiusEntries extends Map<string, string> {
  readonly defaults = new Set<string>();
}

export interface TailwindRadii {
  /**
   * borderRadius key → raw value: `sm` → `calc(var(--radius) - 4px)`, then the steps of
   * Tailwind's default scale the config keeps and does not set (`defaults`).
   */
  radii: RadiusEntries;
  /** The files read: the config and the project modules it imports. */
  files: string[];
}

/**
 * Reads `borderRadius` entries from a Tailwind v3 config without running it:
 * every `borderRadius` object in the file, then in the project modules it
 * imports, such as a shared preset. The config's own entries win. Tailwind's
 * default scale follows, for the keys none of them sets, unless the first
 * `theme.borderRadius` outside `extend` replaces it without spreading it back
 * in (`...defaultTheme.borderRadius`), a `theme` is a whole module or spreads
 * one (`theme: require("./theme")`, `theme: { ...require("./theme") }`), other
 * than Tailwind's own, `presets: []` drops Tailwind's default config
 * and no `theme.borderRadius` spreads the scale back in, or the scale comes from
 * somewhere this cannot read. That is a module that is no project file (one
 * installed from npm, other than Tailwind's own) that the config takes as a
 * preset, a theme, or the config itself (`module.exports = require("x")`,
 * `{ ...require("x"), content }`), or spreads into a theme, its `extend` or a
 * `borderRadius`; a `presets` that is no array; or a `theme.borderRadius` or
 * `theme.extend.borderRadius` that is no object (`borderRadius: radius`,
 * `borderRadius: ({ theme }) => …`) or spreads anything but Tailwind's scale.
 */
export function readTailwindRadii(file: string, resolve: ModuleResolver): TailwindRadii {
  const radii = new RadiusEntries();
  const files: string[] = [];
  // Whether the scale `theme.borderRadius` sets keeps Tailwind's; undefined while none does.
  let keepsDefaults: boolean | undefined;
  // Whether the scale can have steps that are not read, of unknown keys and sizes: from a
  // package, a variable or a function.
  let unread = false as boolean;
  // Whether a config sets `presets: []`, which leaves out Tailwind's default config.
  let noDefaultConfig = false as boolean;
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
    const bindings = importBindings(source);
    // A value taken from a module that is no project file, such as `require("@acme/preset")` or a
    // name imported from it: none of it is read. Tailwind's own modules are its defaults.
    const external = (specifier: string | undefined): boolean => {
      if (specifier === undefined || TAILWIND_MODULE.test(specifier)) return false;
      const target = resolve(specifier, current);
      return !(target && SCRIPT_FILE.test(target));
    };
    const fromPackage = (value: ts.Expression): boolean => external(moduleOf(value, bindings));
    // `defaultTheme.borderRadius`, or `borderRadius` required from `tailwindcss/defaultTheme`: only
    // Tailwind's own modules hold its scale. A project module's or a local object's
    // `borderRadius` is a scale of its own.
    const fromTailwind = (value: ts.Expression): boolean =>
      TAILWIND_MODULE.test(moduleOf(value, bindings) ?? '');
    const visit = (node: ts.Node): void => {
      if (
        (ts.isPropertyAssignment(node) || ts.isShorthandPropertyAssignment(node)) &&
        propertyName(node.name) === 'borderRadius'
      ) {
        const value = ts.isPropertyAssignment(node) ? node.initializer : undefined;
        const holder = themeSection(node.parent);
        if (value && ts.isObjectLiteralExpression(value)) {
          collectRadius(value, radii);
          let spreads = false;
          for (const property of value.properties) {
            if (!ts.isSpreadAssignment(property)) continue;
            // `...defaultTheme.borderRadius` is Tailwind's scale; `...acmeRadius` or
            // `...shared.borderRadius` is a scale of its own, with steps that may not be read.
            if (fromTailwind(property.expression)) spreads = true;
            else unread = true;
          }
          if (holder === 'theme') keepsDefaults ??= spreads;
          return;
        }
        // `borderRadius: radius` or `borderRadius: ({ theme }) => ({…})` under the theme.
        if (holder === 'theme') keepsDefaults ??= false;
        else if (holder === 'extend') unread = true;
      }
      if (
        (ts.isPropertyAssignment(node) || ts.isShorthandPropertyAssignment(node)) &&
        propertyName(node.name) === 'presets'
      ) {
        const value = ts.isPropertyAssignment(node) ? node.initializer : undefined;
        if (value && ts.isArrayLiteralExpression(value)) {
          // `presets: []`: no preset, and not Tailwind's default config either.
          if (!value.elements.length) noDefaultConfig = true;
          for (const element of value.elements) {
            // `require("@acme/preset")` or `...require("@acme/presets")`.
            if (fromPackage(ts.isSpreadElement(element) ? element.expression : element)) {
              unread = true;
            }
          }
        } else {
          // `presets` or `presets: shared.presets`: presets that are not read.
          unread = true;
        }
      }
      if (
        (ts.isShorthandPropertyAssignment(node) ||
          (ts.isPropertyAssignment(node) && !ts.isObjectLiteralExpression(node.initializer))) &&
        propertyName(node.name) === 'theme' &&
        !ts.isPropertyAssignment(node.parent.parent)
      ) {
        // `theme: require("./theme")`: a whole theme, whose `borderRadius` replaces the scale.
        keepsDefaults ??= false;
        if (fromPackage(ts.isPropertyAssignment(node) ? node.initializer : node.name)) {
          unread = true;
        }
      }
      // `{ ...require("@acme/tailwind-config"), content }`, or a theme or `extend` spread from one.
      // A variable's object that only serves as a theme value is none of them:
      // `const brand = { ...blue, ...blueDark }` with `colors: brand`.
      if (
        ts.isSpreadAssignment(node) &&
        fromPackage(node.expression) &&
        (themeSection(node.parent) !== undefined ||
          (!ts.isPropertyAssignment(node.parent.parent) && !themeValueOnly(node.parent, source)))
      ) {
        unread = true;
      }
      // `theme: { ...require("./theme") }`: a whole theme, whose `borderRadius` replaces the scale,
      // as with `theme: require("./theme")`. `...defaultTheme` is Tailwind's own.
      if (
        ts.isSpreadAssignment(node) &&
        themeSection(node.parent) === 'theme' &&
        !fromTailwind(node.expression)
      ) {
        keepsDefaults ??= false;
      }
      // `module.exports = require("@acme/tailwind-config")`, `export default base` or
      // `export { default } from "@acme/tailwind-config"`.
      if (
        (ts.isBinaryExpression(node) &&
          node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
          isModuleExports(node.left) &&
          fromPackage(node.right)) ||
        (ts.isExportAssignment(node) && fromPackage(node.expression)) ||
        (ts.isExportDeclaration(node) &&
          !node.isTypeOnly &&
          node.exportClause !== undefined &&
          ts.isNamedExports(node.exportClause) &&
          node.exportClause.elements.some((element) => element.name.text === 'default') &&
          node.moduleSpecifier &&
          ts.isStringLiteral(node.moduleSpecifier) &&
          external(node.moduleSpecifier.text))
      ) {
        unread = true;
      }
      const specifier = importedSpecifier(node);
      const target = specifier === undefined ? undefined : resolve(specifier, current);
      if (target && SCRIPT_FILE.test(target)) queue.push(target);
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  // With `presets: []`, Tailwind's scale is there only when a `theme.borderRadius` spreads it in.
  const keeps = noDefaultConfig ? keepsDefaults === true : keepsDefaults !== false;
  if (keeps && !unread) {
    for (const [key, value] of Object.entries(TAILWIND_V3_RADIUS)) {
      if (radii.has(key)) continue;
      radii.set(key, value);
      radii.defaults.add(key);
    }
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
    if (raw === undefined || radii.has(key)) continue;
    radii.set(key, raw);
  }
}

/** `module.exports`, as in `module.exports = require("@acme/tailwind-config")`. */
function isModuleExports(node: ts.Expression): boolean {
  return (
    ts.isPropertyAccessExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === 'module' &&
    node.name.text === 'exports'
  );
}

/**
 * Gives radius tokens their Tailwind v3 class names: each config entry is
 * evaluated (its `var()` against radius token values, so
 * `calc(var(--radius) - 4px)` resolves with the theme), then radius tokens
 * whose px matches exactly take the entry key. Entries with no matching
 * token add a synthetic one, so the scale step exists as a candidate
 * (mirrors the spacing-steps synthesis); without it the literal would keep
 * matching the nearest unrelated token. Config entries win over presets.
 *
 * The steps of Tailwind's default scale ({@link RadiusEntries.defaults}) only add
 * a token for a size that has none, named after nothing the project names:
 * `rounded-xl` is 12px in a shadcn/ui v3 project, whose config extends the scale
 * with `lg`, `md` and `sm`. They add none when a config step has no size (its
 * `var(--radius)` is in no stylesheet read), as they would make a scale with
 * holes, nor when the tokens are a Tailwind v4 theme, whose own scale is read from
 * its stylesheet: Tailwind v4's defaults, or a token of an `@theme` variable outside
 * the colors (only v4 reads `@theme`; a v3 config names colors too).
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
  const defaults = radii instanceof RadiusEntries ? radii.defaults : new Set<string>();
  // Before the config's keys are set below: `--radius-card` in `@theme`, `--spacing`, or v4's own steps.
  const v4 = tokens.some(
    (t) => t.origin === 'tailwind-default' || (t.category !== 'color' && t.tailwind !== undefined),
  );
  const byPx = new Map<number, string>();
  let unsized = false;
  for (const [key, raw] of radii) {
    if (defaults.has(key)) continue;
    const px = evaluateLength(raw, resolve);
    if (px === undefined) unsized = true;
    else if (!byPx.has(px)) byPx.set(px, key);
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
  // Around a step of unknown size, Tailwind's steps would make a scale with a hole. Tailwind v4
  // brings its own defaults, which v3's would contradict (`sm` is 4px there).
  if (unsized || v4) return;
  const names = new Set(tokens.map((t) => t.name));
  for (const key of defaults) {
    const value = radii.get(key) ?? '';
    const px = evaluateLength(value, resolve);
    const name = `radius-${key}`;
    if (px === undefined || havePx.has(px) || names.has(name)) continue;
    const token: Token = {
      name,
      category: 'radius',
      value,
      tailwind: key,
      usage: usageFor({ category: 'radius', tailwind: key } as Token, '--radius'),
      description: "Tailwind's default radius scale.",
      origin: 'tailwind-default',
      source: { file: configFile, line: 1 },
    };
    tokens.push(token);
    havePx.add(px);
  }
}

/**
 * Whether an object is the value of a variable that its file uses only as a theme value of a
 * key other than `extend` and `borderRadius`, such as `const brand = { ...blue, ...blueDark }`
 * with `theme: { extend: { colors: brand } }`. What it spreads is then no config, theme or
 * radius scale. A variable that is exported, or used in any other way, may be one.
 */
function themeValueOnly(object: ts.ObjectLiteralExpression, source: ts.SourceFile): boolean {
  let value: ts.Node = object;
  while (
    ts.isParenthesizedExpression(value.parent) ||
    ts.isAsExpression(value.parent) ||
    ts.isSatisfiesExpression(value.parent)
  ) {
    value = value.parent;
  }
  const declaration = value.parent;
  if (
    !ts.isVariableDeclaration(declaration) ||
    declaration.initializer !== value ||
    !ts.isIdentifier(declaration.name) ||
    !ts.isVariableStatement(declaration.parent.parent) ||
    declaration.parent.parent.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
  ) {
    return false;
  }
  const name = declaration.name;
  let only = true;
  const visit = (node: ts.Node): void => {
    if (!only) return;
    const parent = node.parent as ts.Node | undefined;
    const key =
      parent !== undefined &&
      (ts.isPropertyAssignment(parent) || ts.isPropertyAccessExpression(parent)) &&
      parent.name === node;
    if (ts.isIdentifier(node) && node !== name && node.text === name.text && !key) {
      only = isThemeValue(node);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return only;
}

/**
 * Whether a name is a theme value, under a key other than `extend` and `borderRadius`:
 * `colors: brand`, or `colors: { brand }`.
 */
function isThemeValue(reference: ts.Identifier): boolean {
  const parent = reference.parent;
  let property: ts.PropertyAssignment | ts.ShorthandPropertyAssignment;
  if (ts.isPropertyAssignment(parent) && parent.initializer === reference) property = parent;
  else if (ts.isShorthandPropertyAssignment(parent)) property = parent;
  else return false;
  for (;;) {
    const key = propertyName(property.name);
    const object = property.parent;
    if (themeSection(object) !== undefined) {
      return key !== undefined && key !== 'extend' && key !== 'borderRadius';
    }
    const holder = object.parent;
    if (!ts.isPropertyAssignment(holder) || holder.initializer !== object) return false;
    property = holder;
  }
}

/** `theme` or `extend` for a property of `theme: {…}` or of `theme.extend: {…}`; else undefined. */
function themeSection(object: ts.Node): 'theme' | 'extend' | undefined {
  const holder = object.parent;
  if (!ts.isObjectLiteralExpression(object) || !ts.isPropertyAssignment(holder)) return undefined;
  const key = propertyName(holder.name);
  if (key === 'theme') return 'theme';
  return key === 'extend' && themeSection(holder.parent) === 'theme' ? 'extend' : undefined;
}

/**
 * The names a module binds to what it imports or requires, by specifier: `acme` for
 * `import acme from "x"`, `import { acme } from "x"`, `const acme = require("x")` or
 * `const { default: acme } = require("x")`.
 */
function importBindings(source: ts.SourceFile): Map<string, string> {
  const bindings = new Map<string, string>();
  const bind = (name: ts.BindingName, specifier: string): void => {
    if (ts.isIdentifier(name)) {
      bindings.set(name.text, specifier);
      return;
    }
    for (const element of name.elements) {
      if (!ts.isOmittedExpression(element)) bind(element.name, specifier);
    }
  };
  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      const specifier = statement.moduleSpecifier.text;
      const clause = statement.importClause;
      if (clause?.name) bind(clause.name, specifier);
      const named = clause?.namedBindings;
      if (named && ts.isNamespaceImport(named)) bind(named.name, specifier);
      else if (named) for (const element of named.elements) bind(element.name, specifier);
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        const specifier = declaration.initializer && moduleOf(declaration.initializer, bindings);
        if (specifier !== undefined) bind(declaration.name, specifier);
      }
    }
  }
  return bindings;
}

/**
 * The module an expression takes its value from: `"x"` for `require("x")`, `import("x")`, a
 * name bound to either ({@link importBindings}), a call of any of these
 * (`createPreset({…})`, `require("x")()`) or a property of one (`require("x").default`).
 */
function moduleOf(node: ts.Expression, bindings: ReadonlyMap<string, string>): string | undefined {
  let current = node;
  for (;;) {
    if (
      ts.isParenthesizedExpression(current) ||
      ts.isAsExpression(current) ||
      ts.isSatisfiesExpression(current) ||
      ts.isNonNullExpression(current) ||
      ts.isAwaitExpression(current) ||
      ts.isPropertyAccessExpression(current)
    ) {
      current = current.expression;
    } else if (ts.isCallExpression(current)) {
      const specifier = importedSpecifier(current);
      if (specifier !== undefined) return specifier;
      current = current.expression;
    } else {
      return ts.isIdentifier(current) ? bindings.get(current.text) : undefined;
    }
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
