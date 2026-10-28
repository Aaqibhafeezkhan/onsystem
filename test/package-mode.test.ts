import fs from 'node:fs';
import path from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { afterAll, describe, expect, it } from 'vitest';

import { main, type Io } from '../src/cli.js';
import { createServer } from '../src/server/index.js';
import { renderNotFound } from '../src/server/render.js';
import { fixture, load } from './helpers.js';

// An app reading a design-system package's config: a package whose tokens are a Tailwind theme
// partial, an import through a subpath export that has no file, an app whose package publishes
// no sources, and what `init` publishes for the apps' teams.

const json = (value: unknown) => JSON.stringify(value, null, 2);

async function run(args: string[], cwd: string) {
  const out: string[] = [];
  const err: string[] = [];
  const io: Io = { cwd, color: false, stdout: (t) => out.push(t), stderr: (t) => err.push(t) };
  const code = await main(args, io);
  return { code, stdout: out.join('\n'), stderr: err.join('\n') };
}

type Results = { diagnostics: { ruleId: string; line: number; message: string }[] }[];

/** What `check app/page.tsx` reports in `cwd`. */
async function findings(cwd: string) {
  const { stdout } = await run(['check', 'app/page.tsx', '--format', 'json', '--no-cache'], cwd);
  return (JSON.parse(stdout) as Results).flatMap((r) => r.diagnostics);
}

/**
 * A Tailwind v4 library's theme partial: the app imports Tailwind, so the partial does not, and
 * it sets four radii of the eight Tailwind has, and no spacing unit.
 */
const PARTIAL = `:root {
  --primary: oklch(0.55 0.2 260);
  --radius: 0.5rem;
}

@theme inline {
  --color-primary: var(--primary);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
`;

const NORTHWIND = {
  'package.json': json({
    name: '@northwind/ui',
    version: '1.4.0',
    files: ['dist', 'src', 'theme.css', 'onsystem.config.json'],
    exports: { '.': './src/index.ts', './theme.css': './theme.css' },
    peerDependencies: { tailwindcss: '^4.0.0' },
    onsystem: './onsystem.config.json',
  }),
  'onsystem.config.json': json({ importPath: '@northwind/ui', tokens: ['theme.css'] }),
  'theme.css': PARTIAL,
  'src/index.ts': 'export * from "./button";\n',
  'src/button.tsx':
    'export function Button(props: { children?: unknown }) { return <button className="p-4" /> }\n',
};

const SPACED = `import { Button } from "@northwind/ui";

export default function Page() {
  return <Button>Save</Button>;
}

export const Box = () => <div className="p-[13px]">Box</div>;
`;
const OFF_SCALE = 'Hardcoded spacing `p-[13px]` (13px) is off the scale. Nearest: `p-3` (12px).';

/** A create-next-app app on Tailwind v4 that installs `@northwind/ui`. */
function nextApp(devDependencies: Record<string, string> = { tailwindcss: '^4' }) {
  return fixture({
    'package.json': json({
      name: 'web',
      dependencies: { '@northwind/ui': '1.4.0', next: '16.0.0' },
      devDependencies,
    }),
    'app/globals.css': '@import "tailwindcss";\n@import "@northwind/ui/theme.css";\n',
    'app/page.tsx': SPACED,
    ...Object.fromEntries(
      Object.entries(NORTHWIND).map(([file, text]) => [`node_modules/@northwind/ui/${file}`, text]),
    ),
  });
}

describe('a design-system package whose tokens are a Tailwind theme partial', () => {
  it("keeps Tailwind's spacing unit and radius scale in an app on Tailwind v4", async () => {
    const app = nextApp();
    const ds = await load(app);
    expect(ds.config.designSystemPackage?.name).toBe('@northwind/ui');
    const spacing = ds.tokens.filter((t) => t.category === 'spacing');
    expect(spacing.map((t) => [t.cssVar, t.value])).toEqual([['--spacing', '0.25rem']]);
    // Tailwind's eight radii, four of them as the partial sets them.
    const radii = ds.tokens.filter((t) => t.category === 'radius');
    expect(radii.map((t) => [t.tailwind, t.origin === 'tailwind-default'])).toEqual([
      ['sm', false],
      ['md', false],
      ['lg', false],
      ['xl', false],
      ['xs', true],
      ['2xl', true],
      ['3xl', true],
      ['4xl', true],
    ]);
    const all = await findings(app);
    expect(all.filter((d) => d.ruleId === 'no-hardcoded-spacing').map((d) => d.message)).toEqual([
      OFF_SCALE,
    ]);
  });

  it('does the same from a workspace package', async () => {
    const root = fixture({
      'pnpm-workspace.yaml': 'packages:\n  - apps/*\n  - packages/*\n',
      'package.json': json({ name: 'northwind', private: true }),
      ...Object.fromEntries(
        Object.entries(NORTHWIND).map(([file, text]) => [`packages/ui/${file}`, text]),
      ),
      'apps/web/package.json': json({
        name: 'web',
        dependencies: { '@northwind/ui': 'workspace:*' },
        devDependencies: { '@tailwindcss/postcss': '^4', tailwindcss: '^4' },
      }),
      'apps/web/app/page.tsx': SPACED,
    });
    const all = await findings(path.join(root, 'apps/web'));
    expect(all.filter((d) => d.ruleId === 'no-hardcoded-spacing').map((d) => d.message)).toEqual([
      OFF_SCALE,
    ]);
  });

  it('adds nothing in an app that does not depend on Tailwind', async () => {
    const ds = await load(nextApp({}));
    expect(ds.tokens.filter((t) => t.category === 'spacing')).toEqual([]);
    expect(ds.tokens.filter((t) => t.category === 'radius')).toHaveLength(4);
  });

  it("adds no spacing unit when the partial clears Tailwind's", async () => {
    const app = nextApp();
    fs.writeFileSync(
      path.join(app, 'node_modules/@northwind/ui/theme.css'),
      PARTIAL.replace('@theme inline {', '@theme inline {\n  --spacing-*: initial;'),
    );
    const ds = await load(app);
    expect(ds.tokens.filter((t) => t.category === 'spacing')).toEqual([]);
  });
});

/**
 * A monorepo whose `@acme/ui` exports each component file by a subpath pattern, as shadcn/ui's
 * monorepo template does, and its icons from `dist/`, not built yet.
 */
const ACME = {
  'pnpm-workspace.yaml': 'packages:\n  - apps/*\n  - packages/*\n',
  'package.json': json({ name: 'acme', private: true }),
  'packages/ui/package.json': json({
    name: '@acme/ui',
    version: '0.0.0',
    private: true,
    exports: {
      './components/icons': './dist/icons/index.js',
      './components/*': './src/components/*.tsx',
      './styles.css': './src/styles.css',
    },
  }),
  'packages/ui/src/components/button.tsx':
    'export function Button(props: { variant?: "default" | "outline"; children?: unknown }) { return <button /> }\n',
  'packages/ui/src/components/input.tsx':
    'export function Input(props: { name?: string }) { return <input /> }\n',
  'packages/ui/src/styles.css':
    '@import "tailwindcss";\n:root {\n  --primary: oklch(0.55 0.2 260);\n}\n@theme inline {\n  --color-primary: var(--primary);\n}\n',
  'apps/web/package.json': json({ name: 'web', dependencies: { '@acme/ui': 'workspace:*' } }),
};

const SUBPATHS = `import { Button } from "@acme/ui/components/button";
import { Tooltip } from "@acme/ui/components/tooltip";
import { StarIcon } from "@acme/ui/components/icons";

export default function Page() {
  return (
    <Button>
      <Tooltip>Save</Tooltip>
      <StarIcon />
    </Button>
  );
}
`;

describe('an import through a subpath export with no file behind it', () => {
  it('is an unknown component when the export maps it onto a source file', async () => {
    const root = fixture({ ...ACME, 'apps/web/app/page.tsx': SUBPATHS });
    const ds = await load(path.join(root, 'apps/web'));
    const result = ds.check(SUBPATHS, 'app/page.tsx');
    expect(
      result.diagnostics
        .filter((d) => d.ruleId === 'no-unknown-component')
        .map((d) => [d.line, d.message]),
    ).toEqual([
      [
        8,
        '"Tooltip" is not a design-system component (imported from "@acme/ui/components/tooltip"). Use search_components to find an existing one.',
      ],
    ]);
    // The icons' own export, which comes first, leads to `dist/`, not built yet: StarIcon may
    // be real, so it is said to be unchecked.
    expect(result.unchecked).toEqual({
      names: ['StarIcon'],
      modules: ['@acme/ui/components/icons'],
    });
  });
});

function text(result: unknown): string {
  const content = (result as CallToolResult).content[0];
  return content?.type === 'text' ? content.text : '';
}

const clients: Client[] = [];
afterAll(async () => {
  for (const client of clients.splice(0)) await client.close();
});

/** `@northwind/ui` published with `dist/`, its tokens and its config, but no sources or declarations. */
const DIST_ONLY = {
  'package.json': json({
    name: '@northwind/ui',
    version: '1.4.0',
    files: ['dist', 'theme.css', 'onsystem.config.json'],
    exports: { '.': { import: './dist/index.js' }, './theme.css': './theme.css' },
    onsystem: './onsystem.config.json',
  }),
  'onsystem.config.json': json({
    components: ['src/**/*.tsx'],
    importPath: '@northwind/ui',
    tokens: ['theme.css'],
  }),
  'theme.css': PARTIAL,
  'dist/index.js': 'export function Button() {}\n',
};

describe('an app whose design-system package publishes no sources', () => {
  const app = () =>
    fixture({
      'package.json': json({ name: 'web', dependencies: { '@northwind/ui': '1.4.0' } }),
      'app/page.tsx': SPACED,
      ...Object.fromEntries(
        Object.entries(DIST_ONLY).map(([file, text]) => [
          `node_modules/@northwind/ui/${file}`,
          text,
        ]),
      ),
    });
  const REASON =
    '@northwind/ui publishes neither its component sources nor their type declarations, so its components are unknown here and the component rules did not run: ask its team to add its sources to "files" in its package.json, or to publish type declarations. The token rules still check against the tokens it publishes. See https://onsystem.vercel.app/docs/design-system-packages#what-apps-get';

  it('says why in list_components, not to check the components globs', async () => {
    const ds = await load(app());
    const server = createServer({ getDesignSystem: () => Promise.resolve(ds) });
    const client = new Client({ name: 'test-client', version: '1.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    clients.push(client);
    const listed = text(await client.callTool({ name: 'list_components', arguments: {} }));
    expect(listed).toBe(REASON);
    expect(listed).not.toContain('globs');
  });

  it('lists no "Available" names when there are none', () => {
    expect(String(renderNotFound('Button', undefined, []))).toBe('No component named "Button".');
  });

  it('says so in inspect --explain', async () => {
    const { stdout } = await run(['inspect', '--explain', '--no-cache'], app());
    expect(stdout).toContain(`  ${REASON}`);
  });
});

describe('init in a published design-system package', () => {
  it('publishes ONSYSTEM.md with the config, for the teams of apps that install it', async () => {
    const root = fixture({
      'package.json': json({
        name: '@northwind/ui',
        version: '1.4.0',
        files: ['dist', 'src', 'theme.css'],
        exports: { '.': './src/index.ts', './theme.css': './theme.css' },
      }),
      'theme.css': PARTIAL,
      'src/index.ts':
        'export * from "./button";\nexport * from "./card";\nexport * from "./input";\n',
      'src/button.tsx':
        'export function Button(props: { children?: unknown }) { return <button /> }\n',
      'src/card.tsx': 'export function Card(props: { children?: unknown }) { return <div /> }\n',
      'src/input.tsx': 'export function Input(props: { name?: string }) { return <input /> }\n',
    });
    const init = await run(['init', '--yes', '--no-cache'], root);
    expect(init.code).toBe(0);
    expect(fs.existsSync(path.join(root, 'ONSYSTEM.md'))).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as {
      files: string[];
    };
    expect(manifest.files).toEqual([
      'dist',
      'src',
      'theme.css',
      'onsystem.config.json',
      'ONSYSTEM.md',
    ]);
  });
});
