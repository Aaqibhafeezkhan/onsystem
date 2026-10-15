import fs from 'node:fs';
import path from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import type { DesignSystem } from '../src/design-system.js';
import { DEMO_ROOT, loadOnce } from './helpers.js';
import { section } from './markdown.js';

// Class strings are read where they are written: in className or class, and in the arguments of
// cn(), clsx(), cva() and the like, wherever those are called. One kept in a variable, an object
// map or a helper's return value is not followed back yet, so a palette color there passes as
// clean. Agents write status maps like these in the benchmark's release-badges task. Until the
// linter follows them, the docs say so where people look for limits, and this file keeps that
// true: when a case below starts being reported, the limit comes out of the docs.

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

/** Where the classes are kept, as agents write it (the finding's probes). */
const unfollowed = {
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
  'another prop (tw)': `export function StatusBadge() {
  return <div tw="shrink-0 text-green-600" />
}`,
  'a palette CSS variable': `export function StatusBadge() {
  return <span className="bg-[var(--color-green-50)]">New</span>
}`,
};

describe('class strings outside className and class functions (a known limit)', () => {
  it('reports palette classes in className, and in cn() or cva() wherever they are called', () => {
    expect(
      reported(`export function StatusBadge() {
  return <span className="bg-green-50 text-green-700">New</span>
}`),
    ).toEqual(['bg-green-50', 'text-green-700']);
    // The ways round it that the docs give: a map of cn() values, or a cva variant.
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

  it.each(Object.entries(unfollowed))(
    'does not report palette classes kept in %s yet',
    (where, code) => {
      // Reported now? Take this case out of "Known limits" in docs/rules.md and out of the
      // Limits in docs/how-it-works.md, then out of this list.
      expect(reported(code), where).toEqual([]);
    },
  );

  it('says so in docs/rules.md, with the ways round it, and in the limits on how-it-works', () => {
    const limits = section(read('docs/rules.md'), 'Known limits').replace(/\s+/g, ' ');
    expect(limits).toContain(
      'A string kept in a variable, an object map or a helper\'s return value is not followed yet, so a palette color there is not reported: `className={statusStyles[status]}` with `const statusStyles = { New: "bg-green-50 text-green-700" }` reports nothing, and neither does `cn("p-4", extra)` when `extra` holds the classes.',
    );
    expect(unfollowed['an object map']).toContain('className={statusStyles[status]}');
    expect(unfollowed['a variable passed to cn()']).toContain('cn("p-4", extra)');
    // The ways round it, checked above.
    expect(limits).toContain('make the statuses a `cva` variant');
    expect(limits).toContain('wrap each value in `cn()` where it is defined');
    // What reports the lookup today: the bench's @shadcn/lint scorer flags these maps.
    expect(limits).toContain('`require-static-classes`');
    expect(limits).toContain('`tw`');
    expect(limits).toContain('`bg-[var(--color-green-50)]`');

    const howItWorks = section(read('docs/how-it-works.md'), 'Limits').replace(/\s+/g, ' ');
    expect(howItWorks).toContain(
      "one kept in a variable, an object map or a helper's return value is not followed yet",
    );
    expect(howItWorks).toContain('`tw`');
    expect(howItWorks).toContain('`bg-[var(--color-green-50)]`');
  });
});
