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
 * config sets each rule's severity.
 */
import path from 'node:path';

import type { ESLint, Linter, Rule, Scope, SourceCode } from 'eslint';

import {
  DEFAULT_SEVERITY,
  DEFAULT_TEST_EXCLUDE,
  DEFAULT_TEST_FOLDERS,
  type RuleId,
} from '../config.js';
import { DesignSystem } from '../design-system.js';
import { RULES } from '../lint/index.js';
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

type Outcome = { result: CheckResult } | { skipped: true } | { error: string };

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
  const result = entry.ds.check(text, relativePath(entry.ds.root, file));
  return result.skipped ? { skipped: true } : { result };
}

/** The part of an ESLint AST node this file reads; JSX nodes are not in ESTree's types. */
interface AstNode {
  type: string;
  range: [number, number];
  parent?: AstNode | null;
  name?: unknown;
}

/**
 * The name an edit gives a JSX tag when that name is not in scope there: `Button` for
 * `<button>` → `<Button>` in a file that does not import it. Applied, such a rename leaves a
 * file that does not compile.
 */
function unboundRename(sourceCode: SourceCode, edit: TextEdit): string | undefined {
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
    const variable = scope.set.get(name);
    // An import or declaration, not a global of the environment (the DOM's `Image`), and a
    // value: `import type { Button }` does not make <Button> compile.
    if (variable?.defs.length && !variable.defs.every(typeOnlyImport)) return;
  }
  return edit.text;
}

/** `import type { Button }` or `import { type Button }` (typescript-eslint's `importKind`). */
function typeOnlyImport(def: Scope.Definition): boolean {
  const kind = (node: unknown) => (node as { importKind?: string } | null)?.importKind;
  return def.type === 'ImportBinding' && (kind(def.node) === 'type' || kind(def.parent) === 'type');
}

function createRule(id: RuleId, description: string): Rule.RuleModule {
  return {
    meta: {
      type: 'problem',
      docs: { description, url: `${RULES_PAGE}#${id}` },
      fixable: 'code',
      hasSuggestions: true,
      schema: [],
    },
    create(context) {
      const file = path.resolve(context.cwd, context.filename);
      const settings = (context.settings.onsystem ?? {}) as Settings;
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
          for (const d of outcome.result.diagnostics) {
            if (d.ruleId !== id) continue;
            const edits = d.fix ?? [];
            const fix: Rule.ReportFixer = (fixer) =>
              edits.map((e) => fixer.replaceTextRange(e.range, e.text));
            // `eslint --fix` and fix-on-save apply fixes unasked, so a rename to a component the
            // file does not import yet is a suggestion: the message names the import to add.
            const unbound = edits
              .map((e) => unboundRename(context.sourceCode, e))
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

const plugin = {
  meta: { name: NAME, version: VERSION },
  rules,
  configs: {} as { recommended: Linter.Config },
} satisfies ESLint.Plugin;

/**
 * Every rule at its default severity, for `.tsx` and `.jsx` files other than tests and stories,
 * which `check` also leaves out unless asked (`--include-tests`).
 */
plugin.configs.recommended = {
  name: 'onsystem/recommended',
  files: ['**/*.{tsx,jsx}'],
  ignores: [DEFAULT_TEST_EXCLUDE, DEFAULT_TEST_FOLDERS],
  plugins: { onsystem: plugin },
  rules: Object.fromEntries(
    RULES.map((rule) => [`onsystem/${rule.id}`, DEFAULT_SEVERITY[rule.id]]),
  ),
};

export default plugin;
