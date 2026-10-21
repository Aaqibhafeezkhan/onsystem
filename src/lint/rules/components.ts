import path from 'node:path';

import ts from 'typescript';

import type { ComponentInfo, PropInfo, TextEdit } from '../../types.js';
import { propertyName } from '../../extract/cva.js';
import { matchesGlob, toPosix } from '../../util/paths.js';
import { closest, editDistance } from '../../util/strings.js';
import {
  asFunction,
  attributeLiterals,
  attributeName,
  findAttribute,
  literalValues,
  returnedExpressions,
  valueBranches,
  type JsxNode,
} from '../analyze.js';
import type { Rule, RuleContext } from '../context.js';
import { NON_TEXT_INPUT_TYPES } from '../target.js';

function renameTag(context: RuleContext, element: JsxNode, name: string): TextEdit[] {
  const edits: TextEdit[] = [
    { range: [element.tagName.getStart(context.sourceFile), element.tagName.end], text: name },
  ];
  if (element.closing) {
    edits.push({
      range: [element.closing.tagName.getStart(context.sourceFile), element.closing.tagName.end],
      text: name,
    });
  }
  return edits;
}

function tagRange(context: RuleContext, element: JsxNode): { start: number; end: number } {
  return { start: element.tagName.getStart(context.sourceFile), end: element.tagName.end };
}

/**
 * How the checked file imports `component`. A package or alias specifier is the same
 * everywhere; a relative one (a project without aliases) is rewritten from the root to the
 * checked file, so `./src/Button` becomes `../src/Button` in `app/page.tsx`.
 */
function importLine(component: ComponentInfo, context: RuleContext): string {
  const binding = component.exportName.split('.')[0] ?? component.name;
  let specifier = component.importPath;
  if (specifier.startsWith('.')) {
    const file = path.isAbsolute(context.file)
      ? path.relative(context.target.model.root, context.file)
      : context.file;
    const relative = path.posix.relative(
      path.posix.dirname(toPosix(file)),
      path.posix.normalize(specifier),
    );
    specifier = relative.startsWith('.') ? relative : `./${relative}`;
  }
  return `import { ${binding} } from "${specifier}"`;
}

// ─── prefer-design-system-component ─────────────────────────────────────────

export const preferDesignSystemComponent: Rule = {
  id: 'prefer-design-system-component',
  description:
    'Use the design-system component instead of the native element it wraps (<Button> over <button>).',
  run(context) {
    if (context.isDesignSystemSource) return;
    const allow = new Set(context.options.allow ?? []);
    for (const element of context.analysis.elements) {
      const resolution = context.resolve(element);
      if (resolution.kind !== 'intrinsic' || allow.has(resolution.tag)) continue;
      let key = resolution.tag;
      if (key === 'input') {
        // `<input {...getInputProps()} />`: every attribute comes from a spread, the type
        // too (react-dropzone's is a file input), so what it is cannot be told.
        if (element.hasSpread && !element.attributes.length) continue;
        const type = attributeLiterals(element, 'type')[0]?.text;
        if (type && NON_TEXT_INPUT_TYPES.has(type)) key = `input[type=${type}]`;
      }
      const component = context.target.elements.get(key);
      if (!component) continue;
      // Code copied from a shadcn registry is checked against, not suggested: signoff-ui's
      // internal `Img` is no replacement for an app's <img>. Unless the config maps it.
      if (fromRegistry(component, context) && context.target.config.elements[key] === undefined) {
        continue;
      }
      // An element no one sees or reaches is no UI to replace: the off-screen input that
      // carries a custom select's `required`, an `aria-hidden` proxy.
      if (hiddenFromUser(element)) continue;
      // The element a design-system component renders through `asChild` takes that
      // component's styles: `<SidebarMenuButton asChild><button /></SidebarMenuButton>`.
      if (styledByParent(element, context)) continue;
      // A bare element, with no content, class or style of its own, is a slot another
      // component renders into (`<Chip render={<button type="button" />} />`), not UI to restyle.
      if (isBare(element)) continue;
      // Classes from a cva/tv definition in the same file: code that defines its own variants
      // is building a component (Dub's date-picker trigger), not using one.
      if (styledByOwnVariants(element, context)) continue;
      // Inside a component of the same name (a design system's own `Table` around a <table>),
      // the element is how that component is built.
      if (enclosingComponent(element.node) === component.name) continue;
      // Renaming the tag is only safe when the component takes the element's
      // attributes; a match by name (Radix `Dialog` for `<dialog>`, `Select`
      // for `<select>`) needs a rewrite.
      const dropIn = context.target.isDropIn(component, key);
      const styled = Boolean(findAttribute(element, 'className'));
      const rendered = component.element;
      context.report({
        ...tagRange(context, element),
        message:
          `Native <${resolution.tag}> where the design system has <${component.name}>. ` +
          `Use <${component.name}> (${importLine(component, context)})` +
          (!dropIn
            ? rendered && rendered !== resolution.tag
              ? `; it renders a <${rendered}>, not a <${resolution.tag}>, so check its props and parts with get_component.`
              : `; it may not take the attributes of a <${resolution.tag}>, so check its props and parts with get_component.`
            : styled
              ? '; its variants replace the custom classes.'
              : '.'),
        suggestion: `<${component.name}>`,
        fix: dropIn ? renameTag(context, element, component.name) : undefined,
      });
    }
  },
};

/**
 * Whether `component` is in the folder of a shadcn registry that components.json names
 * (`components/signoff-ui`): a read-only design system, ranked after the others.
 */
function fromRegistry(component: ComponentInfo, context: RuleContext): boolean {
  const file = component.source.file;
  return (context.target.config.designSystems ?? []).some(
    (source) =>
      source.registry !== undefined && source.components.some((g) => matchesGlob(file, g)),
  );
}

const definitionsByFile = new WeakMap<ts.SourceFile, Set<string>>();

/** Whether the element's `className` calls a `cva(...)` or `tv(...)` definition declared in this file. */
function styledByOwnVariants(element: JsxNode, context: RuleContext): boolean {
  const init = findAttribute(element, 'className')?.initializer;
  if (!init || !ts.isJsxExpression(init) || !init.expression) return false;
  let definitions = definitionsByFile.get(context.sourceFile);
  if (!definitions) {
    definitions = new Set();
    for (const statement of context.sourceFile.statements) {
      if (!ts.isVariableStatement(statement)) continue;
      for (const declaration of statement.declarationList.declarations) {
        const value = declaration.initializer;
        if (
          ts.isIdentifier(declaration.name) &&
          value &&
          ts.isCallExpression(value) &&
          ts.isIdentifier(value.expression) &&
          (value.expression.text === 'cva' || value.expression.text === 'tv')
        ) {
          definitions.add(declaration.name.text);
        }
      }
    }
    definitionsByFile.set(context.sourceFile, definitions);
  }
  if (!definitions.size) return false;
  const known = definitions;
  let found = false;
  const visit = (node: ts.Node): void => {
    if (found) return;
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      known.has(node.expression.text)
    ) {
      found = true;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(init.expression);
  return found;
}

/**
 * A `button`, `a` or `label`, whose content is its children, self-closing and with no
 * `className` or `style`: an element type to render into, not styled UI. Void elements
 * (`<input />`, `<img />`) are always self-closing and stay UI.
 */
function isBare(element: JsxNode): boolean {
  return (
    ['button', 'a', 'label'].includes(element.tag) &&
    ts.isJsxSelfClosingElement(element.node) &&
    !element.hasSpread &&
    !findAttribute(element, 'className') &&
    !findAttribute(element, 'style')
  );
}

/**
 * Whether `element` is the `asChild` child of a design-system component with classes of
 * its own, directly or as a branch of a condition, so the component styles it.
 */
function styledByParent(element: JsxNode, context: RuleContext): boolean {
  let node: ts.Node = element.node.parent;
  while (
    ts.isParenthesizedExpression(node) ||
    ts.isConditionalExpression(node) ||
    ts.isJsxExpression(node) ||
    (ts.isBinaryExpression(node) &&
      [
        ts.SyntaxKind.AmpersandAmpersandToken,
        ts.SyntaxKind.BarBarToken,
        ts.SyntaxKind.QuestionQuestionToken,
      ].includes(node.operatorToken.kind))
  ) {
    node = node.parent;
  }
  if (!ts.isJsxElement(node)) return false;
  const parent = context.analysis.elements.find((e) => e.node === node);
  if (!parent || !findAttribute(parent, 'asChild')) return false;
  const resolution = context.resolve(parent);
  return resolution.kind === 'component' && resolution.component.classNames.length > 0;
}

/**
 * Whether an element is kept from the user: `hidden`, `aria-hidden`, or out of the tab
 * order (`tabIndex={-1}`) and invisible (`opacity: 0`, `opacity-0`, `invisible`, `sr-only`).
 */
function hiddenFromUser(element: JsxNode): boolean {
  const flag = (name: string) => {
    const attribute = findAttribute(element, name);
    if (!attribute) return false;
    const init = attribute.initializer;
    if (!init) return true;
    if (ts.isStringLiteral(init))
      return init.text === 'true' || (name === 'hidden' && init.text !== 'false');
    return (
      ts.isJsxExpression(init) &&
      init.expression !== undefined &&
      init.expression.kind === ts.SyntaxKind.TrueKeyword
    );
  };
  if (flag('hidden') || flag('aria-hidden')) return true;
  const tabIndex = findAttribute(element, 'tabIndex')?.initializer;
  const outOfOrder =
    tabIndex !== undefined &&
    ((ts.isStringLiteral(tabIndex) && tabIndex.text === '-1') ||
      (ts.isJsxExpression(tabIndex) &&
        tabIndex.expression !== undefined &&
        ts.isPrefixUnaryExpression(tabIndex.expression) &&
        tabIndex.expression.operator === ts.SyntaxKind.MinusToken &&
        ts.isNumericLiteral(tabIndex.expression.operand) &&
        tabIndex.expression.operand.text === '1'));
  if (!outOfOrder) return false;
  const classes = attributeLiterals(element, 'className').flatMap((l) => l.text.split(/\s+/));
  if (classes.some((c) => c === 'opacity-0' || c === 'invisible' || c === 'sr-only')) return true;
  const style = findAttribute(element, 'style')?.initializer;
  const object =
    style &&
    ts.isJsxExpression(style) &&
    style.expression &&
    ts.isObjectLiteralExpression(style.expression)
      ? style.expression
      : undefined;
  return (
    object?.properties.some(
      (p) =>
        ts.isPropertyAssignment(p) &&
        propertyName(p.name) === 'opacity' &&
        ((ts.isNumericLiteral(p.initializer) && Number(p.initializer.text) === 0) ||
          (ts.isStringLiteral(p.initializer) && Number(p.initializer.text) === 0)),
    ) ?? false
  );
}

/** The PascalCase function or class component a node sits in: `Table` for `const Table = forwardRef(...)`. */
function enclosingComponent(node: ts.Node): string | undefined {
  let name: string | undefined;
  ts.findAncestor(node.parent, (current) => {
    if ((ts.isFunctionDeclaration(current) || ts.isClassDeclaration(current)) && current.name) {
      name = current.name.text;
    } else if (ts.isArrowFunction(current) || ts.isFunctionExpression(current)) {
      // Through `forwardRef(...)` and `memo(...)` to the variable it is assigned to.
      let up: ts.Node = current.parent;
      while (ts.isCallExpression(up) || ts.isParenthesizedExpression(up)) up = up.parent;
      name = ts.isVariableDeclaration(up) && ts.isIdentifier(up.name) ? up.name.text : undefined;
    } else {
      name = undefined;
    }
    return name !== undefined && /^[A-Z]/.test(name);
  });
  return name !== undefined && /^[A-Z]/.test(name) ? name : undefined;
}

// ─── no-unknown-component ───────────────────────────────────────────────────

export const noUnknownComponent: Rule = {
  id: 'no-unknown-component',
  description:
    'Components must exist in the design system: no invented components or dot-notation members.',
  run(context) {
    const { target } = context;
    for (const element of context.analysis.elements) {
      const resolution = context.resolve(element);
      const range = tagRange(context, element);

      // A name from a module the model left out may well be real: the check says once, for all
      // files, that it was not checked, rather than call it invented.
      if (
        resolution.kind === 'missing-export' &&
        target.outsideModel(
          resolution.source,
          resolution.name.split('.')[0] ?? resolution.name,
          context.file,
        )
      ) {
        context.unchecked(resolution.name, resolution.source);
        continue;
      }

      if (resolution.kind === 'missing-member') {
        const { owner, member } = resolution;
        const flat = target.components.get(`${owner.name}${member}`);
        if (flat) {
          context.report({
            ...range,
            message: `<${element.tag}> does not exist: ${owner.name} is composed from flat parts. Use <${flat.name}> (${importLine(flat, context)}).`,
            suggestion: `<${flat.name}>`,
            fix: renameTag(context, element, flat.name),
          });
        } else {
          const parts = owner.subcomponents.length
            ? ` Its parts are ${owner.subcomponents.join(', ')}.`
            : '';
          context.report({ ...range, message: `${owner.name} has no member "${member}".${parts}` });
        }
        continue;
      }

      if (resolution.kind === 'missing-export') {
        const guess = closest(resolution.name, target.names());
        context.report({
          ...range,
          message:
            `"${resolution.name}" is not a design-system component (imported from "${resolution.source}").` +
            (guess
              ? ` Did you mean <${guess}>?`
              : ' Use search_components to find an existing one.'),
          suggestion: guess ? `<${guess}>` : undefined,
        });
        continue;
      }

      if (resolution.kind === 'unresolved') {
        const guess = closest(resolution.name, target.names());
        const component = guess ? target.components.get(guess) : undefined;
        if (guess && component) {
          // A close name is only a safe rename when it is in scope: `<Cards>` in a
          // fragment without imports may be an app component the agent has not
          // imported yet, not a typo of `<Card>`.
          const binding = context.analysis.imports.get(guess.split('.')[0] ?? guess);
          const inScope =
            binding !== undefined && target.isDesignSystemImport(binding.source, context.file);
          context.report({
            ...range,
            message: inScope
              ? `Unknown component <${resolution.name}>. Did you mean <${guess}>?`
              : `Unknown component <${resolution.name}>. Did you mean <${guess}> (${importLine(component, context)})?`,
            suggestion: `<${guess}>`,
            fix: inScope ? renameTag(context, element, guess) : undefined,
          });
        } else if (context.analysis.imports.size > 0) {
          // Only for whole modules: fragments without imports routinely use
          // icons and app components the agent has not imported yet.
          context.report({
            ...range,
            severity: 'warning',
            message: `<${resolution.name}> is not a design-system component and is not imported or declared here.`,
          });
        }
      }
    }
  },
};

// ─── no-unknown-prop ────────────────────────────────────────────────────────

/**
 * Prop names from other libraries → the conventional name in shadcn-style systems, which mean the
 * same thing there, so the rename is a fix.
 */
const PROP_SYNONYMS: Record<string, string[]> = {
  variant: [
    'tone',
    'intent',
    'kind',
    'appearance',
    'color',
    'colorScheme',
    'colorPalette',
    'look',
    'theme',
    'severity',
    'status',
    'type',
  ],
  size: ['sz', 'scale', 'dimension'],
  disabled: ['isDisabled'],
  required: ['isRequired'],
  open: ['isOpen', 'opened', 'visible', 'show', 'shown'],
  onOpenChange: ['onVisibleChange'],
};

/**
 * Handlers other libraries call on one side of a change, against `onOpenChange`, which runs on
 * open and on close with the new state: renamed, `onClose={() => setOpen(false)}` would keep a
 * dialog shut. The message shows the check to add instead of offering the rename.
 */
const OPEN_CHANGE_HANDLERS = new Map([
  ['onClose', '{ if (!open) … }'],
  ['onDismiss', '{ if (!open) … }'],
  ['onOpen', '{ if (open) … }'],
  ['onToggle', '…'],
]);

/**
 * Props that mean the same thing in different conventions: native elements and Radix on one
 * side, React Aria Components on the other. A native field states `isInvalid` as `aria-invalid`. Whichever spelling an agent writes, the one the
 * component takes is suggested, in either direction. Event handlers are left out: their
 * arguments differ (`onCheckedChange(checked)` against an input's `onChange(event)`).
 */
const PROP_EQUIVALENTS: string[][] = [
  ['disabled', 'isDisabled'],
  ['required', 'isRequired'],
  ['readOnly', 'isReadOnly'],
  ['invalid', 'isInvalid', 'aria-invalid'],
  ['open', 'isOpen'],
  ['checked', 'isSelected', 'selected'],
  ['defaultChecked', 'defaultSelected'],
  ['indeterminate', 'isIndeterminate'],
];

/** Props other libraries compose with, which no prop of a similar spelling stands in for. */
const FOREIGN_COMPOSITION = new Set(['href', 'as', 'component']);

/**
 * Radix composes with `asChild` and a child element, Base UI with a `render`
 * element; shadcn/ui ships both, and agents mix them up, or bring `as`, `component`
 * or `href` from other libraries. Renaming the prop is not enough (`asChild` is a
 * boolean, and a button with an `href` is still no link), so this explains the
 * other way instead of offering a fix.
 */
function compositionHint(
  name: string,
  known: Set<string>,
  tag: string,
): { prop: string; text: string } | undefined {
  const radix = `compose with asChild and a single child`;
  const radixExample = `<${tag} asChild><Link href="…">…</Link></${tag}>`;
  const base = `compose with render`;
  const baseExample = `<${tag} render={<Link href="…" />}>…</${tag}>`;
  if (name === 'href') {
    if (known.has('asChild')) {
      return { prop: 'asChild', text: `For a link, Radix components ${radix}: ${radixExample}.` };
    }
    if (known.has('render')) {
      return { prop: 'render', text: `For a link, Base UI components ${base}: ${baseExample}.` };
    }
    return undefined;
  }
  if (['asChild', 'as', 'component'].includes(name) && known.has('render')) {
    return { prop: 'render', text: `Base UI components ${base} instead: ${baseExample}.` };
  }
  if (['render', 'as', 'component'].includes(name) && known.has('asChild')) {
    return { prop: 'asChild', text: `Radix components ${radix} instead: ${radixExample}.` };
  }
  return undefined;
}

/** `onClick`, `onValueChange`: a handler, whose arguments a spelling match does not tell. */
const HANDLER = /^on[A-Z]/;

/**
 * The prop an unknown one most likely means, and whether the rename is safe as a fix: an
 * equivalent, a synonym or the same name in other case (`onclick`, `tabindex`) means the same,
 * and so does an own prop one edit away (`varient`, `onPres`). A forwarded attribute of a
 * similar spelling is only named, since one letter can make another prop (`disable` is
 * `disabled`, but `href` is not `ref`). `ref`, own or forwarded, and forwarded handlers, whose
 * events differ (`onValueChange` is not `onVolumeChange`), are not guessed by spelling at all,
 * and neither is anything for `href`, `as` or `component` (`ref`, `is`), which compose.
 */
function guessProp(
  name: string,
  own: readonly string[],
  known: Set<string>,
): { prop: string; fix: boolean } | undefined {
  if (FOREIGN_COMPOSITION.has(name)) return undefined;
  const equivalents = PROP_EQUIVALENTS.find((group) => group.includes(name)) ?? [];
  const equivalent =
    equivalents.find((other) => other !== name && own.includes(other)) ??
    equivalents.find((other) => other !== name && known.has(other));
  if (equivalent) return { prop: equivalent, fix: true };
  const synonym = Object.entries(PROP_SYNONYMS).find(
    ([target, aliases]) => known.has(target) && aliases.includes(name),
  )?.[0];
  if (synonym) return { prop: synonym, fix: true };
  if (OPEN_CHANGE_HANDLERS.has(name) && known.has('onOpenChange')) {
    return { prop: 'onOpenChange', fix: false };
  }
  const lower = name.toLowerCase();
  const recased = [...known].find((prop) => prop.toLowerCase() === lower);
  if (recased) return { prop: recased, fix: true };
  const typo = closest(
    name,
    own.filter((prop) => prop !== 'ref'),
  );
  if (typo) return { prop: typo, fix: editDistance(lower, typo.toLowerCase()) <= 1 };
  const similar = closest(
    name,
    [...known].filter((prop) => prop !== 'ref' && !HANDLER.test(prop)),
    0.25,
  );
  return similar ? { prop: similar, fix: false } : undefined;
}

export const noUnknownProp: Rule = {
  id: 'no-unknown-prop',
  description: 'Props must exist on the component (own props or the HTML attributes it forwards).',
  run(context) {
    const { propSets } = context.target.model;
    for (const element of context.analysis.elements) {
      const resolution = context.resolve(element);
      if (resolution.kind !== 'component' || resolution.component.openProps) continue;
      const component = resolution.component;
      // `<Button component={Link} prefetch>` takes Link's props too, which the model does not know.
      if (component.polymorphic && findAttribute(element, component.polymorphic)) continue;
      const own = component.props.map((p) => p.name);
      const known = new Set(own);
      for (const inherited of component.inherits) {
        for (const name of propSets[inherited.set] ?? []) known.add(name);
      }
      for (const attribute of element.attributes) {
        const name = attributeName(attribute);
        if (
          known.has(name) ||
          name === 'key' ||
          name === 'ref' ||
          name.includes('-') ||
          name.includes(':')
        ) {
          continue;
        }
        const composition = compositionHint(name, known, element.tag);
        if (composition) {
          context.report({
            start: attribute.name.getStart(context.sourceFile),
            end: attribute.name.end,
            message: `<${element.tag}> has no prop "${name}". ${composition.text}`,
            suggestion: composition.prop,
          });
          continue;
        }
        const guess = guessProp(name, own, known);
        const prop = guess ? component.props.find((p) => p.name === guess.prop) : undefined;
        const values = prop?.values?.length
          ? ` (${prop.values.map((v) => `"${v}"`).join(' | ')})`
          : '';
        const handler = guess?.prop === 'onOpenChange' ? OPEN_CHANGE_HANDLERS.get(name) : undefined;
        const valueOk =
          !prop?.values || literalValues(attribute).every((l) => prop.values?.includes(l.text));
        // Renaming `isOpen` to `open` next to an existing `open` would duplicate it.
        const taken = guess !== undefined && findAttribute(element, guess.prop) !== undefined;
        context.report({
          start: attribute.name.getStart(context.sourceFile),
          end: attribute.name.end,
          message:
            `<${element.tag}> has no prop "${name}".` +
            (guess ? ` Did you mean "${guess.prop}"${values}?` : '') +
            (handler
              ? ` It is called with the new open state, on open as well as on close: onOpenChange={(open) => ${handler}}.`
              : ''),
          suggestion: guess?.prop,
          fix:
            guess?.fix && valueOk && !taken
              ? [
                  {
                    range: [attribute.name.getStart(context.sourceFile), attribute.name.end],
                    text: guess.prop,
                  },
                ]
              : undefined,
        });
      }
    }
  },
};

// ─── no-unknown-variant ─────────────────────────────────────────────────────

/**
 * Variant values that mean the same thing across libraries. A value in a
 * group maps to whichever member the component actually accepts, so "error"
 * becomes "destructive" for shadcn/ui and "danger" for a system that uses that.
 */
const VALUE_GROUPS: string[][] = [
  ['destructive', 'danger', 'error', 'delete', 'remove', 'negative', 'critical', 'red', 'alert'],
  ['default', 'primary', 'main', 'solid', 'filled', 'brand', 'contained'],
  ['ghost', 'tertiary', 'text', 'subtle', 'plain', 'minimal', 'flat', 'transparent', 'quiet'],
  ['outline', 'outlined', 'bordered', 'stroke', 'border', 'hollow'],
  ['secondary', 'neutral', 'muted', 'gray', 'grey', 'soft', 'light'],
  ['success', 'positive', 'ok', 'green', 'active', 'valid', 'done'],
  ['warning', 'caution', 'warn', 'yellow', 'amber', 'pending'],
  ['info', 'information', 'note', 'notice', 'blue'],
  ['link', 'anchor', 'href', 'inline'],
  // Size steps: other names for the same step.
  ['xs', 'xsmall', 'x-small', 'extra-small'],
  ['sm', 'small', 's', 'compact', 'tiny'],
  ['md', 'medium', 'm', 'default', 'normal', 'regular', 'base'],
  ['lg', 'large', 'l', 'big'],
  ['xl', 'xlarge', 'x-large', 'extra-large', 'huge'],
  ['icon', 'iconOnly', 'icon-only', 'square', 'icon-button'],
];

/**
 * A value with the x's of its size step counted, so two spellings of one step compare equal:
 * `xxl` and `2xl` both give `2xl`, `icon-XXS` and `icon-2xs` both give `icon-2xs`.
 */
function stepSpelling(value: string): string {
  return value
    .toLowerCase()
    .replace(
      /(^|-)(x{2,})([sl])$/,
      (_, start: string, xs: string, end: string) => `${start}${xs.length}x${end}`,
    );
}

/** {@link VALUE_GROUPS} spelled as {@link stepSpelling} spells a value, to compare the two. */
const SPELLED_GROUPS = VALUE_GROUPS.map((group) => group.map(stepSpelling));

/**
 * An allowed value that means the same: the same step spelled another way (`xxl` → `2xl`,
 * `XL` → `xl`), or a synonym (`danger` → `destructive`, `small` → `sm`). A group is searched
 * in its own order, not the scale's: TypeScript orders a union by when the program first met
 * each literal, so another file can reorder the scale, and `positive` must stay `success` on
 * a scale that also has `active`.
 */
function synonymValue(value: string, allowed: readonly string[]): string | undefined {
  const spelling = stepSpelling(value);
  const same = allowed.find((member) => member !== value && stepSpelling(member) === spelling);
  if (same) return same;
  for (const group of SPELLED_GROUPS) {
    if (!group.includes(spelling)) continue;
    for (const member of group) {
      if (member === spelling) continue;
      const match = allowed.find((candidate) => stepSpelling(candidate) === member);
      if (match) return match;
    }
  }
  return undefined;
}

/**
 * The step a size one past an end of the scale stands next to, with its x's counted and its
 * prefix kept: `2xl` → `xl`, `3xl` → `2xl`, `2xs` → `xs`, `xs` → `sm`, `icon-2xl` → `icon-xl`.
 */
function stepInside(spelling: string): string | undefined {
  const match = /^(.*-)?(\d*)x([sl])$/.exec(spelling);
  if (!match) return undefined;
  const prefix = match[1] ?? '';
  const end = match[3];
  if (!match[2]) return end === 's' ? `${prefix}sm` : undefined;
  const count = Number(match[2]);
  if (count < 2) return undefined;
  return `${prefix}${count === 2 ? '' : count - 1}x${end}`;
}

/**
 * The end of the scale a size one step past it stands next to, under whichever name the scale
 * gives it: `2xl` or `xxl` → `xl`, `3xl` → `2xl` or `xxl`, `xs` → `sm` or `small`, `icon-xxl`
 * → `icon-xl`. It renders another size than the one written, so it is named in the message
 * but not fixed.
 */
function nextStep(value: string, allowed: readonly string[]): string | undefined {
  const step = stepInside(stepSpelling(value));
  if (!step) return undefined;
  return allowed.find((member) => stepSpelling(member) === step) ?? synonymValue(step, allowed);
}

/** The step of a size scale a value names, alone or at its end: `xs`, `lg`, `2xl`, `icon-sm`. */
const SIZE_STEP = /(?:^|-)(\d*x*[sml]|sm|md|lg)$/i;

/**
 * An allowed value spelled close to `value`, for the message only: it may be another value
 * altogether. Two steps of a size scale are never guessed from each other, since one letter
 * there is another size (`xl` and `xs`, `icon-xl` and `icon-xs`).
 */
function spelledLike(value: string, allowed: readonly string[]): string | undefined {
  const guess = closest(value, allowed, 0.5);
  const step = SIZE_STEP.exec(value)?.[1]?.toLowerCase();
  const guessStep = guess ? SIZE_STEP.exec(guess)?.[1]?.toLowerCase() : undefined;
  return step && guessStep && step !== guessStep ? undefined : guess;
}

export const noUnknownVariant: Rule = {
  id: 'no-unknown-variant',
  description:
    'Variant props (cva variants and string-literal unions) only accept their declared values.',
  run(context) {
    for (const element of context.analysis.elements) {
      const resolution = context.resolve(element);
      if (resolution.kind !== 'component') continue;
      for (const attribute of element.attributes) {
        const name = attributeName(attribute);
        const prop: PropInfo | undefined = resolution.component.props.find(
          (p) => p.name === name && p.values?.length,
        );
        if (!prop?.values) continue;
        for (const literal of literalValues(attribute)) {
          if (prop.values.includes(literal.text)) continue;
          const synonym = synonymValue(literal.text, prop.values);
          const guess =
            synonym ??
            nextStep(literal.text, prop.values) ??
            spelledLike(literal.text, prop.values);
          const start = literal.getStart(context.sourceFile) + 1;
          const end = literal.end - 1;
          context.report({
            start: start - 1,
            end: end + 1,
            message:
              `"${literal.text}" is not a valid ${name} for <${element.tag}>. ` +
              `Allowed: ${prop.values.join(', ')}.` +
              (guess ? ` Did you mean "${guess}"?` : ''),
            suggestion: guess ? `${name}="${guess}"` : undefined,
            fix: synonym ? [{ range: [start, end], text: synonym }] : undefined,
          });
        }
      }
    }
  },
};

// ─── icon-button-accessible-name ────────────────────────────────────────────

/**
 * Labels guessed from an icon's name, for the message. The third pattern names the icons that mean
 * one thing on a button (a trash can deletes, a magnifier searches), matched against the name
 * without its digits or `Icon` suffix (`Trash2Icon` is `Trash`): only their label is fixed. A plus
 * may add or expand, a chevron page or expand, an X close, remove or clear, so those are fixed only
 * where the code says which (`iconLabel`), and the rest are named without a fix.
 */
const ICON_LABELS: [RegExp, string, RegExp?][] = [
  [/^(Trash|Delete|Bin)/, 'Delete', /^(?:Trash|Delete|Bin)$/],
  [/^(X|Close|Cross)(Icon)?$|^X(Circle|Square)/, 'Close'],
  [/^(Plus|Add)/, 'Add'],
  [/^(Pencil|Edit|PenLine|SquarePen)/, 'Edit', /^(?:Pencil|Edit|SquarePen)$/],
  [/^Search/, 'Search', /^Search$/],
  [/^(Menu|Hamburger)/, 'Open menu'],
  [/^(Settings|Cog|Gear)/, 'Settings', /^(?:Settings|Cog|Gear)$/],
  [/^(Copy|Clipboard)/, 'Copy', /^(?:Copy|ClipboardCopy)$/],
  [/^Download/, 'Download', /^Download$/],
  [/^Upload/, 'Upload', /^Upload$/],
  [/^(MoreHorizontal|MoreVertical|Ellipsis|DotsHorizontal|DotsVertical)/, 'More options'],
  [/^ChevronLeft|^ArrowLeft/, 'Previous'],
  [/^ChevronRight|^ArrowRight/, 'Next'],
  [/^(UserMinus|UserX)/, 'Remove member'],
  [/^(UserPlus)/, 'Invite member'],
  [/^(RefreshCw|RefreshCcw|RotateCw)/, 'Refresh'],
  [/^(Share)/, 'Share', /^Share$/],
  [/^(Filter)/, 'Filter', /^Filter$/],
  [/^(Info)/, 'More information'],
];

/** A part that expands and collapses: `CollapsibleTrigger`, `Accordion.Trigger`, `DisclosureButton`. */
const TOGGLE_PART = /(?:Collapsible|Accordion|Disclosure)\w*\.?\w*(?:Trigger|Button)$/;
/** A part that closes its dialog, sheet or popover: `DialogClose`, `Dialog.Close`. */
const CLOSE_PART = /Close$/;
/** A part that opens a menu: `DropdownMenuTrigger`, `Menu.Trigger`, Headless UI's `MenuButton`. */
const MENU_TRIGGER = /Menu\w*\.?\w*Trigger$|^(?:\w+\.)?Menu\.?Button$/;
/** Classes styled by an expanded state: `data-[state=open]:rotate-90`, `aria-expanded:bg-muted`. */
const EXPANDED_CLASS = /data-\[state=(?:open|closed)\]|aria-expanded:/;

/** The tags of the button and of every element around it, its `render` host included. */
function enclosingTags(context: RuleContext, element: JsxNode): string[] {
  const tags = [element.tag];
  ts.findAncestor(element.node.parent, (node) => {
    if (ts.isJsxElement(node)) tags.push(node.openingElement.tagName.getText(context.sourceFile));
    return false;
  });
  return tags;
}

/** The names a callee is reached by: `deleteMutation.mutate` is `deleteMutation` and `mutate`. */
function calleeNames(expression: ts.Expression): string[] {
  const names: string[] = [];
  let current: ts.Expression = expression;
  for (;;) {
    if (ts.isNonNullExpression(current) || ts.isParenthesizedExpression(current)) {
      current = current.expression;
    } else if (ts.isPropertyAccessExpression(current)) {
      names.unshift(current.name.text);
      current = current.expression;
    } else {
      if (ts.isIdentifier(current)) names.unshift(current.text);
      return names;
    }
  }
}

type HandlerAction = 'Remove' | 'Clear' | 'Close';

/** The words that name each action in a function's name. */
const ACTION_WORDS: [HandlerAction, readonly string[]][] = [
  ['Remove', ['remove', 'delete']],
  ['Clear', ['clear', 'reset']],
  ['Close', ['close', 'dismiss', 'hide']],
];

/** Calls that tidy up around the action rather than name it: `clearTimeout(timer)`. */
const HOUSEKEEPING =
  /^(?:clearTimeout|clearInterval|clearImmediate|removeEventListener|removeListener)$/;

/**
 * What one call or handler reference does, by its name: `removeAssertion`, `onClose`,
 * `setOpen(false)`. A name with words of two actions (`closeDeleteDialog`, `hideRemoveConfirm`) or
 * with `cancel` (`onCancelDelete`) says none.
 */
function actionOf(names: string[], argument?: ts.Expression): HandlerAction | undefined {
  const last = names.at(-1) ?? '';
  if (HOUSEKEEPING.test(last)) return undefined;
  const words = names.flatMap((name) => name.split(/(?=[A-Z])|_/)).map((w) => w.toLowerCase());
  if (
    argument?.kind === ts.SyntaxKind.FalseKeyword &&
    words.some((w) => w === 'open' || w === 'show' || w === 'visible')
  ) {
    return 'Close';
  }
  // A state setter names state, not an action: `setDeleteTarget(null)`.
  if (/^set[A-Z]/.test(last) || words.includes('cancel')) return undefined;
  const actions = ACTION_WORDS.filter(([, named]) => words.some((w) => named.includes(w)));
  return actions.length === 1 ? actions[0]?.[0] : undefined;
}

/**
 * What a button's `onClick` (or React Aria's `onPress`) does, by the names of the functions it
 * calls or passes, and whether that is sure: only when every name says the same action. A close
 * button that also tidies up (`form.reset(); setOpen(false)`) or a button that removes a row and
 * closes a popover is named "Close", or "Remove" when it removes and clears, without a fix.
 * Callbacks inside the handler run later, on their own events (`mutate(id, { onSuccess: () =>
 * toast.dismiss() })`), so they do not count.
 */
function handlerAction(
  attributes: readonly ts.JsxAttribute[],
): { action: HandlerAction; sure: boolean } | undefined {
  const found = new Set<HandlerAction>();
  for (const attribute of attributes) {
    if (!/^on(?:Click|Press)$/.test(attributeName(attribute))) continue;
    const init = attribute.initializer;
    const value = init && ts.isJsxExpression(init) ? init.expression : undefined;
    if (!value) continue;
    const reference = actionOf(calleeNames(value));
    if (reference) found.add(reference);
    const stack: ts.Node[] = [value];
    for (let node = stack.pop(); node; node = stack.pop()) {
      if (ts.isCallExpression(node)) {
        const action = actionOf(calleeNames(node.expression), node.arguments[0]);
        if (action) found.add(action);
      }
      ts.forEachChild(node, (child) => {
        if (!ts.isFunctionLike(child)) stack.push(child);
      });
    }
  }
  const [only] = found;
  if (!only) return undefined;
  if (found.size === 1) return { action: only, sure: true };
  return { action: found.has('Close') ? 'Close' : 'Remove', sure: false };
}

/**
 * The label for an icon-only button, and whether the fix may write it: only when the icon means
 * one thing on a button, or the code says what it does. A chevron that expands or collapses gets
 * no direction; an X is named by its handler (`Remove`, `Clear`, `Close`), and `Close` is fixed
 * in a close part; "More options" is fixed on a menu's trigger.
 */
function iconLabel(
  context: RuleContext,
  element: JsxNode,
  host: JsxNode | undefined,
  icon: string | undefined,
): { label?: string; fixed: boolean } {
  const entry = icon ? ICON_LABELS.find(([pattern]) => pattern.test(icon)) : undefined;
  if (!icon || !entry) return { fixed: false };
  const [, label, plain] = entry;
  const tags = enclosingTags(context, element);
  const owners = host ? [element, host] : [element];
  const attributes = owners.flatMap((owner) => owner.attributes);
  if (label === 'Next' || label === 'Previous') {
    const toggles =
      tags.some((tag) => TOGGLE_PART.test(tag)) ||
      attributes.some((a) => /^(?:aria-expanded|data-state)$/.test(attributeName(a))) ||
      context.analysis.classStrings.some(
        (c) => c.element && owners.includes(c.element) && EXPANDED_CLASS.test(c.text),
      );
    return { label: toggles ? 'Toggle' : label, fixed: false };
  }
  if (label === 'Close') {
    // A close part closes, whatever else its onClick does (`form.reset()`).
    if (tags.some((tag) => CLOSE_PART.test(tag))) return { label, fixed: true };
    const handler = handlerAction(attributes);
    return handler ? { label: handler.action, fixed: handler.sure } : { label, fixed: false };
  }
  if (label === 'More options') {
    return { label, fixed: tags.some((tag) => MENU_TRIGGER.test(tag)) };
  }
  return { label, fixed: plain?.test(icon.replace(/Icon$/, '').replace(/\d+$/, '')) ?? false };
}

/**
 * What a button holds: text (or a labelled element), icons only, nothing, or
 * something this rule cannot see into, such as `<AvatarWithText primaryText=…>`
 * or an app component: then it says nothing.
 */
type Content = 'text' | 'unknown' | 'icon' | 'empty';

/** Text wins, then content the rule cannot read, then icons. */
const PRECEDENCE: Content[] = ['text', 'unknown', 'icon', 'empty'];
function combine(a: Content, b: Content): Content {
  return PRECEDENCE.indexOf(a) <= PRECEDENCE.indexOf(b) ? a : b;
}

/** i18n components that render text: react-intl's `Formatted*`, react-i18next's and Lingui's `Trans`. */
const TEXT_COMPONENTS = /^(?:Formatted[A-Z]\w*|Trans|Translate)$/;

/** `XIcon`, `IconX`, `Icon`, `Icons.Add`. */
const ICON_NAME = /^Icons?(?:$|[A-Z.])|Icon$/;

/** Icon libraries, and a project's own icon modules (`@/components/icons`, `@acme/ui/icons`). */
const ICON_SOURCE =
  /^(?:lucide-react|lucide|@lucide\/.+|@heroicons\/.+|@radix-ui\/react-icons|react-icons(?:\/.+)?|@tabler\/icons(?:-react)?|@phosphor-icons\/.+|phosphor-react|@remixicon\/react|react-feather|@mui\/icons-material(?:\/.+)?|iconoir-react|@iconify\/react|@primer\/octicons-react|@fortawesome\/react-fontawesome)$|(?:^|\/)icons?(?:\/|$)/;

/** Props an icon takes; any other prop with text or markup in it means the child shows more than an icon. */
const ICON_PROPS =
  /^(?:className|class|style|size|width|height|color|fill|stroke|strokeWidth|absoluteStrokeWidth|weight|variant|name|icon|viewBox|mirrored|focusable|role|id|key|ref|type|aria-hidden|data-[\w-]+)$/;

/** Common icon names, for fragments that use an icon without importing it. */
const ICON_WORDS =
  /^(?:Chevron|Arrow|Check|Circle|Square|Star|Heart|Bell|Mail|Lock|Unlock|Eye|Calendar|Clock|Home|Loader|Spinner|Send|Save|Pin|Link|External|Sun|Moon|Grip|Drag|Bookmark|Archive|Bold|Italic|Undo|Redo|Play|Pause|Stop|Minus|Ellipsis|Dots|Kebab|Hamburger)/;

/**
 * Whether a PascalCase child is an icon: by its name (`XIcon`), where it comes
 * from (an icon library or icons module), or a common icon name (`Trash2`,
 * `ChevronLeft`) when it is not imported or comes from a design system that
 * re-exports its icons (`import { ChevronLeft } from "@dub/ui"`) without
 * being one of its components.
 */
function isIconLike(tag: string, context: RuleContext): boolean {
  if (ICON_NAME.test(tag)) return true;
  const shaped = ICON_WORDS.test(tag) || ICON_LABELS.some(([pattern]) => pattern.test(tag));
  const head = tag.split('.')[0] ?? tag;
  const binding = context.analysis.imports.get(head);
  if (binding) {
    if (ICON_SOURCE.test(binding.source)) return true;
    const { target } = context;
    return (
      shaped &&
      target.isDesignSystemImport(binding.source, context.file) &&
      !target.components.has(binding.imported)
    );
  }
  if (context.analysis.declared.has(head)) return false;
  return shaped;
}

/** A prop whose value is text or markup (`text="Export"`, `primaryText={<span>…</span>}`), other than an icon's own. */
function hasTextualProps(opening: ts.JsxOpeningElement | ts.JsxSelfClosingElement): boolean {
  return opening.attributes.properties.some((attribute) => {
    if (!ts.isJsxAttribute(attribute) || ICON_PROPS.test(attributeName(attribute))) return false;
    const init = attribute.initializer;
    if (!init) return false;
    if (ts.isStringLiteral(init)) return init.text.trim() !== '';
    const value = ts.isJsxExpression(init) ? init.expression : init;
    return (
      value !== undefined &&
      valueBranches(value).some(
        (branch) =>
          ts.isStringLiteralLike(branch) ||
          ts.isTemplateExpression(branch) ||
          ts.isJsxElement(branch) ||
          ts.isJsxSelfClosingElement(branch) ||
          ts.isJsxFragment(branch),
      )
    );
  });
}

/** `<svg><title>Close</title>…</svg>`: the title is the image's accessible name. */
function hasSvgTitle(svg: ts.Node, context: RuleContext): boolean {
  return (
    ts.isJsxElement(svg) &&
    svg.children.some(
      (child) =>
        ts.isJsxElement(child) &&
        child.openingElement.tagName.getText(context.sourceFile) === 'title' &&
        child.children.some((c) =>
          ts.isJsxText(c) ? c.text.trim() !== '' : ts.isJsxExpression(c) && c.expression,
        ),
    )
  );
}

function classify(children: readonly ts.Node[], context: RuleContext, icons: string[]): Content {
  let result: Content = 'empty';
  for (const child of children) {
    let kind: Content = 'empty';
    if (ts.isJsxText(child)) kind = child.text.trim() ? 'text' : 'empty';
    else if (ts.isJsxExpression(child)) {
      // A render prop (`{({ isPending }) => <Trash2 />}`) shows what it returns; any other
      // expression may be text.
      const fn = child.expression && asFunction(child.expression);
      kind = fn ? classifyReturned(fn, context, icons) : child.expression ? 'text' : 'empty';
    } else if (ts.isJsxFragment(child)) kind = classify(child.children, context, icons);
    else if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
      const opening = ts.isJsxElement(child) ? child.openingElement : child;
      const tag = opening.tagName.getText(context.sourceFile);
      const hasLabel = opening.attributes.properties.some(
        (a) =>
          ts.isJsxAttribute(a) &&
          /^(aria-label|aria-labelledby|alt|title)$/.test(a.name.getText(context.sourceFile)) &&
          !(a.initializer && ts.isStringLiteral(a.initializer) && !a.initializer.text.trim()),
      );
      if (hasLabel || (tag === 'svg' && hasSvgTitle(child, context))) kind = 'text';
      else if (tag === 'svg' || tag === 'img') kind = 'icon';
      else if (ts.isJsxElement(child) && child.children.length) {
        kind = classify(child.children, context, icons);
      } else if (TEXT_COMPONENTS.test(tag)) {
        kind = 'text';
      } else if (/^[A-Z]/.test(tag)) {
        if (!hasTextualProps(opening) && isIconLike(tag, context)) {
          icons.push(tag);
          kind = 'icon';
        } else {
          kind = 'unknown';
        }
      }
    }
    if (kind === 'text') return 'text';
    result = combine(result, kind);
  }
  return result;
}

/** What a render prop returns, across `return`s and branches: text wins, then icons. */
function classifyReturned(
  fn: ts.ArrowFunction | ts.FunctionExpression,
  context: RuleContext,
  icons: string[],
): Content {
  let result: Content = 'empty';
  for (const value of returnedExpressions(fn).flatMap(valueBranches)) {
    const kind: Content =
      ts.isJsxElement(value) || ts.isJsxSelfClosingElement(value) || ts.isJsxFragment(value)
        ? classify([value], context, icons)
        : value.kind === ts.SyntaxKind.NullKeyword ||
            value.kind === ts.SyntaxKind.FalseKeyword ||
            (ts.isIdentifier(value) && value.text === 'undefined')
          ? 'empty'
          : 'text';
    if (kind === 'text') return 'text';
    result = combine(result, kind);
  }
  return result;
}

/** A button, native or a design-system component that renders or is named like one. */
function isButton(context: RuleContext, element: JsxNode): boolean {
  const resolution = context.resolve(element);
  return (
    (resolution.kind === 'intrinsic' && resolution.tag === 'button') ||
    (resolution.kind === 'component' &&
      (resolution.component.element === 'button' || /Button$/.test(resolution.component.name)))
  );
}

/** `aria-label`, `aria-labelledby` or `title` with a value that is not blank. */
function hasLabel(attributes: readonly ts.JsxAttribute[]): boolean {
  return attributes.some((attribute) => {
    if (!/^(?:aria-label|aria-labelledby|title)$/.test(attributeName(attribute))) return false;
    const values = literalValues(attribute);
    return !values.length || values.some((v) => v.text.trim());
  });
}

/**
 * Whether the element's parent is a component that gives its child an accessible name, as MUI's
 * `<Tooltip title="Delete">` does with a string title (not a JSX one, and not with
 * `describeChild`, which makes it a description).
 */
function labelledByParent(context: RuleContext, element: JsxNode): boolean {
  let node: ts.Node = element.node.parent;
  while (
    ts.isParenthesizedExpression(node) ||
    ts.isJsxExpression(node) ||
    (ts.isConditionalExpression(node) && node.condition !== element.node) ||
    (ts.isBinaryExpression(node) &&
      [
        ts.SyntaxKind.AmpersandAmpersandToken,
        ts.SyntaxKind.BarBarToken,
        ts.SyntaxKind.QuestionQuestionToken,
      ].includes(node.operatorToken.kind))
  ) {
    node = node.parent;
  }
  if (!ts.isJsxElement(node)) return false;
  const parent = context.analysis.elements.find((e) => e.node === node);
  if (!parent) return false;
  const resolution = context.resolve(parent);
  const labels = resolution.kind === 'component' ? resolution.component.labelsChild : undefined;
  if (!labels) return false;
  const unless = labels.unless ? findAttribute(parent, labels.unless) : undefined;
  if (unless) {
    const init = unless.initializer;
    const value = init && ts.isJsxExpression(init) ? init.expression : init;
    if (value?.kind !== ts.SyntaxKind.FalseKeyword) return false;
  }
  const label = findAttribute(parent, labels.prop);
  if (!label?.initializer) return false;
  if (ts.isStringLiteral(label.initializer)) return label.initializer.text.trim() !== '';
  const value = ts.isJsxExpression(label.initializer) ? label.initializer.expression : undefined;
  if (!value) return false;
  const literals = literalValues(label);
  if (literals.length) return literals.some((l) => l.text.trim() !== '');
  // A JSX title renders as content, without becoming the child's label.
  return !ts.isJsxElement(value) && !ts.isJsxSelfClosingElement(value) && !ts.isJsxFragment(value);
}

/**
 * What an `id` or `htmlFor` holds, to compare the two: a string as itself (`"dark-mode"`, `{"x"}`),
 * an expression as written (`{id}`, `` {`${id}-switch`} ``) together with the function it is in,
 * since two components in one file can each have their own `id`. Undefined when it holds nothing.
 */
function idValue(context: RuleContext, attribute: ts.JsxAttribute | undefined): string | undefined {
  const init = attribute?.initializer;
  if (!init) return undefined;
  const value = ts.isJsxExpression(init) ? init.expression : init;
  if (!value) return undefined;
  if (ts.isStringLiteralLike(value)) return value.text.trim() ? `"${value.text}"` : undefined;
  const scope = ts.findAncestor(value, ts.isFunctionLike);
  return `${String(scope?.pos ?? -1)}:${value.getText(context.sourceFile)}`;
}

/**
 * Whether a label with content names the button through its `id`: `<label htmlFor={id}>Dark
 * mode</label>` next to `<button id={id} role="switch">`, or the design system's `<Label>`. A
 * button is a labelable element, so the label's text is its accessible name.
 */
function labelledByFor(context: RuleContext, element: JsxNode): boolean {
  const id = idValue(context, findAttribute(element, 'id'));
  if (id === undefined) return false;
  return context.analysis.elements.some((label) => {
    if (label === element) return false;
    const target = findAttribute(label, 'htmlFor') ?? findAttribute(label, 'for');
    if (idValue(context, target) !== id) return false;
    const content = classify(label.children, context, []);
    return content === 'text' || content === 'unknown';
  });
}

/**
 * The element whose `render` prop this one is, as in Base UI's
 * `<Dialog.Close render={<Button size="icon" />}><XIcon /></Dialog.Close>`:
 * the rendered button takes the host's children and attributes. Also through
 * a condition (`render={disabled ? undefined : <button />}`). `object` when it
 * is the `render` of an object, such as a story's `args`, whose host the rule
 * cannot see.
 */
function renderHost(context: RuleContext, element: JsxNode): JsxNode | 'object' | undefined {
  let node: ts.Node = element.node;
  for (;;) {
    const parent = node.parent;
    if (ts.isParenthesizedExpression(parent)) node = parent;
    else if (ts.isConditionalExpression(parent) && node !== parent.condition) node = parent;
    else if (
      ts.isBinaryExpression(parent) &&
      [
        ts.SyntaxKind.AmpersandAmpersandToken,
        ts.SyntaxKind.BarBarToken,
        ts.SyntaxKind.QuestionQuestionToken,
      ].includes(parent.operatorToken.kind)
    ) {
      node = parent;
    } else break;
  }
  const parent = node.parent;
  if (
    ts.isPropertyAssignment(parent) &&
    parent.initializer === node &&
    propertyName(parent.name) === 'render'
  ) {
    return 'object';
  }
  const attribute = ts.isJsxExpression(parent) ? parent.parent : undefined;
  if (!attribute || !ts.isJsxAttribute(attribute) || attributeName(attribute) !== 'render') {
    return undefined;
  }
  const opening = attribute.parent.parent;
  const host = ts.isJsxOpeningElement(opening) ? opening.parent : opening;
  return context.analysis.elements.find((e) => e.node === host);
}

/** `hidden`, `aria-hidden`, `aria-hidden="true"` or `{true}`: not an element anyone reads or clicks. */
function hiddenBy(attributes: ts.JsxAttributes): boolean {
  return attributes.properties.some((attribute) => {
    if (!ts.isJsxAttribute(attribute)) return false;
    const name = attributeName(attribute);
    if (name !== 'hidden' && name !== 'aria-hidden') return false;
    const init = attribute.initializer;
    if (!init) return true;
    const value = ts.isJsxExpression(init) ? init.expression : init;
    if (value?.kind === ts.SyntaxKind.TrueKeyword) return true;
    return (
      value !== undefined &&
      ts.isStringLiteralLike(value) &&
      (name === 'hidden' || value.text === 'true')
    );
  });
}

/** The element or one around it is hidden. */
function isHidden(element: JsxNode): boolean {
  const hidden = ts.findAncestor(element.node, (node) => {
    const opening = ts.isJsxElement(node)
      ? node.openingElement
      : ts.isJsxSelfClosingElement(node)
        ? node
        : undefined;
    return opening !== undefined && hiddenBy(opening.attributes);
  });
  return hidden !== undefined;
}

/**
 * A link a design system renders through `asChild`: `<a>`, a component that renders one, or a
 * router's `Link` (`next/link`, `NavLink`) with its `href` or `to`, not an icon named `ExternalLink`.
 */
function isLink(context: RuleContext, element: JsxNode): boolean {
  const resolution = context.resolve(element);
  if (resolution.kind === 'intrinsic') return resolution.tag === 'a';
  if (resolution.kind === 'component' && resolution.component.element === 'a') return true;
  return (
    /Link$/.test(element.tag) &&
    Boolean(findAttribute(element, 'href') ?? findAttribute(element, 'to'))
  );
}

/**
 * `<Button asChild size="icon"><Link href="/users/1/edit"><Pencil /></Link></Button>`: Radix's
 * Slot renders the link with the button's props, so the link is the button, and an icon alone
 * in it names nothing. A label on either counts (`aria-label`, `title`, visually hidden text in
 * the link). A child that is a button itself is checked on its own; any other child (a `<span>`
 * under a tooltip's trigger) is not a control.
 */
function checkAsChildLink(context: RuleContext, button: JsxNode): void {
  const children = button.children.filter((c) => !ts.isJsxText(c) || c.text.trim());
  const [child] = children;
  if (children.length !== 1 || !child) return;
  const link = context.analysis.elements.find((e) => e.node === child);
  if (!link || link.hasSpread || !isLink(context, link)) return;
  if (hasLabel(button.attributes) || hasLabel(link.attributes)) return;
  if (labelledByParent(context, button)) return;
  const icons: string[] = [];
  const content = classify(link.children, context, icons);
  const sizeIcon = attributeLiterals(button, 'size').some((v) => v.text.includes('icon'));
  if (content !== 'icon' && !(content === 'empty' && sizeIcon)) return;
  const { label, fixed } = iconLabel(context, link, button, icons[0]);
  const attribute = `aria-label="${label ?? '…'}"`;
  context.report({
    ...tagRange(context, link),
    message:
      content === 'icon'
        ? `Icon-only <${link.tag}> in <${button.tag} asChild> has no accessible name. Add ${attribute} describing the action, or visually hidden text.`
        : `<${link.tag}> in <${button.tag} asChild> has no content and no accessible name. Add ${attribute}.`,
    suggestion: attribute,
    fix: fixed
      ? [{ range: [link.tagName.end, link.tagName.end], text: ` ${attribute}` }]
      : undefined,
  });
}

export const iconButtonAccessibleName: Rule = {
  id: 'icon-button-accessible-name',
  description:
    'Buttons whose only content is an icon need an aria-label (or visually hidden text).',
  run(context) {
    for (const element of context.analysis.elements) {
      const resolution = context.resolve(element);
      if (!isButton(context, element) || element.hasSpread || isHidden(element)) continue;
      if (findAttribute(element, 'asChild')) {
        checkAsChildLink(context, element);
        continue;
      }
      // A button passed as `render` is judged by its host's children and label, and its own;
      // a host that is a button itself is checked on its own. A story's `args.render` is
      // rendered with args the rule does not follow.
      const host = renderHost(context, element);
      if (host === 'object') continue;
      if (host && (isButton(context, host) || host.hasSpread)) continue;
      if (hasLabel(element.attributes) || (host && hasLabel(host.attributes))) continue;
      if (labelledByParent(context, element)) continue;
      if (labelledByFor(context, element) || (host && labelledByFor(context, host))) continue;
      const icons: string[] = [];
      const children = host ? [...host.children, ...element.children] : element.children;
      // A host with no children shows what its props say (`<Chip label=… render={<button />}>`).
      const content: Content =
        host && !children.length ? 'unknown' : classify(children, context, icons);
      const sizeIcon = attributeLiterals(element, 'size').some((v) => v.text.includes('icon'));
      if (
        content === 'text' ||
        content === 'unknown' ||
        (content === 'empty' && !sizeIcon && resolution.kind !== 'intrinsic')
      )
        continue;

      const { label, fixed } = iconLabel(context, element, host, icons[0]);
      const attribute = `aria-label="${label ?? '…'}"`;
      context.report({
        ...tagRange(context, element),
        message:
          content === 'icon'
            ? `Icon-only <${element.tag}> has no accessible name. Add ${attribute} describing the action, or visually hidden text.`
            : `<${element.tag}> has no content and no accessible name. Add ${attribute}.`,
        suggestion: attribute,
        fix: fixed
          ? [{ range: [element.tagName.end, element.tagName.end], text: ` ${attribute}` }]
          : undefined,
      });
    }
  },
};
