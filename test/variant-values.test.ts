import { describe, expect, it } from 'vitest';

import type { DesignSystem } from '../src/design-system.js';
import { applyFixes } from '../src/lint/index.js';
import type { ComponentInfo } from '../src/types.js';
import { fixture, load, TSCONFIG } from './helpers.js';

// A cva/tv literal does not always list every value a variant takes: a spread
// (`{ ...base, brand }`), a key that is not a literal, or tv's `extend` adds values it does not
// show. The values the checker gives the prop stay; the literal only orders them.

function component(ds: DesignSystem, name: string): ComponentInfo {
  const found = ds.getComponent(name);
  if (!found) throw new Error(`missing component ${name}`);
  return found;
}

function values(c: ComponentInfo): [string, string[] | undefined][] {
  return c.props.filter((p) => p.kind === 'variant').map((p) => [p.name, p.values]);
}

function messages(ds: DesignSystem, code: string): string[] {
  return ds.check(code, 'app/page.tsx').diagnostics.map((d) => `${d.ruleId}: ${d.message}`);
}

const imports = `import { Button } from "@/components/ui/button"\n`;

/** A shadcn/ui-style Button whose `variant` spreads shared values into its cva literal. */
const SPREAD_BUTTON = `import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

const shared = {
  default: "bg-primary text-primary-foreground",
  outline: "border bg-background",
} as const

const buttonVariants = cva("inline-flex items-center", {
  variants: {
    variant: { ...shared, brand: "bg-brand text-white" },
    size: { sm: "h-8 px-3", lg: "h-10 px-6" },
  },
  defaultVariants: { variant: "default", size: "sm" },
})

export function Button({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return <button className={buttonVariants({ variant, size, className })} {...props} />
}
`;

describe('variant values a cva literal does not list', () => {
  it('keeps the values VariantProps gives a variant whose literal spreads others in', async () => {
    const ds = await load(
      fixture(
        { 'tsconfig.json': TSCONFIG, 'components/ui/button.tsx': SPREAD_BUTTON },
        { nodeModules: true },
      ),
    );
    const button = component(ds, 'Button');
    expect(values(button)).toEqual([
      ['variant', ['default', 'outline', 'brand']],
      ['size', ['sm', 'lg']],
    ]);
    expect(button.props.find((p) => p.name === 'variant')?.type).toBe(
      '"default" | "outline" | "brand"',
    );
    expect(button.variants.map((v) => [v.name, v.values])).toEqual([
      ['variant', ['default', 'outline', 'brand']],
      ['size', ['sm', 'lg']],
    ]);

    const code = `${imports}<><Button variant="default">a</Button><Button variant="outline">b</Button></>`;
    const diagnostics = ds.check(code, 'app/page.tsx').diagnostics;
    expect(diagnostics).toEqual([]);
    expect(applyFixes(code, diagnostics)).toBe(code);
    expect(messages(ds, `${imports}<Button variant="primary" size="xl">c</Button>`)).toEqual([
      'no-unknown-variant: "primary" is not a valid variant for <Button>. Allowed: default, outline, brand. Did you mean "default"?',
      'no-unknown-variant: "xl" is not a valid size for <Button>. Allowed: sm, lg.',
    ]);
  });

  it("keeps a prop's own union when tv's extend adds the base's values", async () => {
    const ds = await load(
      fixture({
        'tsconfig.json': TSCONFIG,
        'components/ui/button.tsx': `import { tv } from "tailwind-variants"

const base = tv({ variants: { size: { sm: "h-8", md: "h-9" } } })

const button = tv({
  extend: base,
  base: "rounded-md",
  variants: { size: { xl: "h-12" } },
})

export interface ButtonProps {
  size?: "sm" | "md" | "xl"
  children?: string
}

export function Button({ size, children }: ButtonProps) {
  return <button className={button({ size })}>{children}</button>
}
`,
      }),
    );
    expect(values(component(ds, 'Button'))).toEqual([['size', ['sm', 'md', 'xl']]]);
    expect(messages(ds, `${imports}<Button size="sm">a</Button>`)).toEqual([]);
    expect(messages(ds, `${imports}<Button size="lg">a</Button>`)).toEqual([
      'no-unknown-variant: "lg" is not a valid size for <Button>. Allowed: sm, md, xl.',
    ]);
  });

  it('leaves a variant open when its values are not all in the literal and nothing types them', async () => {
    // No node_modules: VariantProps does not resolve, so the literal is all there is to read.
    const ds = await load(
      fixture({
        'tsconfig.json': TSCONFIG,
        'components/ui/button.tsx': SPREAD_BUTTON,
        'components/ui/badge.tsx': `import { cva, type VariantProps } from "class-variance-authority"

enum Tone { Info = "info" }

const badgeVariants = cva("rounded-full", {
  variants: {
    tone: { [Tone.Info]: "bg-blue-100", neutral: "bg-muted" },
    shape: { pill: "rounded-full", square: "rounded-none" },
  },
})

export function Badge({ tone, shape }: VariantProps<typeof badgeVariants>) {
  return <span className={badgeVariants({ tone, shape })} />
}
`,
        'components/ui/chip.tsx': `import { tv, type VariantProps } from "tailwind-variants"
import { focusRing } from "./focus"

const chip = tv({ extend: focusRing, variants: { size: { sm: "h-6" } } })

export function Chip({ size }: VariantProps<typeof chip>) {
  return <span className={chip({ size })} />
}
`,
      }),
    );
    expect(values(component(ds, 'Button'))).toEqual([
      ['variant', undefined],
      ['size', ['sm', 'lg']],
    ]);
    expect(values(component(ds, 'Badge'))).toEqual([
      ['tone', undefined],
      ['shape', ['pill', 'square']],
    ]);
    expect(values(component(ds, 'Chip'))).toEqual([['size', undefined]]);
    expect(
      messages(
        ds,
        `import { Badge } from "@/components/ui/badge"
import { Chip } from "@/components/ui/chip"
${imports}<><Button variant="default" size="xl">a</Button><Badge tone="info" shape="round" /><Chip size="md" /></>`,
      ),
    ).toEqual([
      'no-unknown-variant: "xl" is not a valid size for <Button>. Allowed: sm, lg.',
      'no-unknown-variant: "round" is not a valid shape for <Badge>. Allowed: pill, square.',
    ]);
  });

  it('checks the values the prop is typed with, in the order the literal gives', async () => {
    // The component maps its own names onto the cva keys: callers pass "small", not "sm".
    const ds = await load(
      fixture({
        'tsconfig.json': TSCONFIG,
        'components/ui/button.tsx': `import { cva } from "class-variance-authority"

const buttonVariants = cva("rounded-md", {
  variants: {
    size: { sm: "h-8", lg: "h-10" },
    tone: { quiet: "opacity-80", loud: "font-bold", plain: "" },
  },
})

export interface ButtonProps {
  size?: "small" | "large"
  tone?: "plain" | "loud"
  children?: string
}

export function Button({ size, tone, children }: ButtonProps) {
  return (
    <button className={buttonVariants({ size: size === "small" ? "sm" : "lg", tone })}>
      {children}
    </button>
  )
}
`,
      }),
    );
    expect(values(component(ds, 'Button'))).toEqual([
      ['size', ['small', 'large']],
      ['tone', ['loud', 'plain']],
    ]);
    const code = `${imports}<Button size="small">a</Button>`;
    const diagnostics = ds.check(code, 'app/page.tsx').diagnostics;
    expect(diagnostics).toEqual([]);
    expect(applyFixes(code, diagnostics)).toBe(code);
    expect(messages(ds, `${imports}<Button size="sm" tone="quiet">a</Button>`)).toEqual([
      'no-unknown-variant: "sm" is not a valid size for <Button>. Allowed: small, large. Did you mean "small"?',
      'no-unknown-variant: "quiet" is not a valid tone for <Button>. Allowed: loud, plain. Did you mean "plain"?',
    ]);
  });
});
