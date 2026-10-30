import path from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import type { DesignSystem } from '../src/design-system.js';
import type { Diagnostic } from '../src/types.js';
import { fixture, load, loadOnce, TSCONFIG } from './helpers.js';

// What no-unknown-component and no-unknown-prop say in a design system that composes neither the
// Radix way (asChild) nor the Base UI way (a render element): React Aria Components, as in a
// shadcn/ui style built on them, where Dialog is the content and DialogTrigger takes its button
// as a child.

const RAC_ROOT = path.resolve(import.meta.dirname, 'fixtures/rac-ui');

/** A flat Dialog family, as shadcn/ui on React Aria writes it: no DialogContent. */
const ARIA_DIALOG = {
  'tsconfig.json': TSCONFIG,
  'components/ui/dialog.tsx': `import * as React from "react"
export function Dialog(props: { children?: React.ReactNode }) { return <section role="dialog">{props.children}</section> }
export function DialogTrigger(props: { children?: React.ReactNode; isOpen?: boolean }) { return <>{props.children}</> }
export function DialogHeader(props: { children?: React.ReactNode }) { return <div>{props.children}</div> }
export function DialogFooter(props: { children?: React.ReactNode }) { return <div>{props.children}</div> }
export function DialogTitle(props: { children?: React.ReactNode }) { return <h2>{props.children}</h2> }`,
  'components/ui/button.tsx': `import * as React from "react"
export function Button(props: React.ComponentProps<"button">) { return <button {...props} /> }`,
};

function findings(system: DesignSystem, code: string, rule: string): Diagnostic[] {
  return system.check(code, 'app/page.tsx').diagnostics.filter((d) => d.ruleId === rule);
}

describe('an unknown part of a family', () => {
  let aria: DesignSystem;
  beforeAll(async () => {
    aria = await load(fixture(ARIA_DIALOG, { nodeModules: true }));
  });

  it("names the family's component and its parts, not the part spelled closest", () => {
    const code = `import { Dialog, DialogContent } from "@/components/ui/dialog"
export default () => <Dialog><DialogContent>Hi</DialogContent></Dialog>`;
    const [d] = findings(aria, code, 'no-unknown-component');
    expect(d?.message).toBe(
      '"DialogContent" is not a design-system component (imported from "@/components/ui/dialog"). Did you mean <Dialog>, or one of its parts: DialogTrigger, DialogHeader, DialogFooter, DialogTitle?',
    );
    expect(d?.suggestion).toBe('<Dialog>');
  });

  it('names it without a rename for a part that is not imported', () => {
    const code = `import { Dialog } from "@/components/ui/dialog"
export default () => <Dialog><DialogContent>Hi</DialogContent></Dialog>`;
    const [d] = findings(aria, code, 'no-unknown-component');
    expect(d?.message).toBe(
      'Unknown component <DialogContent>. Did you mean <Dialog>, or one of its parts: DialogTrigger, DialogHeader, DialogFooter, DialogTitle?',
    );
    expect(d?.fix).toBeUndefined();
  });

  it('still takes a misspelled part for that part, with the rename', () => {
    const code = `import { Dialog, DialogTitle } from "@/components/ui/dialog"
export default () => <Dialog><DialogTitel>Hi</DialogTitel><DialogHeadr /></Dialog>`;
    const found = findings(aria, code, 'no-unknown-component');
    expect(found.map((d) => [d.message, d.fix?.[0]?.text])).toEqual([
      ['Unknown component <DialogTitel>. Did you mean <DialogTitle>?', 'DialogTitle'],
      [
        'Unknown component <DialogHeadr>. Did you mean <DialogHeader> (import { DialogHeader } from "@/components/ui/dialog")?',
        undefined,
      ],
    ]);
  });

  it('does not take a component of its own for a part of a component without parts', () => {
    const code = `import { Button, ButtonGroup } from "@/components/ui/button"
export default () => <ButtonGroup><Button>Hi</Button></ButtonGroup>`;
    expect(findings(aria, code, 'no-unknown-component').map((d) => d.message)).toEqual([
      '"ButtonGroup" is not a design-system component (imported from "@/components/ui/button"). Use search_components to find an existing one.',
    ]);
  });
});

describe('composition in React Aria Components', () => {
  let rac: DesignSystem;
  beforeAll(async () => {
    rac = await loadOnce(RAC_ROOT);
  });

  it('says a trigger takes the element that opens it as a child, for asChild', () => {
    const code = `import { Button } from "@/components/ui/button"
import { DialogTrigger } from "@/components/ui/dialog"
export default () => <DialogTrigger asChild><Button>Open</Button></DialogTrigger>`;
    const [d] = findings(rac, code, 'no-unknown-prop');
    expect(d?.message).toBe(
      '<DialogTrigger> has no prop "asChild". It takes the element that opens it as a child: <DialogTrigger><Button>…</Button>…</DialogTrigger>.',
    );
    expect(d?.suggestion).toBeUndefined();
    expect(d?.fix).toBeUndefined();
  });

  it("does not point at Base UI's render element, which React Aria's render function is not", () => {
    const code = `import { Button } from "@/components/ui/button"
import Link from "next/link"
export default () => (
  <>
    <Button asChild><Link href="/docs">Docs</Link></Button>
    <Button href="/docs">Docs</Button>
  </>
)`;
    expect(findings(rac, code, 'no-unknown-prop').map((d) => [d.message, d.suggestion])).toEqual([
      [
        '<Button> has no prop "asChild". React Aria components take no asChild. For a link, use a link component: render={(props) => …} only swaps in an element of the same kind.',
        undefined,
      ],
      [
        '<Button> has no prop "href". For a link, use a link component: React Aria’s render only swaps in an element of the same kind.',
        undefined,
      ],
    ]);
  });
});
