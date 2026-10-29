/**
 * onsystem's rules as an ESLint plugin (ESLint 9 and 10, flat config):
 *
 *   import onsystem from 'onsystem/eslint';
 *   export default [...yourConfig, onsystem.configs.recommended];
 *
 * Each file is checked as `onsystem check` checks it, against the design system of its project
 * (the nearest folder with a config, a components.json or a package.json, found from ESLint's
 * working directory), with the project's config: its `rules` and `overrides` turn rules off
 * per file, `// onsystem-disable-*` comments suppress findings, and the files `check .` leaves
 * out (the config's `exclude`, the design system's own components) are not checked. ESLint's
 * config sets each rule's severity, and can set a rule's options (`allow`) over the project's.
 * `onsystem/suppression` reports a misspelled rule in a suppression comment, as check does.
 */
import path from 'node:path';

import type { ESLint, Linter, Rule, Scope, SourceCode } from 'eslint';

import {
  DEFAULT_SEVERITY,
  DEFAULT_TEST_EXCLUDE,
  DEFAULT_TEST_FOLDERS,
  RULE_IDS,
  rulesFor,
  type ResolvedRule,
  type RuleId,
  type RuleOptions,
} from '../config.js';
import { DesignSystem } from '../design-system.js';
import { checkSource, RULES } from '../lint/index.js';
import type { CheckResult, TextEdit } from '../types.js';
import { relativePath } from '../util/paths.js';
import { NAME, VERSION } from '../version.js';
import { loadSync } from './bridge.js';

const RULES_PAGE = 'https://onsystem.vercel.app/rules';

/** Design systems by project root, at the version the loader last reported. */
const designSystems = new Map<string, { version: string; ds: DesignSystem }>();

/**
 * One check per file per lint pass, shared by every rule of the pass: they see the same
 * SourceCode, and a new pass (another run, a fix pass, an editor's next keystroke) gets a new
 * one, so the design system's freshness is asked about again. `reported` says that a file that
 * could not be checked has been said so in this pass.
 */
const passes = new WeakMap<SourceCode, { outcome: Outcome; reported: boolean }>();

/**
 * A checked file's findings, with `fromSystem`: whether an import specifier in that file leads
 * to the design system, and `checkWith`: the file checked by one rule alone, with options from
 * ESLint's config over the ones the project's config gives the rule for the file.
 */
type Outcome =
  | {
      result: CheckResult;
      fromSystem: (specifier: string) => boolean;
      checkWith: (id: RuleId, options: RuleOptions) => CheckResult;
    }
  | { skipped: true }
  | { error: string };

/** `settings.onsystem`: where the project and its config are, when finding them from ESLint's cwd is not right. */
export interface Settings {
  /** The project root, relative to ESLint's working directory (`check --root`). */
  root?: string;
  /** The config file, relative to ESLint's working directory (`check --config`). */
  config?: string;
}

function passFor(context: Rule.RuleContext, file: string, settings: Settings) {
  const { sourceCode } = context;
  let pass = passes.get(sourceCode);
  if (!pass) {
    pass = { outcome: run(context.cwd, file, sourceCode.text, settings), reported: false };
    passes.set(sourceCode, pass);
  }
  return pass;
}

function run(cwd: string, file: string, text: string, settings: Settings): Outcome {
  const known = Object.fromEntries(
    [...designSystems].map(([root, { version }]) => [root, version]),
  );
  const response = loadSync({ cwd, file, known, root: settings.root, config: settings.config });
  if ('error' in response) return { error: response.error };
  if ('skip' in response) return { skipped: true };
  let entry = designSystems.get(response.root);
  if (response.data) {
    const { model, config } = response.data;
    entry = { version: response.version, ds: new DesignSystem(model, config) };
    designSystems.set(response.root, entry);
  }
  if (!entry) return { error: `no design system loaded for ${response.root}` };
  const { ds } = entry;
  const relative = relativePath(ds.root, file);
  const result = ds.check(text, relative);
  if (result.skipped) return { skipped: true };
  return {
    result,
    fromSystem: (specifier) => ds.lint.isDesignSystemImport(specifier, relative),
    checkWith(id, options) {
      // A rule the project's config turns off for the file stays off.
      const own = rulesFor(ds.config, relative)[id];
      const off: ResolvedRule = { severity: 'off', options: {} };
      const rules = Object.fromEntries(
        RULE_IDS.map((rule) => [
          rule,
          rule === id ? { ...own, options: { ...own.options, ...options } } : off,
        ]),
      ) as Record<RuleId, ResolvedRule>;
      return checkSource(text, ds.lint, { filename: relative, rules });
    },
  };
}

/** The part of an ESLint AST node this file reads; JSX nodes are not in ESTree's types. */
interface AstNode {
  type: string;
  range: [number, number];
  parent?: AstNode | null;
  name?: unknown;
}

/**
 * The name an edit gives a JSX tag when that name does not mean the component there: `Button`
 * for `<button>` → `<Button>` in a file that does not import it, imports it as a type only, or
 * imports another `Button` from outside the design system. Applied, such a rename leaves a file
 * that does not compile.
 */
function unboundRename(
  sourceCode: SourceCode,
  edit: TextEdit,
  fromSystem: (specifier: string) => boolean,
): string | undefined {
  // A lowercase name is an intrinsic element, never a binding.
  if (!edit.text.includes('.') && /^[a-z]/.test(edit.text)) return;
  const [start, end] = edit.range;
  // The offset finds the innermost node: `Card` inside the tag name `Card.Header`.
  let node = sourceCode.getNodeByRangeIndex(start) as AstNode | null;
  while (node && (node.range[0] !== start || node.range[1] !== end)) node = node.parent ?? null;
  const tag = node?.parent;
  if (!node || !tag || !['JSXOpeningElement', 'JSXClosingElement'].includes(tag.type)) return;
  if (tag.name !== node) return;
  const name = edit.text.split('.')[0] ?? edit.text;
  for (
    let scope: Scope.Scope | null = sourceCode.getScope(node as unknown as Rule.Node);
    scope;
    scope = scope.upper
  ) {
    // Types live apart from values: `import type { Button }` or `type Button = …` does not make
    // <Button> compile, and a value further out is still the one the tag means. A global of the
    // environment (the DOM's `Image`) has no definition at all.
    const values = scope.set.get(name)?.defs.filter((def) => !typeOnly(def)) ?? [];
    if (!values.length) continue;
    // The innermost value of that name is what the tag means.
    return values.some((def) => isComponent(def, fromSystem)) ? undefined : edit.text;
  }
  return edit.text;
}

/**
 * Whether a value binding can be the component a rename names: an import from the design
 * system, or a function, class, variable or parameter of the file. Not an import of the same
 * name from elsewhere (`Table<TData>` from @tanstack/react-table without `type`, an app's own
 * `Label`), nor an enum or a namespace.
 */
function isComponent(def: Scope.Definition, fromSystem: (specifier: string) => boolean): boolean {
  if (def.type === 'ImportBinding') {
    const source = (def.parent as { source?: { value?: unknown } } | null)?.source?.value;
    return typeof source === 'string' && fromSystem(source);
  }
  return ['FunctionName', 'ClassName', 'Variable', 'Parameter'].includes(def.type);
}

/**
 * A binding that is only a type: a type alias, interface or type parameter (typescript-eslint's
 * `Type` definition), or `import type { Button }` and `import { type Button }` (its `importKind`).
 */
function typeOnly(def: Scope.Definition): boolean {
  if ((def.type as string) === 'Type') return true;
  const kind = (node: unknown) => (node as { importKind?: string } | null)?.importKind;
  return def.type === 'ImportBinding' && (kind(def.node) === 'type' || kind(def.parent) === 'type');
}

/** A rule's options in ESLint's config, as in onsystem.config.json: `['error', { allow: ['#fff'] }]`. */
const OPTIONS_SCHEMA: Rule.RuleMetaData['schema'] = [
  {
    type: 'object',
    properties: { allow: { type: 'array', items: { type: 'string' } } },
    additionalProperties: false,
  },
];

/**
 * Check's misspelled rule names in `// onsystem-disable-*` comments, which suppress nothing. A rule
 * of its own, so that it is a warning, as check reports it, and can be turned off like the others.
 */
const SUPPRESSION = 'suppression';

function createRule(id: RuleId | typeof SUPPRESSION, description: string): Rule.RuleModule {
  const suppression = id === SUPPRESSION;
  return {
    meta: {
      type: 'problem',
      docs: { description, url: `${RULES_PAGE}#${suppression ? 'suppressing-findings' : id}` },
      ...(suppression ? {} : { fixable: 'code', hasSuggestions: true }),
      schema: suppression ? [] : OPTIONS_SCHEMA,
    },
    create(context) {
      const file = path.resolve(context.cwd, context.filename);
      const settings = (context.settings.onsystem ?? {}) as Settings;
      const options = (context.options as RuleOptions[] | undefined)?.[0];
      return {
        'Program:exit'(node) {
          const pass = passFor(context, file, settings);
          const { outcome } = pass;
          if ('skipped' in outcome) return;
          if ('error' in outcome) {
            // Once per file and pass, from the first rule that runs, rather than once per rule.
            if (pass.reported) return;
            pass.reported = true;
            context.report({
              node,
              message: `onsystem could not check this file: ${outcome.error}`,
            });
            return;
          }
          const { diagnostics } =
            !suppression && options && Object.keys(options).length
              ? outcome.checkWith(id, options)
              : outcome.result;
          for (const d of diagnostics) {
            if (d.ruleId !== id) continue;
            const edits = d.fix ?? [];
            const fix: Rule.ReportFixer = (fixer) =>
              edits.map((e) => fixer.replaceTextRange(e.range, e.text));
            // `eslint --fix` and fix-on-save apply fixes unasked, so a rename to a component the
            // file does not import yet (or imports another thing of that name) is a suggestion:
            // the message names the import to add.
            const unbound = edits
              .map((e) => unboundRename(context.sourceCode, e, outcome.fromSystem))
              .find((name) => name !== undefined);
            context.report({
              loc: {
                start: { line: d.line, column: d.column - 1 },
                end: { line: d.endLine, column: d.endColumn - 1 },
              },
              message: d.message,
              ...(!edits.length
                ? {}
                : unbound
                  ? { suggest: [{ desc: `Rename to <${unbound}>, then import it`, fix }] }
                  : { fix }),
            });
          }
        },
      };
    },
  };
}

const rules = Object.fromEntries(
  RULES.map((rule) => [rule.id, createRule(rule.id, rule.description)]),
);
rules[SUPPRESSION] = createRule(SUPPRESSION, 'Suppression comments must name rules that exist.');

const plugin = {
  meta: { name: NAME, version: VERSION },
  rules,
  configs: {} as { recommended: Linter.Config },
} satisfies ESLint.Plugin;

/**
 * Every rule at its default severity, and `suppression` as a warning, for `.tsx` and `.jsx` files
 * other than tests and stories, which `check` also leaves out unless asked (`--include-tests`).
 */
plugin.configs.recommended = {
  name: 'onsystem/recommended',
  files: ['**/*.{tsx,jsx}'],
  ignores: [DEFAULT_TEST_EXCLUDE, DEFAULT_TEST_FOLDERS],
  plugins: { onsystem: plugin },
  rules: {
    ...Object.fromEntries(RULES.map((rule) => [`onsystem/${rule.id}`, DEFAULT_SEVERITY[rule.id]])),
    [`onsystem/${SUPPRESSION}`]: 'warn',
  },
};

export default plugin;
