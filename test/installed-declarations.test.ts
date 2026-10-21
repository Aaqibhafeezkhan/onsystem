import fs from 'node:fs';
import path from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { describe, expect, it } from 'vitest';

import { main, type Io } from '../src/cli.js';
import { RULE_IDS } from '../src/config.js';
import { createServer } from '../src/server/index.js';
import { fixture, load, TSCONFIG } from './helpers.js';

// A design-system package installed from a registry as compiled `dist/` and type declarations
// alone, as tsup and tsc publish one: its components, props, variants and the elements they
// render are read from its `.d.ts`, as MUI's are. Before, an app on it got the token rules and
// nothing else: "No design-system components found".

const json = (value: unknown) => JSON.stringify(value, null, 2);

/**
 * `dist/index.d.ts` as tsup bundles it from cva components: the variants inlined as a union, and
 * cva's `ClassProp` imported by a path (`class-variance-authority/dist/types`) that cva's
 * `exports` do not name, so `"moduleResolution": "bundler"` does not resolve it.
 */
const TYPES = `import * as react from 'react';
import { HTMLAttributes, SVGProps } from 'react';
import * as react_jsx_runtime from 'react/jsx-runtime';
import * as class_variance_authority_dist_types from 'class-variance-authority/dist/types';
import { VariantProps } from 'class-variance-authority';

declare const buttonVariants: (props?: ({
    variant?: "default" | "outline" | "destructive" | null | undefined;
    size?: "sm" | "md" | "lg" | null | undefined;
} & class_variance_authority_dist_types.ClassProp) | undefined) => string;
interface ButtonProps extends react.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    /** Shows a spinner and disables the button. */
    loading?: boolean;
}
/** The primary action of a form or dialog. */
declare const Button: react.ForwardRefExoticComponent<ButtonProps & react.RefAttributes<HTMLButtonElement>>;

declare const Input: react.ForwardRefExoticComponent<react.InputHTMLAttributes<HTMLInputElement> & {
    error?: string;
} & react.RefAttributes<HTMLInputElement>>;

declare function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>): react_jsx_runtime.JSX.Element;
declare function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>): react_jsx_runtime.JSX.Element;

declare function Tab(props: { id: string; children?: react.ReactNode }): react_jsx_runtime.JSX.Element;
declare function Tabs(props: { children?: react.ReactNode }): react_jsx_runtime.JSX.Element;
declare function Checkbox(props: { checked?: boolean }): react_jsx_runtime.JSX.Element;
declare function CheckboxGroup(props: { children?: react.ReactNode }): react_jsx_runtime.JSX.Element;

type PolymorphicProps<C, P> = C extends react.ElementType ? P & Omit<react.ComponentPropsWithoutRef<C>, keyof P> & {
    component?: C;
} : P & {
    component: react.ElementType;
};
interface TextProps {
    size?: "sm" | "md";
}
declare const Text: <C = "p">(props: PolymorphicProps<C, TextProps>) => react.ReactElement;

declare function ChevronLeft(props: SVGProps<SVGSVGElement>): react_jsx_runtime.JSX.Element;

declare function Format(value: number): string;
declare class Cookies {
    get(name: string): string | undefined;
}
declare const Theme: {
    primary: string;
};

export { Button, type ButtonProps, Card, CardHeader, Checkbox, CheckboxGroup, ChevronLeft, Cookies, Format, Input, Tab, Tabs, Text, Theme, buttonVariants };
`;

const THEME =
  '@theme {\n  --spacing: 0.25rem;\n  --color-primary: oklch(0.55 0.2 260);\n  --color-muted: oklch(0.97 0 0);\n  --radius-sm: 0.25rem;\n  --radius-md: 0.375rem;\n}\n';

/** `@acme/ui` as npm publishes it from `files: ["dist", "theme.css"]`, without `onsystem`. */
const PACKAGE: Record<string, string> = {
  'package.json': json({
    name: '@acme/ui',
    version: '1.0.0',
    files: ['dist', 'theme.css'],
    main: './dist/index.js',
    module: './dist/index.mjs',
    types: './dist/index.d.ts',
    exports: {
      '.': { types: './dist/index.d.ts', import: './dist/index.mjs', require: './dist/index.js' },
      './theme.css': './theme.css',
    },
  }),
  'theme.css': THEME,
  'dist/index.mjs': 'export function Button() {}\nexport function Card() {}\n',
  'dist/index.js': 'exports.Button = function Button() {};\n',
  'dist/index.d.ts': TYPES,
};

/** The same package with the config `init` writes, declared in its package.json and published. */
const DECLARED: Record<string, string> = {
  ...PACKAGE,
  'package.json': json({
    ...(JSON.parse(PACKAGE['package.json'] ?? '{}') as Record<string, unknown>),
    files: ['dist', 'theme.css', 'onsystem.config.json'],
    onsystem: './onsystem.config.json',
  }),
  'onsystem.config.json': json({
    components: ['src/**/*.tsx'],
    importPath: '@acme/ui',
    tokens: ['theme.css'],
  }),
};

/** One mistake per rule, and a polymorphic `<Text>` that renders a link. */
const PAGE = `import { Badge, Button, ChevronLeft, Text } from "@acme/ui";

export default function Page() {
  return (
    <main>
      <div className="bg-blue-500">Color</div>
      <div className="p-[13px]">Spacing</div>
      <div className="rounded-[7px]">Radius</div>
      <input name="q" />
      <Badge>New</Badge>
      <Button tone="quiet">Save</Button>
      <Button variant="danger">Delete</Button>
      <Button><svg /></Button>
      <button aria-label="Back"><ChevronLeft /></button>
      <Text component="a" href="/docs" size="sm" onClick={() => undefined}>Docs</Text>
    </main>
  );
}
`;

const at = (prefix: string, files: Record<string, string>) =>
  Object.fromEntries(Object.entries(files).map(([file, text]) => [`${prefix}/${file}`, text]));

/**
 * An app named `name` that installs `pkg` as `@acme/ui`, with React's and cva's types (the demo's
 * installed packages). `extra` adds or replaces files.
 */
function app(
  pkg: Record<string, string>,
  { name = 'web', extra = {} }: { name?: string; extra?: Record<string, string> } = {},
): string {
  return fixture(
    {
      'package.json': json({ name, dependencies: { '@acme/ui': '1.0.0', react: '19.0.0' } }),
      'tsconfig.json': TSCONFIG,
      'app/page.tsx': PAGE,
      'app/globals.css': '@import "@acme/ui/theme.css";\n',
      ...at('node_modules/@acme/ui', pkg),
      ...extra,
    },
    { nodeModules: true },
  );
}

async function run(args: string[], cwd: string) {
  const out: string[] = [];
  const err: string[] = [];
  const io: Io = { cwd, color: false, stdout: (t) => out.push(t), stderr: (t) => err.push(t) };
  const code = await main(args, io);
  return { code, stdout: out.join('\n'), stderr: err.join('\n') };
}

type Results = { diagnostics: { ruleId: string; line: number; message: string }[] }[];

async function check(cwd: string) {
  const { code, stdout, stderr } = await run(
    ['check', 'app/page.tsx', '--format', 'json', '--no-cache'],
    cwd,
  );
  const findings = (JSON.parse(stdout) as Results).flatMap((r) => r.diagnostics);
  return { code, findings, stderr };
}

/** Calls one MCP tool on the app's design system. */
async function tool(root: string, name: string, args: Record<string, unknown>): Promise<string> {
  const ds = await load(root);
  const server = createServer({ getDesignSystem: () => Promise.resolve(ds) });
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  try {
    const result = (await client.callTool({ name, arguments: args })) as CallToolResult;
    const first = result.content[0];
    return first?.type === 'text' ? first.text : '';
  } finally {
    await client.close();
  }
}

const NOTICE = 'No design-system components found: the component rules did not run.';

/** What `check` reports on PAGE once the package's components are known, by rule and line. */
const EVERY_RULE = [
  ['no-hardcoded-color', 6],
  ['no-hardcoded-spacing', 7],
  ['no-hardcoded-radius', 8],
  ['prefer-design-system-component', 9],
  ['no-unknown-component', 10],
  ['no-unknown-prop', 11],
  ['no-unknown-variant', 12],
  ['icon-button-accessible-name', 13],
  ['prefer-design-system-component', 14],
];

const ruleAndLine = (findings: { ruleId: string; line: number }[]) =>
  findings.map((d) => [d.ruleId, d.line]).sort((a, b) => Number(a[1]) - Number(b[1]));

describe('a design-system package published as dist/ and type declarations alone', () => {
  it('is read from its declarations when it declares its config: every rule runs in the app', async () => {
    const root = app(DECLARED);
    const { findings, stderr } = await check(root);
    expect(stderr).not.toContain(NOTICE);
    expect(ruleAndLine(findings)).toEqual(EVERY_RULE);
    expect(new Set(findings.map((d) => d.ruleId))).toEqual(new Set(RULE_IDS));
    const message = (rule: string) => findings.find((d) => d.ruleId === rule)?.message ?? '';
    expect(message('no-unknown-variant')).toContain(
      '"danger" is not a valid variant for <Button>. Allowed: default, outline, destructive.',
    );
    expect(message('no-unknown-prop')).toContain('<Button> has no prop "tone"');
    expect(message('no-unknown-component')).toContain('"Badge" is not a design-system component');
    expect(findings.find((d) => d.line === 9)?.message).toContain('<Input>');

    const inspect = await run(['inspect', '--no-cache'], root);
    expect(inspect.stdout).toContain(
      'library  Design-system package (@acme/ui 1.0.0): 10 components from its type declarations',
    );
    // --require-design-system finds the design system (exit code 2 would say it did not).
    const required = await run(['check', '.', '--require-design-system', '--no-cache'], root);
    expect(required.code).toBe(1);
  });

  it('gives agents its components, props and variants over MCP', async () => {
    const root = app(DECLARED);
    const button = await tool(root, 'get_component', { name: 'Button' });
    expect(button).toContain('The primary action of a form or dialog.');
    expect(button).toContain('@acme/ui');
    expect(button).toMatch(/variant[^\n]*default[^\n]*outline[^\n]*destructive/);
    expect(button).toMatch(/size[^\n]*sm[^\n]*md[^\n]*lg/);
    expect(button).toContain('loading');
    expect(await tool(root, 'search_components', { query: 'card' })).toContain('Card');
  });

  it('is read when it is named like a design system in the app’s own scope, with no config', async () => {
    const root = app(PACKAGE, { name: '@acme/web' });
    const { findings, stderr } = await check(root);
    expect(stderr).not.toContain(NOTICE);
    expect(ruleAndLine(findings)).toEqual(EVERY_RULE);
    const explain = await run(['inspect', '--explain', '--no-cache'], root);
    expect(explain.stdout).toContain(
      'no     installed package @acme/ui: its exports point at build output (node_modules/@acme/ui/dist/index.mjs), not at component sources, and only sources are read; its components are read from its type declarations instead',
    );
    expect(explain.stdout).toContain(
      'found  @acme/ui 1.0.0: a dependency, 10 components from its type declarations in node_modules/@acme/ui',
    );
  });

  it('is not read without the config from another scope: a kit named like a design system is not the app’s', async () => {
    // Unscoped app, or another scope: as before, nothing is read from the package (its
    // stylesheet included), and only the accessibility rule runs.
    for (const name of ['web', '@other/web']) {
      const root = app(PACKAGE, { name });
      const { findings, stderr } = await check(root);
      expect(stderr).toContain('No design system found (no components or color tokens)');
      expect(findings).toEqual([]);
      expect((await load(root)).config.libraries).toEqual([]);
    }
    // A kit with a design-system name in another scope (`@react-email/components`).
    const kit = JSON.parse(PACKAGE['package.json'] ?? '{}') as Record<string, unknown>;
    const root = fixture(
      {
        'package.json': json({
          name: '@acme/web',
          dependencies: { '@react-email/components': '1.0.0' },
        }),
        'tsconfig.json': TSCONFIG,
        'app/page.tsx': PAGE.replaceAll('@acme/ui', '@react-email/components'),
        ...at('node_modules/@react-email/components', {
          ...PACKAGE,
          'package.json': json({ ...kit, name: '@react-email/components' }),
        }),
      },
      { nodeModules: true },
    );
    const ds = await load(root);
    expect(ds.model.components).toEqual([]);
    expect(ds.config.libraries).toEqual([]);
  });

  it('is read from its sources, not its declarations, when it publishes them', async () => {
    const withSources = {
      ...DECLARED,
      'src/button.tsx':
        'export function Button(props: { variant?: "default" | "outline" }) { return <button /> }\n',
      'src/card.tsx': 'export function Card(props: { children?: unknown }) { return <div /> }\n',
      'src/input.tsx': 'export function Input(props: { name?: string }) { return <input /> }\n',
    };
    const ds = await load(app(withSources, { name: '@acme/web' }));
    expect(ds.config.libraries).toEqual([]);
    expect(ds.model.components.map((c) => [c.name, c.library])).toEqual([
      ['Button', undefined],
      ['Card', undefined],
      ['Input', undefined],
    ]);
  });

  it('is read from its declarations when its build output is JSX, which is compiled', async () => {
    const ds = await load(
      app({ ...DECLARED, 'dist/button.jsx': 'export function Button() { return <button /> }\n' }),
    );
    expect(ds.config.libraries?.map((l) => l.package)).toEqual(['@acme/ui']);
    expect(ds.model.components.find((c) => c.name === 'Button')?.library).toBe('@acme/ui');
  });

  it('is left out with "libraries": false', async () => {
    const root = app(DECLARED, {
      extra: { 'onsystem.config.json': json({ libraries: false }) },
    });
    const ds = await load(root);
    expect(ds.config.libraries).toEqual([]);
    expect(ds.config.librariesOff?.map((l) => l.package)).toEqual(['@acme/ui']);
    expect(ds.model.components).toEqual([]);
    const inspect = await run(['inspect', '--no-cache'], root);
    expect(inspect.stdout).toContain(
      'library  Design-system package (@acme/ui 1.0.0): left out by "libraries" in onsystem.config.json',
    );
  });

  it('reads components, not every capitalised export, with their parts and elements', async () => {
    const ds = await load(app(DECLARED));
    const byName = new Map(ds.model.components.map((c) => [c.name, c]));
    expect([...byName.keys()].sort()).toEqual([
      'Button',
      'Card',
      'CardHeader',
      'Checkbox',
      'CheckboxGroup',
      'ChevronLeft',
      'Input',
      'Tab',
      'Tabs',
      'Text',
    ]);
    // A function that returns a string, a class without `render` and an object are no
    // components, but they are exports: importing them is not inventing them.
    expect(ds.model.exports).toEqual(expect.arrayContaining(['Cookies', 'Format', 'Theme']));
    // Parts of a bundle's one file go by name, as for source components.
    expect(byName.get('CardHeader')?.parent).toBe('Card');
    expect(byName.get('Tabs')?.parent).toBeUndefined();
    expect(byName.get('CheckboxGroup')?.parent).toBeUndefined();
    // Elements from the `ref`, or the DOM attributes a function component takes.
    expect(byName.get('Button')?.element).toBe('button');
    expect(byName.get('Input')?.element).toBe('input');
    expect(byName.get('Card')?.element).toBe('div');
    // cva's variants, though `class-variance-authority/dist/types` is not in cva's exports.
    const button = byName.get('Button');
    expect(button?.openProps).toBe(false);
    expect(button?.variants.map((v) => [v.name, v.values])).toEqual([
      ['variant', ['default', 'outline', 'destructive']],
      ['size', ['sm', 'md', 'lg']],
    ]);
    expect(button?.library).toBe('@acme/ui');
    expect(button?.importPath).toBe('@acme/ui');
    expect(button?.source.file).toBe('node_modules/@acme/ui/dist/index.d.ts');
    // Props that depend on what a generic `component` renders are not all known.
    expect(byName.get('Text')?.openProps).toBe(true);
  });

  it('is read from where pnpm installs it, through the link in node_modules', async () => {
    const store = 'node_modules/.pnpm/@acme+ui@1.0.0/node_modules/@acme/ui';
    const root = app({}, { extra: at(store, DECLARED) });
    fs.mkdirSync(path.join(root, 'node_modules/@acme'), { recursive: true });
    fs.symlinkSync(path.join(root, store), path.join(root, 'node_modules/@acme/ui'), 'junction');
    const { findings } = await check(root);
    expect(ruleAndLine(findings)).toEqual(EVERY_RULE);
    const ds = await load(root);
    expect(ds.model.components.find((c) => c.name === 'Button')?.source.file).toBe(
      'node_modules/@acme/ui/dist/index.d.ts',
    );
  });
});
