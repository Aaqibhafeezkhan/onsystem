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
  // Menus whose root is the content, with a submenu's content as a part.
  'components/ui/dropdown-menu.tsx': `import * as React from "react"
export function DropdownMenu(props: { children?: React.ReactNode }) { return <div role="menu">{props.children}</div> }
export function DropdownMenuItem(props: { children?: React.ReactNode }) { return <div role="menuitem">{props.children}</div> }
export function DropdownMenuSubContent(props: { children?: React.ReactNode }) { return <div role="menu">{props.children}</div> }`,
  'components/ui/context-menu.tsx': `import * as React from "react"
export function ContextMenu(props: { children?: React.ReactNode }) { return <div role="menu">{props.children}</div> }
export function ContextMenuItem(props: { children?: React.ReactNode }) { return <div role="menuitem">{props.children}</div> }
export function ContextMenuSubContent(props: { children?: React.ReactNode }) { return <div role="menu">{props.children}</div> }`,
  'components/ui/avatar.tsx': `import * as React from "react"
export function Avatar(props: { children?: React.ReactNode }) { return <span>{props.children}</span> }
export function AvatarImage(props: { src?: string }) { return <img alt="" src={props.src} /> }
export function AvatarFallback(props: { children?: React.ReactNode }) { return <span>{props.children}</span> }`,
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

  it("does not take a submenu's content for the menu's, which the menu is", () => {
    const code = `import { DropdownMenu, DropdownMenuItem, DropdownMenuSubContent } from "@/components/ui/dropdown-menu"
import { ContextMenu, ContextMenuSubContent } from "@/components/ui/context-menu"
export default () => (
  <>
    <DropdownMenu><DropdownMenuContent><DropdownMenuItem>Edit</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
    <ContextMenu><ContextMenuContent>Hi</ContextMenuContent></ContextMenu>
  </>
)`;
    const found = findings(aria, code, 'no-unknown-component');
    expect(found.map((d) => [d.message, d.suggestion, d.fix])).toEqual([
      [
        'Unknown component <DropdownMenuContent>. Did you mean <DropdownMenu>, or one of its parts: DropdownMenuItem, DropdownMenuSubContent?',
        '<DropdownMenu>',
        undefined,
      ],
      [
        'Unknown component <ContextMenuContent>. Did you mean <ContextMenu>, or one of its parts: ContextMenuItem, ContextMenuSubContent?',
        '<ContextMenu>',
        undefined,
      ],
    ]);
  });

  it('takes a short part two edits from another for that part, with the rename', () => {
    const code = `import { Avatar, AvatarImage } from "@/components/ui/avatar"
export default () => <Avatar><AvatarImg src="/me.png" /></Avatar>`;
    const found = findings(aria, code, 'no-unknown-component');
    expect(found.map((d) => [d.message, d.fix?.[0]?.text])).toEqual([
      ['Unknown component <AvatarImg>. Did you mean <AvatarImage>?', 'AvatarImage'],
    ]);
  });

  it('does not take a part for one spelled like it but unlike it', async () => {
    // Within half the part's length, these were renamed: `Toggle` is three edits from `Title`,
    // `Provider` four from `Previous`.
    const families = await load(
      fixture(
        {
          'tsconfig.json': TSCONFIG,
          'components/ui/card.tsx': `import * as React from "react"
export function Card(props: { children?: React.ReactNode }) { return <div>{props.children}</div> }
export function CardHeader(props: { children?: React.ReactNode }) { return <div>{props.children}</div> }
export function CardTitle(props: { children?: React.ReactNode }) { return <h3>{props.children}</h3> }
export function CardContent(props: { children?: React.ReactNode }) { return <div>{props.children}</div> }`,
          'components/ui/carousel.tsx': `import * as React from "react"
export function Carousel(props: { children?: React.ReactNode }) { return <div>{props.children}</div> }
export function CarouselContent(props: { children?: React.ReactNode }) { return <div>{props.children}</div> }
export function CarouselItem(props: { children?: React.ReactNode }) { return <div>{props.children}</div> }
export function CarouselPrevious(props: { children?: React.ReactNode }) { return <button>{props.children}</button> }
export function CarouselNext(props: { children?: React.ReactNode }) { return <button>{props.children}</button> }`,
        },
        { nodeModules: true },
      ),
    );
    const code = `import { Card, CardTitle } from "@/components/ui/card"
import { Carousel, CarouselPrevious } from "@/components/ui/carousel"
export default () => (
  <>
    <Card><CardToggle /><CardTitle>Hi</CardTitle><CardContnt>Body</CardContnt></Card>
    <CarouselProvider><Carousel><CarouselPrevious /></Carousel></CarouselProvider>
  </>
)`;
    const found = findings(families, code, 'no-unknown-component');
    expect(found.map((d) => [d.message, d.fix?.[0]?.text])).toEqual([
      [
        'Unknown component <CardToggle>. Did you mean <Card>, or one of its parts: CardHeader, CardTitle, CardContent?',
        undefined,
      ],
      [
        'Unknown component <CardContnt>. Did you mean <CardContent> (import { CardContent } from "@/components/ui/card")?',
        undefined,
      ],
      [
        'Unknown component <CarouselProvider>. Did you mean <Carousel>, or one of its parts: CarouselContent, CarouselItem, CarouselPrevious, CarouselNext?',
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

  it("names a menu item for a submenu's trigger, and no element for a context menu's", () => {
    const code = `import { Button } from "@/components/ui/button"
import { ContextMenuTrigger, Menu, MenuItem, MenuTrigger, SubmenuTrigger } from "@/components/ui/menu"
export default () => (
  <>
    <MenuTrigger asChild><Button>Open</Button><Menu><MenuItem>Edit</MenuItem></Menu></MenuTrigger>
    <SubmenuTrigger asChild><MenuItem>Share</MenuItem><Menu><MenuItem>Mail</MenuItem></Menu></SubmenuTrigger>
    <ContextMenuTrigger asChild><div>Right-click here</div><Menu><MenuItem>Copy</MenuItem></Menu></ContextMenuTrigger>
  </>
)`;
    expect(findings(rac, code, 'no-unknown-prop').map((d) => d.message)).toEqual([
      '<MenuTrigger> has no prop "asChild". It takes the element that opens it as a child: <MenuTrigger><Button>…</Button>…</MenuTrigger>.',
      '<SubmenuTrigger> has no prop "asChild". It takes the element that opens it as a child: <SubmenuTrigger><MenuItem>…</MenuItem>…</SubmenuTrigger>.',
      '<ContextMenuTrigger> has no prop "asChild". It takes the area that opens the menu on a right-click as a child: <ContextMenuTrigger>…</ContextMenuTrigger>.',
    ]);
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
        '<Button> has no prop "asChild". React Aria components take no "asChild" prop. For a link, use a link component: render={(props) => …} only swaps in an element of the same kind.',
        undefined,
      ],
      [
        '<Button> has no prop "href". For a link, use a link component: React Aria’s render only swaps in an element of the same kind.',
        undefined,
      ],
    ]);
  });

  it('says to pass href to a React Aria component that takes it, with its render type spelled out', () => {
    const render = rac.getComponent('SidebarMenuButton')?.props.find((p) => p.name === 'render');
    expect(render?.type).toMatch(/^\(\(props: /);
    const code = `import { SidebarMenuButton } from "@/components/ui/sidebar"
import Link from "next/link"
export default () => <SidebarMenuButton asChild><Link href="/docs">Docs</Link></SidebarMenuButton>`;
    expect(findings(rac, code, 'no-unknown-prop').map((d) => [d.message, d.suggestion])).toEqual([
      [
        '<SidebarMenuButton> has no prop "asChild". React Aria components take no "asChild" prop. For a link, pass href: <SidebarMenuButton href="…">…</SidebarMenuButton>.',
        'href',
      ],
    ]);
  });
});

describe('a trigger that renders its own button', () => {
  it('gets no hint to put the button inside, which would nest one button in another', async () => {
    const own = await load(
      fixture(
        {
          'tsconfig.json': TSCONFIG,
          'components/ui/dialog.tsx': `import * as React from "react"
export function Dialog(props: { children?: React.ReactNode }) { return <div>{props.children}</div> }
export function DialogTrigger(props: React.ComponentProps<"button">) { return <button type="button" {...props} /> }`,
          'components/ui/button.tsx': `import * as React from "react"
export function Button(props: React.ComponentProps<"button">) { return <button {...props} /> }`,
        },
        { nodeModules: true },
      ),
    );
    expect(own.getComponent('DialogTrigger')?.element).toBe('button');
    const code = `import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
export default () => <Dialog><DialogTrigger asChild><Button>Open</Button></DialogTrigger></Dialog>`;
    expect(findings(own, code, 'no-unknown-prop').map((d) => [d.message, d.suggestion])).toEqual([
      ['<DialogTrigger> has no prop "asChild".', undefined],
    ]);
  });
});

describe('a render function of the design system’s own', () => {
  it('keeps the render advice, since it may return a link', async () => {
    // shadcn/ui's attachment on React Aria: its trigger is a button with a render function of
    // its own, typed as one that takes props, as React Aria's spelled out is.
    const own = await load(
      fixture(
        {
          'tsconfig.json': TSCONFIG,
          'components/ui/attachment.tsx': `import * as React from "react"
export function AttachmentTrigger({ render, ...props }: React.ComponentProps<"button"> & { render?: (props: React.HTMLAttributes<HTMLElement>) => React.ReactNode }) {
  return render ? <>{render(props)}</> : <button type="button" {...props} />
}`,
        },
        { nodeModules: true },
      ),
    );
    const render = own.getComponent('AttachmentTrigger')?.props.find((p) => p.name === 'render');
    expect(render?.type).toMatch(/^\(props: /);
    const code = `import { AttachmentTrigger } from "@/components/ui/attachment"
import Link from "next/link"
export default () => <AttachmentTrigger asChild><Link href="/file.pdf">Open</Link></AttachmentTrigger>`;
    expect(findings(own, code, 'no-unknown-prop').map((d) => [d.message, d.suggestion])).toEqual([
      [
        '<AttachmentTrigger> has no prop "asChild". Base UI components compose with render instead: <AttachmentTrigger render={<Link href="…" />}>…</AttachmentTrigger>.',
        'render',
      ],
    ]);
  });
});
