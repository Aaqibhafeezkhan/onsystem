import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { DEFAULT_TOKENS, loadConfig } from '../src/config.js';
import { tokenFiles } from '../src/design-system.js';
import { APP_STYLESHEETS, stylesheetResolver } from '../src/detect.js';
import { applyFixes } from '../src/lint/index.js';
import { TAILWIND_PALETTE } from '../src/lint/tailwind-palette.js';
import { importedStylesheets } from '../src/tokens/imports.js';
import { parseCssTokens } from '../src/tokens/index.js';
import { fixture, load, TSCONFIG } from './helpers.js';

/** The fixes `check` writes for a snippet, by rule. */
async function fixes(root: string, code: string, rule: string) {
  const system = await load(root);
  const diagnostics = system
    .check(code, 'app/page.tsx')
    .diagnostics.filter((d) => d.ruleId === rule);
  return {
    texts: diagnostics.map((d) => d.fix?.[0]?.text),
    messages: diagnostics.map((d) => d.message),
    fixed: applyFixes(code, diagnostics),
  };
}

describe('@theme values that wrap or reference a variable', () => {
  // shadcn's Tailwind v4 codemod leaves the v3 channels in :root and wraps them in @theme.
  const CODEMOD = `@import "tailwindcss";

@theme {
  --color-destructive: hsl(var(--destructive));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-success: rgb(var(--success) / <alpha-value>);
  --color-brand: var(--color-blue-600);
}

@layer base {
  :root {
    --destructive: 0 84.2% 60.2%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --success: 22 163 74;
  }
  .dark {
    --destructive: 0 62.8% 30.6%;
  }
}
`;

  it('reads hsl(var(--x)) and rgb(var(--x)) over bare channels as the token --x, with its class', () => {
    const { tokens } = parseCssTokens(CODEMOD, 'app/globals.css');
    const colors = tokens.filter((t) => t.category === 'color');
    expect(colors.map((t) => [t.name, t.tailwind, t.cssVar, t.value])).toEqual([
      ['destructive', 'destructive', '--destructive', '0 84.2% 60.2%'],
      ['muted-foreground', 'muted-foreground', '--muted-foreground', '215.4 16.3% 46.9%'],
      ['success', 'success', '--success', '22 163 74'],
      ['color-brand', 'brand', '--color-brand', TAILWIND_PALETTE.blue?.['600']],
    ]);
    const destructive = colors[0];
    expect(destructive?.modes).toEqual({ dark: '0 62.8% 30.6%' });
    expect(destructive?.usage).toEqual([
      'bg-destructive',
      'text-destructive',
      'border-destructive',
      'hsl(var(--destructive))',
    ]);
  });

  it('keeps a wrapper whose variable is no bare channels as the theme variable', () => {
    const { tokens } = parseCssTokens(
      `@theme { --color-primary: hsl(var(--primary)); }\n:root { --primary: oklch(0.5 0.2 30); }`,
      'app/globals.css',
    );
    expect(tokens.map((t) => [t.name, t.tailwind, t.value])).toEqual([
      ['color-primary', 'primary', 'hsl(var(--primary))'],
      ['primary', undefined, 'oklch(0.5 0.2 30)'],
    ]);
  });

  it('fixes palette colors to the classes, not to arbitrary hsl(var()) values', async () => {
    const root = fixture({ 'tsconfig.json': TSCONFIG, 'app/globals.css': CODEMOD });
    const code = `<p className="text-red-500 bg-[#ef4444] text-slate-500 bg-blue-600" />`;
    const { texts, fixed } = await fixes(root, code, 'no-hardcoded-color');
    expect(texts).toEqual([
      'text-destructive',
      'bg-destructive',
      'text-muted-foreground',
      'bg-brand',
    ]);
    expect(fixed).not.toContain('hsl(var(');
  });
});

describe('stylesheets imported one after another', () => {
  const GLOBALS = `@import "tailwindcss";
@import "./theme/base.css";
@import "./theme/brand.css";

@theme inline {
  --color-primary: var(--primary);
  --color-surface: var(--surface);
  --color-accent: var(--accent);
}

:root {
  --surface: #fafafa;
}
`;
  const project = () =>
    fixture({
      'tsconfig.json': TSCONFIG,
      'app/globals.css': GLOBALS,
      'app/theme/base.css': `@import "./base-colors.css";\n:root { --primary: oklch(0.205 0 0); --surface: #ffffff; --accent: #2563eb; }`,
      'app/theme/base-colors.css': `:root { --accent: #000000; }`,
      'app/theme/brand.css': `@import "./brand-accent.css";\n:root { --primary: #ff6600; }`,
      'app/theme/brand-accent.css': `:root { --accent: #7c3aed; }`,
    });

  it('lists a later import before an earlier one, each before what it imports', () => {
    const root = project();
    const sheets = importedStylesheets(
      [path.join(root, 'app/globals.css')],
      stylesheetResolver(root),
    );
    expect(sheets.map((f) => path.relative(root, f).replaceAll('\\', '/'))).toEqual([
      'app/theme/brand.css',
      'app/theme/brand-accent.css',
      'app/theme/base.css',
      'app/theme/base-colors.css',
    ]);
  });

  it('takes each value from the stylesheet the cascade applies', async () => {
    const system = await load(project());
    const value = (name: string) =>
      system.getTokens({ category: 'color' }).find((t) => t.name === name)?.value;
    // brand.css comes after base.css; brand-accent.css (imported by brand.css) after base.css.
    expect(value('primary')).toBe('#ff6600');
    expect(value('accent')).toBe('#7c3aed');
    // The importing stylesheet's own rules come after everything it imports.
    expect(value('surface')).toBe('#fafafa');
  });

  it('fixes a literal to the token only where the values match', async () => {
    const { texts, messages } = await fixes(
      project(),
      `<div className="bg-[#ff6600] bg-[#171717]" />`,
      'no-hardcoded-color',
    );
    expect(texts[0]).toBe('bg-primary');
    expect(texts[1]).not.toBe('bg-primary');
    expect(messages[1]).not.toContain('Matches token primary');
  });
});

describe("Tailwind v3's default radius scale", () => {
  const COMPONENTS_JSON = JSON.stringify({
    tailwind: { config: 'tailwind.config.js', css: 'app/globals.css' },
    aliases: { components: '@/components', ui: '@/components/ui' },
  });
  // shadcn/ui's v3 config extends the scale with three steps of its own.
  const EXTEND = `module.exports = {
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
}`;
  const V3_GLOBALS = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n@layer base {\n  :root {\n    --radius: 0.5rem;\n  }\n}\n`;
  const CODE = `<div className="rounded-[12px] rounded-t-[16px] rounded-b-[24px] rounded-[6px]" />`;

  it('keeps the steps a config extends rather than replaces', async () => {
    const root = fixture({
      'components.json': COMPONENTS_JSON,
      'tailwind.config.js': EXTEND,
      'app/globals.css': V3_GLOBALS,
    });
    const { fixed } = await fixes(root, CODE, 'no-hardcoded-radius');
    expect(fixed).toBe(`<div className="rounded-xl rounded-t-2xl rounded-b-3xl rounded-md" />`);
    const system = await load(root);
    const radius = system.getTokens({ category: 'radius' });
    expect(radius.find((t) => t.tailwind === 'xl')).toMatchObject({
      value: '0.75rem',
      origin: 'tailwind-default',
    });
    // The config's own `sm` (4px) wins over Tailwind's (2px).
    expect(radius.filter((t) => t.tailwind === 'sm').map((t) => t.value)).toEqual(['4px']);
  });

  it('adds none around config steps of no known size', async () => {
    // documenso's packages/ui: the shared preset sizes every step from --radius, and no
    // stylesheet of the package sets it, so the scale is unknown rather than Tailwind's.
    const root = fixture({
      'tailwind.config.js': EXTEND.replace(
        'borderRadius: {',
        'borderRadius: {\n        xl: "calc(var(--radius) + 4px)",',
      ),
    });
    const system = await load(root);
    expect(system.getTokens({ category: 'radius' })).toEqual([]);
    const { texts } = await fixes(root, `<div className="rounded-[2px]" />`, 'no-hardcoded-radius');
    expect(texts).toEqual([]);
  });

  it('adds none when the config replaces the scale', async () => {
    const root = fixture({
      'components.json': COMPONENTS_JSON,
      'tailwind.config.js': `module.exports = { theme: { borderRadius: { sm: "4px", lg: "var(--radius)" } } }`,
      'app/globals.css': V3_GLOBALS,
    });
    const system = await load(root);
    expect(
      system
        .getTokens({ category: 'radius' })
        .map((t) => t.tailwind)
        .sort(),
    ).toEqual(['lg', 'sm']);
  });

  it("adds them back when the replacing scale spreads Tailwind's", async () => {
    const root = fixture({
      'components.json': COMPONENTS_JSON,
      'tailwind.config.js': `const defaultTheme = require("tailwindcss/defaultTheme")
module.exports = { theme: { borderRadius: { ...defaultTheme.borderRadius, card: "20px" } } }`,
      'app/globals.css': V3_GLOBALS,
    });
    const { fixed } = await fixes(
      root,
      `<div className="rounded-[12px] rounded-[20px]" />`,
      'no-hardcoded-radius',
    );
    expect(fixed).toBe(`<div className="rounded-xl rounded-card" />`);
  });

  it("leaves a Tailwind v4 stylesheet with Tailwind v4's scale", async () => {
    const root = fixture({
      'components.json': COMPONENTS_JSON,
      'tailwind.config.js': EXTEND,
      'app/globals.css': `@import "tailwindcss";\n@config "../tailwind.config.js";\n:root { --radius: 0.5rem; }\n`,
    });
    const system = await load(root);
    const sm = system.getTokens({ category: 'radius' }).filter((t) => t.tailwind === 'sm');
    expect(sm.map((t) => [t.value, t.origin])).not.toContainEqual(['2px', 'tailwind-default']);
    expect(system.getTokens({ category: 'radius' }).some((t) => t.tailwind === '4xl')).toBe(true);
  });
});

describe("an app's own stylesheet next to the one components.json names", () => {
  // Shaped like cal.com: components.json points at a component library's stylesheet in another
  // package, while the app's own stylesheet imports the app's tokens and that stylesheet.
  const LIBRARY_CSS = `:root {\n  --background: #ffffff;\n  --foreground: #0a0a0a;\n}\n@theme inline {\n  --color-background: var(--background);\n  --color-foreground: var(--foreground);\n}\n`;
  const TOKENS_CSS = `:root {\n  --cal-bg-emphasis: #e5e7eb;\n  --cal-text-subtle: #6b7280;\n  --background: #f9fafb;\n}\n@theme inline {\n  --color-emphasis: var(--cal-bg-emphasis);\n  --color-subtle: var(--cal-text-subtle);\n}\n`;
  const workspace = (appCss?: string) =>
    fixture({
      'package.json': JSON.stringify({
        name: 'calcom',
        private: true,
        workspaces: ['apps/*', 'packages/*'],
      }),
      'apps/web/package.json': JSON.stringify({
        name: '@calcom/web',
        dependencies: { '@coss/ui': '*' },
      }),
      'apps/web/tsconfig.json': TSCONFIG,
      'apps/web/components.json': JSON.stringify({
        tailwind: { config: '', css: '../../packages/coss-ui/src/styles/globals.css' },
        aliases: { components: '@/components', ui: '@coss/ui/components' },
      }),
      ...(appCss === undefined ? {} : { 'apps/web/styles/globals.css': appCss }),
      'packages/config/theme/tokens.css': TOKENS_CSS,
      'packages/coss-ui/package.json': JSON.stringify({
        name: '@coss/ui',
        exports: { './components/*': './src/components/*.tsx' },
      }),
      'packages/coss-ui/src/styles/globals.css': LIBRARY_CSS,
      'packages/coss-ui/src/components/button.tsx': `export function Button(props: { children?: unknown }) {\n  return <button className="bg-emphasis text-subtle">{props.children as never}</button>\n}\n`,
      'packages/coss-ui/src/components/badge.tsx': `export function Badge(props: { children?: unknown }) {\n  return <span className="text-subtle">{props.children as never}</span>\n}\n`,
    });
  const APP_CSS = `@import "tailwindcss";\n@import "../../../packages/config/theme/tokens.css";\n@import "../../../packages/coss-ui/src/styles/globals.css";\n`;

  it('reads the app stylesheet, and through it the library one, in cascade order', async () => {
    const root = path.join(workspace(APP_CSS), 'apps/web');
    const config = await loadConfig({ root });
    const files = (await tokenFiles(config)).map((f) =>
      path.relative(root, f).replaceAll('\\', '/'),
    );
    expect(files).toEqual([
      'styles/globals.css',
      '../../packages/coss-ui/src/styles/globals.css',
      '../../packages/config/theme/tokens.css',
    ]);
    const system = await load(root);
    const colors = Object.fromEntries(
      system.getTokens({ category: 'color' }).map((t) => [t.tailwind ?? t.name, t.value] as const),
    );
    expect(colors).toMatchObject({
      emphasis: '#e5e7eb',
      subtle: '#6b7280',
      // The library's stylesheet is imported after the app's tokens, so its value applies.
      background: '#ffffff',
    });
    const { texts } = await fixes(root, `<p className="text-[#6b7280]" />`, 'no-hardcoded-color');
    expect(texts).toEqual(['text-subtle']);
  });

  it("reads only components.json's stylesheet when the app has none of its own", async () => {
    const root = path.join(workspace(), 'apps/web');
    const config = await loadConfig({ root });
    const files = (await tokenFiles(config)).map((f) =>
      path.relative(root, f).replaceAll('\\', '/'),
    );
    expect(files).toEqual(['../../packages/coss-ui/src/styles/globals.css']);
  });

  it('looks for the app stylesheet where zero config does without components.json', () => {
    expect(APP_STYLESHEETS).toEqual(DEFAULT_TOKENS.filter((t) => t.endsWith('.css')));
  });
});
