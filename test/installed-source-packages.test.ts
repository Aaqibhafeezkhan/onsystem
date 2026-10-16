import fs from 'node:fs';
import path from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { describe, expect, it } from 'vitest';

import { main, type Io } from '../src/cli.js';
import { createServer } from '../src/server/index.js';
import { fixture, load, TSCONFIG } from './helpers.js';

// An app that installs its design system from a registry, with no config anywhere: zero config
// reads the package when it is named like a design system and publishes its component sources.

const json = (value: unknown) => JSON.stringify(value, null, 2);

const BUTTON =
  'export function Button(props: { variant?: "default" | "outline"; children?: unknown }) { return <button /> }\n';
const CARD = 'export function Card(props: { children?: unknown }) { return <div /> }\n';
const INPUT = 'export function Input(props: { name?: string }) { return <input /> }\n';

/**
 * Laid out like Comp AI's `@trycompai/design-system`, which publishes `src/` and no build:
 * `.` leads to a barrel of barrels, `./components/*` to a folder that holds only a barrel, and
 * `./globals.css` to its stylesheet, which imports Tailwind, a plugin and a partial of its own.
 */
const PACKAGE = {
  'package.json': json({
    name: '@acme/design-system',
    version: '1.1.0',
    type: 'module',
    main: './src/index.ts',
    exports: {
      '.': { types: './src/index.ts', import: './src/index.ts', default: './src/index.ts' },
      './components/*': {
        types: './src/components/ui/*.tsx',
        import: './src/components/ui/*.tsx',
      },
      './cn': './lib/utils.ts',
      './globals.css': './src/styles/globals.css',
    },
    files: ['src', 'lib'],
  }),
  'lib/utils.ts': 'export function cn(...classes: string[]) { return classes.join(" "); }\n',
  'src/index.ts': 'export { cn } from "../lib/utils";\nexport * from "./components/ui";\n',
  'src/components/ui/index.ts': 'export * from "../atoms";\nexport * from "../molecules";\n',
  'src/components/atoms/index.ts': 'export * from "./button";\nexport * from "./input";\n',
  'src/components/atoms/button.tsx': BUTTON,
  'src/components/atoms/input.tsx': INPUT,
  'src/components/molecules/index.ts': 'export * from "./card";\n',
  'src/components/molecules/card.tsx': CARD,
  'src/styles/globals.css':
    "@import 'tailwindcss';\n@import 'tw-animate-css';\n@import './theme.css';\n@import '../../../../tailwindcss/index.css';\n\n:root {\n  --primary: oklch(0.55 0.2 260);\n}\n\n@theme inline {\n  --color-primary: var(--primary);\n}\n",
  'src/styles/theme.css':
    ':root {\n  --muted: oklch(0.97 0 0);\n}\n\n@theme inline {\n  --color-muted: var(--muted);\n  --radius-card: 0.625rem;\n}\n',
};

/** Installed packages whose stylesheets must not be read as the design system's. */
const OTHERS = {
  'node_modules/tailwindcss/package.json': json({
    name: 'tailwindcss',
    exports: { '.': { style: './index.css' }, './index.css': './index.css' },
  }),
  'node_modules/tailwindcss/index.css':
    '@theme {\n  --color-red-500: oklch(0.64 0.21 25);\n  --spacing: 0.25rem;\n}\n',
  'node_modules/tw-animate-css/package.json': json({
    name: 'tw-animate-css',
    exports: { '.': { style: './dist/tw-animate.css' } },
  }),
  'node_modules/tw-animate-css/dist/tw-animate.css': '@theme {\n  --animate-spin: spin 1s;\n}\n',
};

const PAGE = `import { Button, Card } from "@acme/design-system";

export default function Page() {
  return (
    <Card>
      <Button variant="danger">Delete</Button>
      <input name="q" />
      <div className="bg-blue-500">New</div>
    </Card>
  );
}
`;

const at = (prefix: string, files: Record<string, string>) =>
  Object.fromEntries(Object.entries(files).map(([file, text]) => [`${prefix}/${file}`, text]));

/** The app, with the package as npm installs it. */
function npmApp(extra: Record<string, string> = {}): string {
  return fixture({
    'package.json': json({
      name: 'web',
      dependencies: { '@acme/design-system': '^1.1.0', tailwindcss: '^4.0.0' },
    }),
    'app/globals.css': '@import "tailwindcss";\n@import "@acme/design-system/globals.css";\n',
    'app/page.tsx': PAGE,
    ...at('node_modules/@acme/design-system', PACKAGE),
    ...OTHERS,
    ...extra,
  });
}

/** Where pnpm puts the package, and its own dependencies beside it. */
const STORE = 'node_modules/.pnpm/@acme+design-system@1.1.0/node_modules';

/** pnpm's layout: node_modules/@acme/design-system links to the package in `store`. */
function linkPackage(root: string, store: string): void {
  fs.mkdirSync(path.join(root, 'node_modules/@acme'), { recursive: true });
  fs.symlinkSync(
    path.join(store, STORE, '@acme/design-system'),
    path.join(root, 'node_modules/@acme/design-system'),
    'junction',
  );
}

/**
 * The package's Button with its props from a dependency, which pnpm installs beside the package
 * and not in the app's node_modules.
 */
const WITH_PRIMITIVE = {
  [`${STORE}/@acme/design-system/src/components/atoms/button.tsx`]:
    'import type { PrimitiveProps } from "@acme/primitive";\nexport function Button(props: PrimitiveProps & { variant?: "default" | "outline" }) { return <button /> }\n',
  [`${STORE}/@acme/primitive/package.json`]: json({ name: '@acme/primitive', types: 'index.d.ts' }),
  [`${STORE}/@acme/primitive/index.d.ts`]:
    'export interface PrimitiveProps { render?: string; children?: unknown }\n',
};

async function run(args: string[], cwd: string) {
  const out: string[] = [];
  const err: string[] = [];
  const io: Io = { cwd, color: false, stdout: (t) => out.push(t), stderr: (t) => err.push(t) };
  const code = await main(args, io);
  return { code, stdout: out.join('\n'), stderr: err.join('\n') };
}

type Results = { file: string; diagnostics: { ruleId: string; message: string }[] }[];

async function findings(cwd: string, file = 'app/page.tsx'): Promise<string[]> {
  const { stdout } = await run(['check', file, '--format', 'json', '--no-cache'], cwd);
  return (JSON.parse(stdout) as Results).flatMap((r) =>
    r.diagnostics.map((d) => `${d.ruleId}: ${d.message}`),
  );
}

async function getComponent(root: string, name: string): Promise<string> {
  const ds = await load(root);
  const server = createServer({ getDesignSystem: () => Promise.resolve(ds) });
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  try {
    const result = (await client.callTool({
      name: 'get_component',
      arguments: { name },
    })) as CallToolResult;
    const first = result.content[0];
    return first?.type === 'text' ? first.text : '';
  } finally {
    await client.close();
  }
}

const tokenNames = async (root: string) => (await load(root)).tokens.map((t) => t.name);

/**
 * A chat widget kit named like a design system, laid out like `@copilotkit/react-ui` and
 * `@assistant-ui/react-ui`: its exports point at `dist/`, with `src/` published beside it for
 * its source maps, and its stylesheet compiled to `dist/index.css`.
 */
const KIT = {
  'package.json': json({
    name: '@acme/react-ui',
    version: '1.0.0',
    type: 'module',
    main: './dist/index.cjs',
    exports: {
      '.': { types: './dist/index.d.ts', import: './dist/index.mjs', require: './dist/index.cjs' },
      './styles.css': './dist/index.css',
      './styles/*': { default: './dist/styles/*' },
    },
    files: ['dist', 'src'],
  }),
  'dist/index.mjs':
    'export * from "./chat.mjs";\nexport { default as Thread } from "./thread.mjs";\n',
  'dist/index.cjs': 'module.exports = require("./chat.cjs");\n',
  'dist/index.css':
    ':root {\n  --kit-primary-color: rgb(28, 28, 28);\n  --kit-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);\n}\n',
  'dist/styles/theme.css': ':root {\n  --kit-accent: #6366f1;\n}\n',
  'src/index.tsx':
    'export * from "./chat";\nexport * from "./popup";\nexport { default as Thread } from "./thread";\n',
  'src/chat.tsx':
    'export function Chat(props: { labels?: { title?: string } }) { return <div /> }\n',
  'src/popup.tsx': 'export function Popup(props: { open?: boolean }) { return <div /> }\n',
  'src/thread.tsx':
    'function Root() { return <div /> }\nfunction Viewport() { return <div /> }\nexport default Object.assign(Root, { Viewport });\n',
  'src/styles.css': ':root {\n  --kit-primary-color: rgb(28, 28, 28);\n}\n',
};

/** A shadcn/ui app (components.json, components/ui) that also uses the kit. */
function shadcnApp(extra: Record<string, string> = {}): string {
  return fixture({
    'package.json': json({ name: 'web', dependencies: { '@acme/react-ui': '^1.0.0' } }),
    'tsconfig.json': TSCONFIG,
    'components.json': json({
      tailwind: { css: 'app/globals.css' },
      aliases: { components: '@/components', ui: '@/components/ui' },
    }),
    'components/ui/button.tsx': BUTTON,
    'components/ui/card.tsx': CARD,
    'components/ui/input.tsx': INPUT,
    'app/globals.css':
      '@import "tailwindcss";\n@import "@acme/react-ui/styles.css";\n@import "@acme/react-ui/styles/theme.css";\n\n:root {\n  --primary: oklch(0.55 0.2 260);\n}\n\n@theme inline {\n  --color-primary: var(--primary);\n}\n',
    'app/chat.tsx': `import { Chat, Thread } from "@acme/react-ui";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div>
      <Chat labels={{ title: "Help" }} />
      <Thread />
      <Button variant="danger">Close</Button>
      <button className="bg-[#1c1c1c]">Native</button>
    </div>
  );
}
`,
    ...extra,
  });
}

/** What an app's design system is made of: what it detected, its components and its tokens. */
async function contents(root: string) {
  const ds = await load(root);
  return {
    detected: ds.config.detected,
    components: ds.components.map((c) => c.name).sort(),
    tokens: ds.tokens.map((t) => `${t.name}: ${t.value}`).sort(),
  };
}

/** Token files from installed packages other than the design system. */
const OTHER_FILES = /node_modules\/(?:tailwindcss|tw-animate-css)\//;

describe('an installed design-system package that publishes its sources', () => {
  it('is read with zero config, through its exports and barrels', async () => {
    const root = npmApp();
    const ds = await load(root);
    expect(ds.config.detected).toBe('installed package @acme/design-system');
    expect(ds.components.map((c) => c.name).sort()).toEqual(['Button', 'Card', 'Input']);
    expect(ds.getComponent('Button')?.importPath).toBe('@acme/design-system');
    expect(ds.model.warnings.join('\n')).not.toContain('Not read');

    const explained = await run(['inspect', '--explain', '--no-cache'], root);
    expect(explained.stdout).toContain(
      'found  installed package @acme/design-system: node_modules/@acme/design-system, 3 component files',
    );
    expect(await getComponent(root, 'Button')).toContain(
      'import { Button } from "@acme/design-system"',
    );
  });

  it('gets the component and token rules in check', async () => {
    expect(await findings(npmApp())).toEqual(
      expect.arrayContaining([
        'no-unknown-variant: "danger" is not a valid variant for <Button>. Allowed: default, outline.',
        expect.stringMatching(/^prefer-design-system-component: .*<Input>/),
        expect.stringMatching(/^no-hardcoded-color: /),
      ]),
    );
  });

  it('reads its exported stylesheet and the partials it imports, never another package', async () => {
    const { tokens } = await load(npmApp());
    expect(tokens.map((t) => t.name)).toEqual(
      expect.arrayContaining(['primary', 'muted', 'radius-card']),
    );
    // Tailwind's own theme and a plugin's, which the stylesheet imports by name or by a path
    // out of the package, are not the design system.
    expect(tokens.filter((t) => OTHER_FILES.test(t.source.file)).map((t) => t.name)).toEqual([]);
  });

  it("follows the app stylesheet's @import into it when a config names only the components", async () => {
    const root = npmApp({
      'onsystem.config.json': json({
        components: ['node_modules/@acme/design-system/src/components/**/*.tsx'],
        importPath: '@acme/design-system',
      }),
    });
    const ds = await load(root);
    expect(ds.config.detected).toBeUndefined();
    expect(ds.tokens.map((t) => t.name)).toEqual(expect.arrayContaining(['primary', 'muted']));
    expect(ds.tokens.filter((t) => OTHER_FILES.test(t.source.file))).toEqual([]);
  });

  it('is read where pnpm installs it, so the props it takes from its own dependencies resolve', async () => {
    const root = fixture({
      'package.json': json({ name: 'web', dependencies: { '@acme/design-system': '^1.1.0' } }),
      'app/page.tsx': PAGE,
      ...at(`${STORE}/@acme/design-system`, PACKAGE),
      ...WITH_PRIMITIVE,
    });
    linkPackage(root, root);
    const ds = await load(root);
    expect(ds.config.detected).toBe('installed package @acme/design-system');
    expect(ds.model.sources).toContain(
      `${STORE}/@acme/design-system/src/components/atoms/button.tsx`,
    );
    const button = ds.getComponent('Button');
    expect(button?.props.map((p) => p.name)).toEqual(expect.arrayContaining(['render', 'variant']));
    expect(button?.openProps).toBeFalsy();
    expect(ds.tokens.map((t) => t.name)).toContain('primary');
  });

  it("is read through the app's node_modules when pnpm's store is elsewhere", async () => {
    const store = fixture({ ...at(`${STORE}/@acme/design-system`, PACKAGE), ...WITH_PRIMITIVE });
    const root = fixture({
      'package.json': json({ name: 'web', dependencies: { '@acme/design-system': '^1.1.0' } }),
      'app/page.tsx': PAGE,
    });
    linkPackage(root, store);
    const ds = await load(root);
    expect(ds.components.map((c) => c.name).sort()).toEqual(['Button', 'Card', 'Input']);
    expect(ds.model.sources).toContain(
      'node_modules/@acme/design-system/src/components/atoms/button.tsx',
    );
    expect(ds.tokens.map((t) => t.name)).toContain('muted');
    expect(ds.model.warnings.join('\n')).not.toContain('Not read');
    // Read through the link, the package's own dependencies, beside it in the store, do not
    // resolve: the props its Button takes from one are not known.
    const button = ds.getComponent('Button');
    expect(button?.props.map((p) => p.name)).toContain('variant');
    expect(button?.props.map((p) => p.name)).not.toContain('render');
  });

  it('is read from the workspace root, where npm hoists it', async () => {
    const workspace = fixture({
      'package.json': json({ name: 'acme', private: true, workspaces: ['apps/*'] }),
      'apps/web/package.json': json({
        name: 'web',
        dependencies: { '@acme/design-system': '^1.1.0' },
      }),
      'apps/web/app/page.tsx': PAGE,
      ...at('node_modules/@acme/design-system', PACKAGE),
    });
    const root = path.join(workspace, 'apps/web');
    const ds = await load(root);
    expect(ds.config.detected).toBe('installed package @acme/design-system');
    expect(ds.model.sources).toContain(
      '../../node_modules/@acme/design-system/src/components/atoms/button.tsx',
    );
    expect(ds.tokens.map((t) => t.name)).toEqual(expect.arrayContaining(['primary', 'muted']));
    expect(await findings(root)).toContain(
      'no-unknown-variant: "danger" is not a valid variant for <Button>. Allowed: default, outline.',
    );
  });
});

describe('installed packages zero config does not read', () => {
  it('says that a package whose exports point at build output exports no component source', async () => {
    // Three .jsx files in dist/: the build output is not read, even where it could be.
    const root = fixture({
      'package.json': json({ name: 'web', dependencies: { '@acme/ui': '^1.0.0' } }),
      'app/page.tsx': PAGE,
      'node_modules/@acme/ui/package.json': json({
        name: '@acme/ui',
        exports: { '.': { types: './dist/index.d.ts', import: './dist/index.mjs' } },
      }),
      'node_modules/@acme/ui/dist/index.mjs':
        'export * from "./button.jsx";\nexport * from "./card.jsx";\nexport * from "./input.jsx";\n',
      'node_modules/@acme/ui/dist/button.jsx': BUTTON,
      'node_modules/@acme/ui/dist/card.jsx': CARD,
      'node_modules/@acme/ui/dist/input.jsx': INPUT,
    });
    const ds = await load(root);
    expect(ds.config.detected).toBeUndefined();
    expect(ds.components).toEqual([]);
    const { stdout } = await run(['inspect', '--explain', '--no-cache'], root);
    expect(stdout).toContain(
      'no     installed package @acme/ui: its exports point at build output (node_modules/@acme/ui/dist/index.mjs), not at component sources, and only sources are read',
    );
    expect(stdout).not.toContain('is compiled');
  });

  it('leaves out a kit named like a design system whose exports point at dist/, with src/ published beside it', async () => {
    // In a shadcn/ui app, the kit adds no component, no token and no finding: the app reads
    // exactly what it reads without the kit installed.
    const root = shadcnApp(at('node_modules/@acme/react-ui', KIT));
    const bare = shadcnApp();
    expect(await contents(root)).toEqual(await contents(bare));
    expect((await contents(root)).detected).toBe(
      'components.json (ui: @/components/ui → components/ui)',
    );
    expect(await findings(root, 'app/chat.tsx')).toEqual(await findings(bare, 'app/chat.tsx'));
    const { stdout } = await run(['inspect', '--explain', '--no-cache'], root);
    expect(stdout).toContain(
      'no     installed package @acme/react-ui: its exports point at build output (node_modules/@acme/react-ui/dist/index.mjs, node_modules/@acme/react-ui/dist/index.css), not at component sources, and only sources are read',
    );
    // As the only candidate, it is not read either.
    const alone = fixture({
      'package.json': json({ name: 'web', dependencies: { '@acme/react-ui': '^1.0.0' } }),
      'app/globals.css': '@import "@acme/react-ui/styles.css";\n',
      'app/page.tsx': 'import { Chat } from "@acme/react-ui";\nexport default () => <Chat />;\n',
      ...at('node_modules/@acme/react-ui', KIT),
    });
    const ds = await load(alone);
    expect(ds.config.detected).toBeUndefined();
    expect(ds.components).toEqual([]);
    expect(ds.tokens.filter((t) => t.name.startsWith('kit-'))).toEqual([]);
  });

  it('takes no tokens from a stylesheet in the build folder of a package it reads', async () => {
    const manifest = JSON.parse(PACKAGE['package.json']) as {
      exports: Record<string, unknown>;
      files: string[];
    };
    const compiled = {
      'node_modules/@acme/design-system/package.json': json({
        ...manifest,
        exports: { ...manifest.exports, './styles.css': './dist/styles.css' },
        files: [...manifest.files, 'dist'],
      }),
      'node_modules/@acme/design-system/dist/styles.css':
        ':root {\n  --compiled: oklch(0.6 0.2 30);\n}\n',
      'node_modules/@acme/design-system/dist/partial.css':
        ':root {\n  --compiled-partial: oklch(0.6 0.2 90);\n}\n',
      // A source stylesheet that imports one from the build folder, by a relative path.
      'node_modules/@acme/design-system/src/styles/theme.css': `@import '../../dist/partial.css';\n${PACKAGE['src/styles/theme.css']}`,
    };
    const compiledNames = (names: string[]) => names.filter((n) => n.startsWith('compiled'));
    // Zero config: the exported stylesheets are the tokens, but the one in dist/.
    const names = await tokenNames(npmApp(compiled));
    expect(names).toEqual(expect.arrayContaining(['primary', 'muted', 'radius-card']));
    expect(compiledNames(names)).toEqual([]);
    // The app's own @import of it, by its export or by its path, is not followed either.
    const configured = npmApp({
      ...compiled,
      'app/globals.css':
        '@import "@acme/design-system/globals.css";\n@import "@acme/design-system/styles.css";\n@import "@acme/design-system/dist/partial.css";\n',
      'onsystem.config.json': json({
        components: ['node_modules/@acme/design-system/src/components/**/*.tsx'],
        importPath: '@acme/design-system',
      }),
    });
    const fromApp = await tokenNames(configured);
    expect(fromApp).toEqual(expect.arrayContaining(['primary', 'muted']));
    expect(compiledNames(fromApp)).toEqual([]);
  });

  it('leaves out a package that is not named like a design system', async () => {
    const root = fixture({
      'package.json': json({ name: 'web', dependencies: { '@acme/kit': '^1.1.0' } }),
      'app/page.tsx': PAGE,
      ...at(
        'node_modules/@acme/kit',
        Object.fromEntries(
          Object.entries(PACKAGE).map(([file, text]) => [
            file,
            file === 'package.json' ? text.replace('@acme/design-system', '@acme/kit') : text,
          ]),
        ),
      ),
    });
    const ds = await load(root);
    expect(ds.config.detected).toBeUndefined();
    expect(ds.components).toEqual([]);
  });

  it('does not follow an @import into an installed package that publishes no component source', async () => {
    const root = fixture({
      'package.json': json({ name: 'web', dependencies: { '@acme/ui': '^1.0.0' } }),
      'app/globals.css': '@import "@acme/ui/theme.css";\n',
      'node_modules/@acme/ui/package.json': json({
        name: '@acme/ui',
        exports: { '.': './dist/index.mjs', './theme.css': './dist/theme.css' },
      }),
      'node_modules/@acme/ui/dist/index.mjs': 'export function Button() {}\n',
      'node_modules/@acme/ui/dist/theme.css': ':root {\n  --brand: oklch(0.6 0.2 30);\n}\n',
    });
    expect(await tokenNames(root)).not.toContain('brand');
  });
});
