import { beforeAll, describe, expect, it } from 'vitest';

import type { DesignSystem } from '../src/design-system.js';
import { DEMO_ROOT, loadOnce } from './helpers.js';

const rule = 'icon-button-accessible-name';

let ds: DesignSystem;
beforeAll(async () => {
  ds = await loadOnce(DEMO_ROOT);
});

const found = (code: string, file = 'components/controls.tsx') =>
  ds
    .check(code, file)
    .diagnostics.filter((d) => d.ruleId === rule)
    .map((d) => [d.line, d.message]);

describe('icon-button-accessible-name and <label htmlFor>', () => {
  // signoff-ui's playground (examples/playground/components/controls.tsx): a switch named by the
  // label whose htmlFor is its id. A button is a labelable element, so that label is its name.
  const SWITCH = `import { useId } from "react"

export function Switch({ checked, onChange, label, hint }: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  hint: string
}) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm">
          {label}
        </label>
        <p id={\`\${id}-hint\`} className="text-muted-foreground text-xs">
          {hint}
        </p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={\`\${id}-hint\`}
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-5 w-9 rounded-full border"
      >
        <span className="inline-block size-3.5 rounded-full bg-muted-foreground" />
      </button>
    </div>
  )
}`;

  it('takes the name of a label whose htmlFor is the button id', () => {
    expect(found(SWITCH)).toEqual([]);
  });

  it('matches a string id, and the design system Label', () => {
    expect(
      found(`import { Label } from "@/components/ui/label"
import { SunIcon } from "lucide-react"
export function Theme() {
  return (
    <>
      <Label htmlFor="theme-toggle">Dark mode</Label>
      <button id="theme-toggle" type="button"><SunIcon /></button>
      <label htmlFor="sound">Sound</label>
      <button id={"sound"} role="switch" />
    </>
  )
}`),
    ).toEqual([]);
  });

  it('still reports a button no label names', () => {
    const lines = (code: string) => found(code).map(([line]) => line);
    // No label points at it, the label points elsewhere, or the label is empty.
    expect(
      lines(`import { SunIcon } from "lucide-react"
export function Theme() {
  return (
    <>
      <label htmlFor="email">Email</label>
      <input id="email" />
      <button id="toggle" type="button"><SunIcon /></button>
      <label htmlFor="other" />
      <button id="other" type="button"><SunIcon /></button>
      <button type="button"><SunIcon /></button>
    </>
  )
}`),
    ).toEqual([7, 9, 10]);
    // Each component has its own \`id\`: a label in one names nothing in the other.
    expect(
      lines(`import { useId } from "react"
import { SunIcon } from "lucide-react"
function Named() {
  const id = useId()
  return <label htmlFor={id}>Dark mode</label>
}
export function Toggle() {
  const id = useId()
  return <button id={id} type="button"><SunIcon /></button>
}`),
    ).toEqual([9]);
  });
});
