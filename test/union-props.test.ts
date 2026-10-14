import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import type { DesignSystem } from '../src/design-system.js';
import { renderComponent } from '../src/server/render.js';
import type { ComponentInfo } from '../src/types.js';
import { fixture, load, TSCONFIG } from './helpers.js';

// Props typed as a union of members, as Radix types Accordion and ToggleGroup:
// `ForwardRefExoticComponent<(SingleProps | MultipleProps) & RefAttributes<HTMLDivElement>>`.
// A prop takes what any member allows, so `type="multiple"` is as valid as `type="single"`.

function component(ds: DesignSystem, name: string): ComponentInfo {
  const found = ds.getComponent(name);
  if (!found) throw new Error(`missing component ${name}`);
  return found;
}

function prop(c: ComponentInfo, name: string) {
  const found = c.props.find((p) => p.name === name);
  if (!found) throw new Error(`missing prop ${c.name}.${name}`);
  return found;
}

function messages(ds: DesignSystem, code: string): string[] {
  return ds.check(code, 'app/page.tsx').diagnostics.map((d) => `${d.ruleId}: ${d.message}`);
}

/** The real declarations of the Radix packages, from test/fixtures/radix, as installed packages. */
function radixPackages(): Record<string, string> {
  const dir = path.resolve(import.meta.dirname, 'fixtures/radix');
  const files: Record<string, string> = {};
  for (const name of fs.readdirSync(dir)) {
    const types = path.join(dir, name, 'index.d.ts');
    if (!fs.existsSync(types)) continue;
    files[`node_modules/@radix-ui/${name}/package.json`] = JSON.stringify({
      name: `@radix-ui/${name}`,
      types: 'index.d.ts',
    });
    files[`node_modules/@radix-ui/${name}/index.d.ts`] = fs.readFileSync(types, 'utf8');
  }
  return files;
}

const UTILS = `import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`;

describe('props typed as a union of members', () => {
  const files = {
    'tsconfig.json': TSCONFIG,
    'node_modules/fake-accordion/package.json':
      '{ "name": "fake-accordion", "types": "index.d.ts" }',
    'node_modules/fake-accordion/index.d.ts': `import * as React from "react"
interface SingleProps {
  type: "single"
  value?: string
  onValueChange?(value: string): void
  /** Whether an open item can be closed. */
  collapsible?: boolean
  size: "sm" | "md"
  tone?: "plain"
}
interface MultipleProps {
  type: "multiple"
  value?: string[]
  onValueChange?(value: string[]): void
  size?: "lg"
  tone?: string
}
export declare const Root: React.ForwardRefExoticComponent<(SingleProps | MultipleProps) & React.RefAttributes<HTMLDivElement>>
`,
    'components/ui/accordion.tsx': `import * as React from "react"
import * as AccordionPrimitive from "fake-accordion"

export function Accordion(props: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root {...props} />
}
`,
  };
  const imports = `import { Accordion } from "@/components/ui/accordion"\n`;

  it('lists every value any member allows, and the type each member gives', async () => {
    const ds = await load(fixture(files, { nodeModules: true }));
    const accordion = component(ds, 'Accordion');
    expect(prop(accordion, 'type')).toMatchObject({
      type: '"single" | "multiple"',
      values: ['single', 'multiple'],
      required: true,
    });
    expect(prop(accordion, 'value')).toMatchObject({ type: 'string | string[]', required: false });
    expect(prop(accordion, 'onValueChange').type).toBe(
      '((value: string) => void) | ((value: string[]) => void)',
    );
    // Required only where every member requires it.
    expect(prop(accordion, 'size')).toMatchObject({ values: ['sm', 'md', 'lg'], required: false });
    expect(prop(accordion, 'collapsible')).toMatchObject({
      type: 'boolean',
      required: false,
      description: 'Whether an open item can be closed. From fake-accordion.',
    });
    // One member takes any string, so the prop has no closed set of values.
    expect(prop(accordion, 'tone').values).toBeUndefined();
  });

  it('accepts a value from any member and reports one that no member allows', async () => {
    const ds = await load(fixture(files, { nodeModules: true }));
    expect(
      messages(
        ds,
        `${imports}<><Accordion type="multiple" size="lg" tone="loud">x</Accordion><Accordion type="single" size="sm" collapsible>y</Accordion></>`,
      ),
    ).toEqual([]);
    expect(messages(ds, `${imports}<Accordion type="many" size="xl">x</Accordion>`)).toEqual([
      'no-unknown-variant: "many" is not a valid type for <Accordion>. Allowed: single, multiple.',
      'no-unknown-variant: "xl" is not a valid size for <Accordion>. Allowed: sm, md, lg.',
    ]);
  });
});

describe('shadcn/ui Accordion and ToggleGroup on the real Radix types', () => {
  /** shadcn/ui's v4 components: functions taking `React.ComponentProps<typeof X.Root>`. */
  const v4 = {
    'tsconfig.json': TSCONFIG,
    'lib/utils.ts': UTILS,
    ...radixPackages(),
    'components/ui/accordion.tsx': `"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Accordion({
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="overflow-hidden text-sm"
      {...props}
    >
      <div className={cn("pt-0 pb-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
`,
    'components/ui/toggle.tsx': `"use client"

import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border border-input bg-transparent shadow-xs",
      },
      size: {
        default: "h-9 px-2 min-w-9",
        sm: "h-8 px-1.5 min-w-8",
        lg: "h-10 px-2.5 min-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
`,
    'components/ui/toggle-group.tsx': `"use client"

import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: "default",
  variant: "default",
})

function ToggleGroup({
  className,
  variant,
  size,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      className={cn(
        "group/toggle-group flex w-fit items-center rounded-md data-[variant=outline]:shadow-xs",
        className
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
}

function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={context.size || size}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        "min-w-0 flex-1 shrink-0 rounded-none shadow-none first:rounded-l-md last:rounded-r-md focus:z-10 focus-visible:z-10",
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
}

export { ToggleGroup, ToggleGroupItem }
`,
  };

  /** The v3 components: the Radix root re-exported as it is, and forwardRef with its props. */
  const v3 = {
    ...v4,
    'components/ui/accordion.tsx': `"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"

import { cn } from "@/lib/utils"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item ref={ref} className={cn("border-b", className)} {...props} />
))
AccordionItem.displayName = "AccordionItem"

export { Accordion, AccordionItem }
`,
    'components/ui/toggle-group.tsx': `"use client"

import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn("flex items-center justify-center gap-1", className)}
    {...props}
  >
    {children}
  </ToggleGroupPrimitive.Root>
))
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
    VariantProps<typeof toggleVariants>
>(({ className, children, variant, size, ...props }, ref) => (
  <ToggleGroupPrimitive.Item
    ref={ref}
    className={cn(toggleVariants({ variant, size }), className)}
    {...props}
  >
    {children}
  </ToggleGroupPrimitive.Item>
))
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }
`,
  };

  // shadcn/ui's own toggle-group demo, and the accordion its docs open with.
  const usage = `import { Accordion, AccordionItem } from "@/components/ui/accordion"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export default function Page() {
  return (
    <div>
      <Accordion type="multiple" defaultValue={["shipping"]}>
        <AccordionItem value="shipping">Shipping</AccordionItem>
      </Accordion>
      <Accordion type="single" collapsible defaultValue="returns">
        <AccordionItem value="returns">Returns</AccordionItem>
      </Accordion>
      <ToggleGroup variant="outline" type="multiple">
        <ToggleGroupItem value="bold" aria-label="Toggle bold">B</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup type="single" size="sm" defaultValue="left">
        <ToggleGroupItem value="left" aria-label="Align left">L</ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
`;

  for (const [style, files] of [
    ['v4', v4],
    ['v3', v3],
  ] as const) {
    it(`takes type="multiple" and type="single" (${style} components)`, async () => {
      const ds = await load(fixture(files, { nodeModules: true }));
      for (const name of ['Accordion', 'ToggleGroup']) {
        const c = component(ds, name);
        expect([name, c.openProps]).toEqual([name, false]);
        expect([name, prop(c, 'type')]).toMatchObject([
          name,
          { values: ['single', 'multiple'], required: true },
        ]);
        expect([name, prop(c, 'value').type]).toEqual([name, 'string | string[]']);
      }
      expect(prop(component(ds, 'Accordion'), 'collapsible').required).toBe(false);
      expect(prop(component(ds, 'ToggleGroup'), 'variant').values).toEqual(['default', 'outline']);

      expect(messages(ds, usage)).toEqual([]);
      expect(
        messages(ds, usage.replace('type="multiple" defaultValue', 'type="many" defaultValue')),
      ).toEqual([
        'no-unknown-variant: "many" is not a valid type for <Accordion>. Allowed: single, multiple.',
      ]);
      expect(messages(ds, usage.replace('variant="outline"', 'variant="ghost"'))).toEqual([
        'no-unknown-variant: "ghost" is not a valid variant for <ToggleGroup>. Allowed: default, outline.',
      ]);
    });
  }

  it('tells agents both values in get_component', async () => {
    const ds = await load(fixture(v4, { nodeModules: true }));
    const text = renderComponent(ds, component(ds, 'Accordion'));
    expect(text).toContain('- type: "single" | "multiple"');
    expect(text).toContain('- value?: string | string[]');
  });
});
