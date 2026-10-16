import fs from 'node:fs';
import path from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import type { DesignSystem } from '../src/design-system.js';
import { DEMO_ROOT, loadOnce } from './helpers.js';
import { section } from './markdown.js';

// Class strings are read where they are written: in className or class, and in the arguments of
// cn(), clsx(), cva() and the like, wherever those are called, and followed to where the same file
// keeps them: a const, a const object map, or what a function of the file returns. Agents write
// status maps like these in the benchmark's release-badges task. What is still not followed, the
// docs say where people look for limits, and this file keeps that true: when a case below starts
// being reported, the limit comes out of the docs.

const root = path.resolve(import.meta.dirname, '..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

const rule = 'no-hardcoded-color';
let ds: DesignSystem;
beforeAll(async () => {
  ds = await loadOnce(DEMO_ROOT);
});

/** The palette classes `no-hardcoded-color` reports in a component file. */
const reported = (code: string) =>
  ds
    .check(code, 'components/status-badge.tsx')
    .diagnostics.filter((d) => d.ruleId === rule)
    .map((d) => d.source);

const PROPS = '{ status }: { status: "New" | "Lost" }';
const BADGE = '<span className={statusStyles[status]}>{status}</span>';

/** Where the classes are kept, as agents write it (the finding's probes): followed now. */
const followed = {
  'an object map': `const statusStyles = { New: "bg-green-50 text-green-700", Lost: "bg-red-50 text-red-700" }
export function StatusBadge(${PROPS}) {
  return ${BADGE}
}`,
  'a variable': `export function StatusBadge(${PROPS}) {
  const tone = status === "New" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
  return <span className={tone}>{status}</span>
}`,
  'a variable passed to cn()': `export function StatusBadge({ active }: { active: boolean }) {
  const extra = active ? "ring-2 ring-indigo-500" : ""
  return <div className={cn("p-4", extra)} />
}`,
  "a helper's return value": `function toneOf(status: string) {
  return status === "New" ? "text-green-600" : "text-red-600"
}
export function StatusBadge(${PROPS}) {
  return <span className={toneOf(status)}>{status}</span>
}`,
  'a palette CSS variable': `export function StatusBadge() {
  return <span className="bg-[var(--color-green-50)]">New</span>
}`,
};

/** Where they are still not followed. */
const unfollowed = {
  'another file': `import { statusStyles } from "@/lib/status"
export function StatusBadge(${PROPS}) {
  return ${BADGE}
}`,
  'a prop': `export function StatusBadge({ tone }: { tone: string }) {
  return <span className={tone}>New</span>
}`,
  'a let': `export function StatusBadge(${PROPS}) {
  let tone = "bg-green-50"
  if (status === "Lost") tone = "bg-red-50"
  return <span className={tone}>{status}</span>
}`,
  'another prop (tw)': `export function StatusBadge() {
  return <div tw="shrink-0 text-green-600" />
}`,
};

describe('class strings outside className and class functions', () => {
  it('reports palette classes in className, and in cn() or cva() wherever they are called', () => {
    expect(
      reported(`export function StatusBadge() {
  return <span className="bg-green-50 text-green-700">New</span>
}`),
    ).toEqual(['bg-green-50', 'text-green-700']);
    // A map of cn() values, or a cva variant.
    expect(
      reported(`const statusStyles = { New: cn("bg-green-50 text-green-700"), Lost: cn("bg-red-50") }
export function StatusBadge(${PROPS}) {
  return ${BADGE}
}`),
    ).toEqual(['bg-green-50', 'text-green-700', 'bg-red-50']);
    expect(
      reported(`const badge = cva("rounded-md", { variants: { status: { New: "bg-green-50", Lost: "bg-red-50" } } })
export function StatusBadge(${PROPS}) {
  return <span className={badge({ status })}>{status}</span>
}`),
    ).toEqual(['bg-green-50', 'bg-red-50']);
  });

  it.each(Object.entries(followed))('reports palette classes kept in %s', (where, code) => {
    expect(reported(code).length, where).toBeGreaterThan(0);
  });

  it.each(Object.entries(unfollowed))(
    'does not report palette classes kept in %s yet',
    (where, code) => {
      // Reported now? Take this case out of "Known limits" in docs/rules.md and out of the
      // Limits in docs/how-it-works.md, then out of this list.
      expect(reported(code), where).toEqual([]);
    },
  );

  it('says what is followed and what is not in docs/rules.md, and in the limits on how-it-works', () => {
    const limits = section(read('docs/rules.md'), 'Known limits').replace(/\s+/g, ' ');
    expect(limits).toContain(
      'From there they are followed to where the same file keeps them: a `const` (`className={tone}`, `cn("p-4", extra)`), a key of a `const` object map (`className={statusStyles[status]}` with `const statusStyles = { New: "bg-green-50 text-green-700" }`), or what a function of the file returns (`className={toneOf(status)}`)',
    );
    expect(followed['an object map']).toContain('className={statusStyles[status]}');
    expect(followed['a variable passed to cn()']).toContain('cn("p-4", extra)');
    expect(followed["a helper's return value"]).toContain('className={toneOf(status)}');
    // What is not, checked above, and the ways round it.
    expect(limits).toContain(
      'A value from another file, a parameter or prop, or a `let` is not followed, so a palette color there is not reported',
    );
    expect(limits).toContain('`tw`');
    expect(limits).toContain('make them a `cva` variant');
    // What reports such a lookup: the bench's @shadcn/lint scorer.
    expect(limits).toContain('`require-static-classes`');
    expect(limits).not.toContain('not followed yet');
    expect(limits).not.toContain('`bg-[var(--color-green-50)]`');

    const howItWorks = section(read('docs/how-it-works.md'), 'Limits').replace(/\s+/g, ' ');
    expect(howItWorks).toContain(
      'followed to a `const`, a `const` object map (`className={statusStyles[status]}`) or a function of the same file; one from another file, a parameter or a `let` is not followed',
    );
    expect(howItWorks).toContain('`tw`');
    expect(howItWorks).not.toContain('`bg-[var(--color-green-50)]`');
  });
});
