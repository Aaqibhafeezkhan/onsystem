import type { Diagnostic, TextEdit } from 'onsystem';

/**
 * What the playground does with check_ui's findings: applies the fixes, and turns the findings
 * that need a decision into suggestions the visitor can apply in one click. check_ui only fixes
 * what is mechanical; a suggestion is a judgment call, so each one says what it will change.
 * Everything here works on the code as text, in the browser.
 */

/** The drafts' line width (the demo's Prettier config): an edit breaks the lines it pushes past it. */
export const PRINT_WIDTH = 80;

// ─── Positions ──────────────────────────────────────────────────────────────

export function lineStartsOf(code: string): number[] {
  const starts = [0];
  for (let i = 0; i < code.length; i++) if (code[i] === '\n') starts.push(i + 1);
  return starts;
}

/** 1-based line and column → offset. */
export function offsetOf(lineStarts: number[], line: number, column: number): number {
  return (lineStarts[line - 1] ?? 0) + column - 1;
}

function rangeOf(code: string, d: Diagnostic): [number, number] {
  const starts = lineStartsOf(code);
  return [offsetOf(starts, d.line, d.column), offsetOf(starts, d.endLine, d.endColumn)];
}

// ─── Applying edits ─────────────────────────────────────────────────────────

/**
 * Applies `edits` from the end backwards, skipping any that overlap one already applied (as the
 * CLI does), then breaks the lines they pushed past the print width.
 */
export function applyEdits(
  code: string,
  edits: readonly TextEdit[],
): { code: string; applied: Set<TextEdit> } {
  const sorted = [...edits].sort((a, b) => b.range[0] - a.range[0]);
  const applied = new Set<TextEdit>();
  let out = code;
  let floor = Infinity;
  for (const edit of sorted) {
    if (edit.range[1] > floor) continue;
    out = out.slice(0, edit.range[0]) + edit.text + out.slice(edit.range[1]);
    floor = edit.range[0];
    applied.add(edit);
  }
  return { code: reflow(code, out), applied };
}

/** Applies the fixes of `diagnostics`; `count` is the findings whose every edit went in. */
export function applyFixes(
  code: string,
  diagnostics: readonly Diagnostic[],
): { code: string; count: number } {
  const fixable = diagnostics.filter((d) => d.fix?.length);
  const result = applyEdits(
    code,
    fixable.flatMap((d) => d.fix ?? []),
  );
  return {
    code: result.code,
    count: fixable.filter((d) => d.fix?.every((edit) => result.applied.has(edit))).length,
  };
}

/**
 * Breaks the lines an edit made longer than `width` the way Prettier breaks JSX: a text child
 * onto its own line, then, if the opening tag is still too long, one attribute per line. Lines
 * the code already had, and lines that are not one element, stay as they are.
 */
export function reflow(before: string, after: string, width = PRINT_WIDTH): string {
  const kept = new Set(before.split('\n'));
  return after
    .split('\n')
    .map((line) => (line.length > width && !kept.has(line) ? breakElement(line, width) : line))
    .join('\n');
}

function breakElement(line: string, width: number): string {
  const indent = /^[ \t]*/.exec(line)?.[0] ?? '';
  const tag = openingTagAt(line, indent.length);
  if (!tag) return line;
  const rest = line.slice(tag.end);
  if (!rest.trim()) return breakAttributes(line, tag, indent, width);
  const close = `</${tag.name}>`;
  const tail = rest.trimEnd();
  const text = tail.slice(0, -close.length).trim();
  if (tag.selfClosing || !tail.endsWith(close) || !text || /[<>{}]/.test(text)) {
    return line;
  }
  const open = breakAttributes(line.slice(0, tag.end), tag, indent, width);
  return [open, `${indent}  ${text}`, indent + close].join('\n');
}

function breakAttributes(line: string, tag: OpeningTag, indent: string, width: number): string {
  if (line.trimEnd().length <= width || !tag.attributes.length) return line;
  return [
    `${indent}<${tag.name}`,
    ...tag.attributes.map((a) => `${indent}  ${line.slice(a.start, a.end)}`),
    indent + (tag.selfClosing ? '/>' : '>'),
  ].join('\n');
}

// ─── Reading JSX tags ───────────────────────────────────────────────────────

export interface Attribute {
  /** Empty for a spread (`{...props}`). */
  name: string;
  /** From the name to the end of the value. */
  start: number;
  end: number;
  value?: { start: number; end: number; kind: 'string' | 'expression' };
}

export interface OpeningTag {
  name: string;
  /** The `<`. */
  start: number;
  nameEnd: number;
  /** Just past the `>` or `/>`. */
  end: number;
  selfClosing: boolean;
  attributes: Attribute[];
}

const SPACE = /\s/;

/** Index just past the `}` matching the `{` at `start`, skipping strings and comments; -1 if none. */
function skipBraces(code: string, start: number): number {
  let depth = 0;
  for (let i = start; i < code.length; i++) {
    const ch = code.charAt(i);
    if (ch === '"' || ch === "'" || ch === '`') {
      i = skipString(code, i);
      if (i < 0) return -1;
    } else if (code.startsWith('//', i)) {
      i = code.indexOf('\n', i);
      if (i < 0) return -1;
    } else if (code.startsWith('/*', i)) {
      i = code.indexOf('*/', i + 2) + 1;
      if (i === 0) return -1;
    } else if (ch === '{') {
      depth++;
    } else if (ch === '}' && --depth === 0) {
      return i + 1;
    }
  }
  return -1;
}

/** Index of the quote that closes the string opening at `start`; -1 if none. */
function skipString(code: string, start: number): number {
  const quote = code.charAt(start);
  for (let i = start + 1; i < code.length; i++) {
    const ch = code.charAt(i);
    if (ch === '\\') i++;
    else if (ch === quote) return i;
    else if (quote === '`' && code.startsWith('${', i)) {
      i = skipBraces(code, i + 1) - 1;
      if (i < 0) return -1;
    }
  }
  return -1;
}

/** Reads the opening tag whose `<` is at `start`; undefined when there is none. */
export function openingTagAt(code: string, start: number): OpeningTag | undefined {
  const name = /<([A-Za-z][\w.:-]*)/y;
  name.lastIndex = start;
  const match = name.exec(code);
  if (!match?.[1]) return undefined;
  const tag = { name: match[1], start, nameEnd: name.lastIndex };
  const attributes: Attribute[] = [];
  let i = name.lastIndex;
  for (;;) {
    while (SPACE.test(code.charAt(i))) i++;
    if (code.charAt(i) === '>') return { ...tag, end: i + 1, selfClosing: false, attributes };
    if (code.startsWith('/>', i)) return { ...tag, end: i + 2, selfClosing: true, attributes };
    if (code.charAt(i) === '{') {
      // A spread: {...props}.
      const end = skipBraces(code, i);
      if (end < 0) return undefined;
      attributes.push({ name: '', start: i, end });
      i = end;
      continue;
    }
    const attribute = /[A-Za-z_$][\w$:-]*/y;
    attribute.lastIndex = i;
    const attributeName = attribute.exec(code)?.[0];
    if (!attributeName) return undefined;
    const attributeStart = i;
    i = attribute.lastIndex;
    let j = i;
    while (SPACE.test(code.charAt(j))) j++;
    if (code.charAt(j) !== '=') {
      attributes.push({ name: attributeName, start: attributeStart, end: i });
      continue;
    }
    j++;
    while (SPACE.test(code.charAt(j))) j++;
    const quote = code.charAt(j);
    let end: number;
    let kind: 'string' | 'expression';
    if (quote === '"' || quote === "'") {
      end = code.indexOf(quote, j + 1) + 1;
      kind = 'string';
    } else if (quote === '{') {
      end = skipBraces(code, j);
      kind = 'expression';
    } else {
      return undefined;
    }
    if (end <= 0) return undefined;
    attributes.push({
      name: attributeName,
      start: attributeStart,
      end,
      value: { start: j, end, kind },
    });
    i = end;
  }
}

/** The opening tag whose attributes contain `offset`. */
export function tagAround(code: string, offset: number): OpeningTag | undefined {
  for (let i = code.lastIndexOf('<', offset); i >= 0; i = code.lastIndexOf('<', i - 1)) {
    const tag = openingTagAt(code, i);
    if (tag && tag.nameEnd <= offset && offset < tag.end) return tag;
    if (i === 0) break;
  }
  return undefined;
}

/** Removes an attribute with the space before it, or its whole line when it has one to itself. */
function removeAttribute(code: string, attribute: Attribute): TextEdit {
  const lineStart = code.lastIndexOf('\n', attribute.start - 1) + 1;
  const lineEnd = code.indexOf('\n', attribute.end);
  if (
    !code.slice(lineStart, attribute.start).trim() &&
    lineEnd >= 0 &&
    !code.slice(attribute.end, lineEnd).trim()
  ) {
    return { range: [lineStart, lineEnd + 1], text: '' };
  }
  const space = /\s*$/.exec(code.slice(0, attribute.start))?.[0].length ?? 0;
  return { range: [attribute.start - space, attribute.end], text: '' };
}

/**
 * Adds `cls` to the tag's className string, or gives the attribute to write when it has none.
 * Undefined when className is an expression (`cn(...)`), which a suggestion leaves to the visitor.
 */
function addClass(
  tag: OpeningTag,
  cls: string,
): { edit: TextEdit } | { attribute: string } | undefined {
  const className = tag.attributes.find((a) => a.name === 'className' || a.name === 'class');
  if (!className) return { attribute: `className="${cls}"` };
  if (className.value?.kind !== 'string') return undefined;
  const at = className.value.end - 1;
  const empty = className.value.end - className.value.start === 2;
  return { edit: { range: [at, at], text: empty ? cls : ` ${cls}` } };
}

// ─── Suggestions ────────────────────────────────────────────────────────────

export interface Suggestion {
  /** What the button does, with code in backticks. */
  label: string;
  /** For a choice, the value it picks (`secondary`). */
  value?: string;
  edits: TextEdit[];
}

export interface Decision {
  /** Said before the options. */
  prompt: string;
  /** Values to pick from (`default`, `secondary`, …) rather than one change. */
  choice: boolean;
  options: Suggestion[];
}

/**
 * A finding with no automatic fix, as suggestions the visitor can apply: a value to pick for a
 * renamed prop or an unknown variant, an inline style moved to className, an override removed
 * where the component's variant already sets it. Built from what check_ui returns (the
 * suggestion, the message and the position); undefined when the code is not in a shape a
 * suggestion can edit safely.
 */
export function decisionFor(code: string, d: Diagnostic): Decision | undefined {
  if (d.fix?.length) return undefined;
  const [start, end] = rangeOf(code, d);
  if (code.slice(start, end) !== d.source) return undefined;
  switch (d.ruleId) {
    case 'no-unknown-prop':
      return renameProp(code, d, start);
    case 'no-unknown-variant':
      return pickValue(d, start, end);
    case 'no-hardcoded-spacing':
    case 'no-hardcoded-radius':
      return d.message.includes(' in style. ')
        ? moveStyleToClass(code, d, start, end)
        : replaceClass(d, start, end);
    case 'no-hardcoded-color':
      return d.suggestion?.startsWith('className="')
        ? moveAttributeToClass(code, d, start, end)
        : removeOverride(code, d, start, end);
    default:
      return undefined;
  }
}

const one = (label: string, edits: TextEdit[]): Decision => ({
  prompt: 'Needs a decision:',
  choice: false,
  options: [{ label, edits }],
});

const choose = (prop: string, values: string[], edit: (value: string) => TextEdit): Decision => ({
  prompt: `Needs a decision: set ${prop} to`,
  choice: true,
  options: values.map((value) => ({ label: `${prop}="${value}"`, value, edits: [edit(value)] })),
});

/** `Did you mean "variant" ("default" | "secondary")?`: the prop's values, when the old value is not one. */
const DID_YOU_MEAN = /Did you mean "([^"]+)" \(("[^"]*"(?: \| "[^"]*")*)\)\?/;

/** `<Badge tone="warning">`: renaming to `variant` alone would leave a value it does not take. */
function renameProp(code: string, d: Diagnostic, start: number): Decision | undefined {
  const match = DID_YOU_MEAN.exec(d.message);
  const prop = d.suggestion;
  if (!match?.[2] || match[1] !== prop || !prop) return undefined;
  const tag = tagAround(code, start);
  const attribute = tag?.attributes.find((a) => a.start === start);
  // A value that is an expression is left to the visitor, and so is a prop the tag already has.
  if (!attribute || attribute.value?.kind !== 'string') return undefined;
  if (tag?.attributes.some((a) => a.name === prop)) return undefined;
  const values = [...match[2].matchAll(/"([^"]*)"/g)].map((m) => m[1] ?? '');
  return choose(prop, values, (value) => ({
    range: [attribute.start, attribute.end],
    text: `${prop}="${value}"`,
  }));
}

/** `"warning" is not a valid variant for <Badge>. Allowed: default, secondary.` with no close value. */
const NOT_ALLOWED = /^"[^"]*" is not a valid (\S+) for <[^>]+>\. Allowed: (.+)\.$/;

function pickValue(d: Diagnostic, start: number, end: number): Decision | undefined {
  const match = NOT_ALLOWED.exec(d.message);
  const quote = d.source.charAt(0);
  if (!match?.[1] || !match[2] || (quote !== '"' && quote !== "'")) return undefined;
  return choose(match[1], match[2].split(', '), (value) => ({
    range: [start, end],
    text: `${quote}${value}${quote}`,
  }));
}

/** `p-[61px]`, too far from the nearest step to replace without changing the design. */
function replaceClass(d: Diagnostic, start: number, end: number): Decision | undefined {
  if (!d.suggestion || /[\s"'`{}]/.test(d.suggestion)) return undefined;
  return one(`Use \`${d.suggestion}\``, [{ range: [start, end], text: d.suggestion }]);
}

/** `style={{ color: "…", marginTop: 6 }}` → `className="mt-1.5" style={{ color: "…" }}`. */
function moveStyleToClass(
  code: string,
  d: Diagnostic,
  start: number,
  end: number,
): Decision | undefined {
  const cls = d.suggestion;
  if (!cls || !d.message.includes('in className instead of an inline style')) return undefined;
  const tag = tagAround(code, start);
  const style = tag?.attributes.find(
    (a) =>
      a.name === 'style' &&
      a.value?.kind === 'expression' &&
      a.value.start < start &&
      end < a.value.end,
  );
  if (!tag || !style?.value) return undefined;
  const object = { start: style.value.start, end: style.value.end };
  if (!/^\{\s*\{[\s\S]*\}\s*\}$/.test(code.slice(object.start, object.end))) return undefined;
  // The property: its key just before the value, and nothing after the value but `,` or `}`.
  const key = /(?:[A-Za-z_$][\w$]*|"[^"\n]*"|'[^'\n]*')\s*:\s*$/.exec(
    code.slice(object.start, start),
  );
  if (!key || !/^\s*[,}]/.test(code.slice(end))) return undefined;
  const propStart = start - key[0].length;
  const property = code.slice(propStart, end);

  let removal: [number, number];
  const lineStart = code.lastIndexOf('\n', propStart - 1) + 1;
  const ownLine = /^[ \t]*,?[ \t]*\n/.exec(code.slice(end));
  const following = /^\s*,[ \t]*/.exec(code.slice(end));
  const preceding = /,\s*$/.exec(code.slice(object.start, propStart));
  if (ownLine && !code.slice(lineStart, propStart).trim()) {
    removal = [lineStart, end + ownLine[0].length];
  } else if (following) {
    removal = [propStart, end + following[0].length];
  } else if (preceding) {
    removal = [propStart - preceding[0].length, end];
  } else {
    removal = [propStart, end];
  }
  const left = code.slice(object.start, removal[0]) + code.slice(removal[1], object.end);
  const emptied = /^\{\s*\{\s*\}\s*\}$/.test(left);

  const add = addClass(tag, cls);
  if (!add) return undefined;
  let edits: TextEdit[];
  if ('edit' in add) {
    edits = [add.edit, emptied ? removeAttribute(code, style) : { range: removal, text: '' }];
  } else if (emptied) {
    edits = [{ range: [style.start, style.end], text: add.attribute }];
  } else {
    // Before the style, on its own line when the style has one.
    const indent = /\n([ \t]*)$/.exec(code.slice(0, style.start))?.[1];
    const text = indent === undefined ? `${add.attribute} ` : `${add.attribute}\n${indent}`;
    edits = [
      { range: [style.start, style.start], text },
      { range: removal, text: '' },
    ];
  }
  return one(`Move \`${property}\` to className \`${cls}\``, edits);
}

/** `<Trash2 color="#ef4444" />` → `<Trash2 className="text-destructive" />`. */
function moveAttributeToClass(
  code: string,
  d: Diagnostic,
  start: number,
  end: number,
): Decision | undefined {
  const cls = /^className="([^"\s]+)"$/.exec(d.suggestion ?? '')?.[1];
  const tag = tagAround(code, start);
  const attribute = tag?.attributes.find(
    (a) => a.value?.kind === 'string' && a.value.start < start && end < a.value.end,
  );
  if (!cls || !tag || !attribute?.value) return undefined;
  if (code.slice(attribute.value.start + 1, attribute.value.end - 1).trim() !== d.source) {
    return undefined;
  }
  const add = addClass(tag, cls);
  if (!add) return undefined;
  const edits =
    'edit' in add
      ? [add.edit, removeAttribute(code, attribute)]
      : [{ range: [attribute.start, attribute.end] as [number, number], text: add.attribute }];
  return one(
    `Move \`${code.slice(attribute.start, attribute.end)}\` to className \`${cls}\``,
    edits,
  );
}

/** `<Button> already sets bg-* through `variant``: the class overrides what the variant sets. */
const OVERRIDE = /<[^>]+> already sets ([\w-]+)-\* through `([^`]+)`/;

const SETS: Record<string, string> = {
  bg: 'the background',
  text: 'the text color',
  border: 'the border color',
};

/** `<Button className="bg-blue-600">` where no token has the hue and the variant sets bg-*. */
function removeOverride(
  code: string,
  d: Diagnostic,
  start: number,
  end: number,
): Decision | undefined {
  const match = OVERRIDE.exec(d.message);
  if (d.suggestion || !match?.[1] || !match[2]) return undefined;
  // A class (`bg-blue-600`, `hover:bg-blue-600`), not a color in a style or an attribute.
  if (!new RegExp(`^(?:[\\w-]+:)*-?${match[1]}-`).test(d.source)) return undefined;
  const before = code.charAt(start - 1);
  const after = code.charAt(end);
  if (!/[\s"'`]/.test(before) || !/[\s"'`]/.test(after)) return undefined;
  let edit: TextEdit;
  const spaceAfter = /^[ \t]+/.exec(code.slice(end))?.[0];
  const spaceBefore = /[ \t]+$/.exec(code.slice(0, start))?.[0];
  if (spaceAfter && /\S/.test(code.charAt(end + spaceAfter.length))) {
    edit = { range: [start, end + spaceAfter.length], text: '' };
  } else if (spaceBefore) {
    edit = { range: [start - spaceBefore.length, end], text: '' };
  } else {
    // The only class: drop the attribute when it is a plain className string.
    const tag = tagAround(code, start);
    const className = tag?.attributes.find(
      (a) =>
        (a.name === 'className' || a.name === 'class') &&
        a.value?.kind === 'string' &&
        a.value.start === start - 1 &&
        a.value.end === end + 1,
    );
    edit = className ? removeAttribute(code, className) : { range: [start, end], text: '' };
  }
  const sets = SETS[match[1]] ?? `${match[1]}-*`;
  return one(`Remove \`${d.source}\` (\`${match[2]}\` sets ${sets})`, [edit]);
}

// ─── What the findings say ──────────────────────────────────────────────────

function count(n: number, one: string, many: string): string {
  return `${String(n)} ${n === 1 ? one : many}`;
}

/** The Apply all button: what it applies, and nothing more. */
export function applyLabel(fixes: number): string {
  return `Apply ${count(fixes, 'fix', 'fixes')}`;
}

/** Findings left without an automatic fix (a syntax error is not a decision). */
export function undecided(diagnostics: readonly Diagnostic[]): number {
  return diagnostics.filter((d) => !d.fix?.length && d.ruleId !== 'syntax').length;
}

export function decisionNote(n: number): string {
  return `${count(n, 'needs', 'need')} a decision`;
}

/**
 * After applying: what went in, then what is left once the code is checked again
 * ("Applied 9 fixes. 2 need a decision.").
 */
export function summaryText(
  applied: { fixes: number; suggestions: number },
  remaining?: readonly Diagnostic[],
): string {
  const parts = [
    applied.fixes ? count(applied.fixes, 'fix', 'fixes') : '',
    applied.suggestions ? count(applied.suggestions, 'suggestion', 'suggestions') : '',
  ].filter(Boolean);
  let text = `Applied ${parts.join(' and ') || 'nothing'}.`;
  if (!remaining) return text;
  if (!remaining.length) return `${text} No findings left.`;
  const fixable = remaining.filter((d) => d.fix?.length).length;
  const open = undecided(remaining);
  const left = [
    fixable ? count(fixable, 'more has a fix', 'more have fixes') : '',
    open ? decisionNote(open) : '',
  ].filter(Boolean);
  if (left.length) text += ` ${left.join(', ')}.`;
  return text;
}
