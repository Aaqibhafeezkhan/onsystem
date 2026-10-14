import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { main, type Io } from '../src/cli.js';
import { isWorkspaceRoot, pnpmPackages, workspacePatterns } from '../src/detect.js';
import { loadTarget } from '../src/workspace.js';
import { fixture, TSCONFIG } from './helpers.js';

const json = (value: unknown) => JSON.stringify(value, null, 2);

async function run(args: string[], cwd: string) {
  const out: string[] = [];
  const err: string[] = [];
  const io: Io = { cwd, color: false, stdout: (t) => out.push(t), stderr: (t) => err.push(t) };
  const code = await main(args, io);
  return { code, stdout: out.join('\n'), stderr: err.join('\n') };
}

/** What pnpm 11 writes into a single app: settings, no `packages` (create-next-app --use-pnpm). */
const SETTINGS_ONLY = 'allowBuilds:\n  sharp: false\n  unrs-resolver: false\n';

/** A stock create-next-app app: no components yet, its theme in app/globals.css. */
const NEXT_APP = {
  'package.json': json({
    name: 'next-plain',
    private: true,
    dependencies: { next: '16.0.0', react: '19.2.0', 'react-dom': '19.2.0' },
    devDependencies: { tailwindcss: '^4', typescript: '^5' },
  }),
  'tsconfig.json': TSCONFIG,
  'app/globals.css': `@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}
`,
  'app/layout.tsx':
    'import "./globals.css";\nexport default function RootLayout({ children }: { children: unknown }) { return <html lang="en"><body className="antialiased">{children}</body></html> }\n',
  'app/page.tsx':
    'export default function Home() { return <main className="bg-background text-foreground">Get started</main> }\n',
};

/**
 * A design-system package installed from a registry that declares its onsystem config, laid
 * out like Dub's `@dub/ui`: `exports` point at `dist/`, read from the `src/index.tsx` barrel.
 */
const INSTALLED_KIT = {
  'node_modules/@acme/kit/package.json': json({
    name: '@acme/kit',
    version: '1.0.0',
    files: ['dist/**'],
    exports: { '.': { types: './dist/index.d.ts', import: './dist/index.mjs' } },
    onsystem: './onsystem.config.json',
  }),
  'node_modules/@acme/kit/onsystem.config.json': json({ tokens: ['src/globals.css'] }),
  'node_modules/@acme/kit/src/index.tsx':
    'export * from "./button";\nexport * from "./card";\nexport * from "./input";\n',
  'node_modules/@acme/kit/src/button.tsx':
    'export function Button(props: { variant?: "default" | "outline"; children?: unknown }) { return <button /> }\n',
  'node_modules/@acme/kit/src/card.tsx':
    'export function Card(props: { children?: unknown }) { return <div /> }\n',
  'node_modules/@acme/kit/src/input.tsx':
    'export function Input(props: { value?: string }) { return <input /> }\n',
  'node_modules/@acme/kit/src/globals.css': ':root {\n  --primary: oklch(0.55 0.2 260);\n}\n',
};

/** `inspect` without the time it took. */
async function inspect(root: string): Promise<string> {
  const { stdout } = await run(['inspect', '--no-cache'], root);
  return stdout.replace(/^time .*\n/m, '');
}

describe('a pnpm-workspace.yaml that lists no packages', () => {
  it('is not a workspace root; one with a packages list is', () => {
    const root = (yaml: string) =>
      fixture({ 'package.json': json({ name: 'app' }), 'pnpm-workspace.yaml': yaml });
    expect(isWorkspaceRoot(root(SETTINGS_ONLY))).toBe(false);
    expect(isWorkspaceRoot(root(`packages: []\n${SETTINGS_ONLY}`))).toBe(false);
    expect(isWorkspaceRoot(root(`${SETTINGS_ONLY}packages:\n  - apps/*\n`))).toBe(true);
    expect(isWorkspaceRoot(root('packages: [apps/*, packages/*]\n'))).toBe(true);
  });

  it('is not a workspace root when its packages name only the root', () => {
    const root = (yaml: string) =>
      fixture({ 'package.json': json({ name: 'app' }), 'pnpm-workspace.yaml': yaml });
    // pnpm 9's workaround for settings in a single app; pnpm 11 lists the root alone.
    expect(isWorkspaceRoot(root(`packages:\n  - '.'\n${SETTINGS_ONLY}`))).toBe(false);
    expect(isWorkspaceRoot(root("packages: ['./']\n"))).toBe(false);
    expect(isWorkspaceRoot(root("packages:\n  - .\n  - '!apps/*'\n"))).toBe(false);
    // The root and more, as onsystem's own pnpm-workspace.yaml has it.
    expect(isWorkspaceRoot(root('packages:\n  - .\n  - examples/*\n  - site\n'))).toBe(true);
  });

  it('reads a packages key that is quoted or follows a byte order mark', () => {
    expect(pnpmPackages('\uFEFFpackages:\n  - apps/*\n')).toEqual(['apps/*']);
    expect(pnpmPackages('"packages":\n  - apps/*\n')).toEqual(['apps/*']);
    expect(pnpmPackages("'packages': [apps/*, packages/*]\n")).toEqual(['apps/*', 'packages/*']);
    expect(pnpmPackages('"packages\':\n  - apps/*\n')).toEqual([]);
    const root = (yaml: string) =>
      fixture({ 'package.json': json({ name: 'root' }), 'pnpm-workspace.yaml': yaml });
    expect(isWorkspaceRoot(root('\uFEFFpackages:\n  - apps/*\n'))).toBe(true);
    expect(isWorkspaceRoot(root('"packages":\n  - apps/*\n'))).toBe(true);
  });

  it('leaves package.json workspaces to declare the packages', async () => {
    const root = fixture({
      'package.json': json({ name: 'root', private: true, workspaces: ['packages/*'] }),
      'pnpm-workspace.yaml': SETTINGS_ONLY,
      'packages/ui/package.json': json({ name: '@acme/ui' }),
      'packages/ui/src/button.tsx':
        'export function Button(props: { variant?: "default" | "outline" }) { return <button /> }\n',
      'packages/web/package.json': json({ name: 'web' }),
    });
    expect(isWorkspaceRoot(root)).toBe(true);
    expect(workspacePatterns(root)).toEqual({
      include: ['packages/*'],
      exclude: [],
      source: 'package.json workspaces',
    });
    const { workspace } = await loadTarget({ root });
    expect(workspace?.source).toBe('package.json workspaces');
    const out = await inspect(root);
    expect(out).toContain('(package.json workspaces)');
    expect(out).not.toContain('pnpm-workspace.yaml');
  });

  it('leaves a single app one project, read as it is without the file', async () => {
    const root = fixture(NEXT_APP);
    const without = await inspect(root);
    expect(without).toMatch(/Tokens \(\d+\)/);

    fs.writeFileSync(path.join(root, 'pnpm-workspace.yaml'), SETTINGS_ONLY);
    expect((await loadTarget({ root })).workspace).toBeUndefined();
    const withFile = await inspect(root);
    expect(withFile).not.toContain('workspace 0 packages');
    expect(withFile).toBe(without);
  });

  it('gives init the same answer as without the file, not a monorepo root of 0 packages', async () => {
    const plain = fixture(NEXT_APP);
    const pnpm11 = fixture({ ...NEXT_APP, 'pnpm-workspace.yaml': SETTINGS_ONLY });
    const result = async (root: string) => {
      const { code, stdout, stderr } = await run(['init', '--yes', '--no-cache'], root);
      return { code, stdout, stderr: stderr.replaceAll(root, '<root>') };
    };
    const expected = await result(plain);
    expect(expected.stderr).toContain('init: zero config found no design system in <root>.');
    const actual = await result(pnpm11);
    expect(actual.stdout).not.toContain('monorepo root');
    expect(actual).toEqual(expected);
    expect(fs.existsSync(path.join(pnpm11, 'onsystem.config.json'))).toBe(false);
  });

  it('keeps the design system that an installed package declares', async () => {
    const root = fixture({
      'package.json': json({ name: 'shop', dependencies: { '@acme/kit': '^1.0.0' } }),
      ...INSTALLED_KIT,
      'app/page.tsx':
        'import { Button } from "@acme/kit";\nexport default () => <Button variant="danger">Go</Button>;\n',
    });
    const without = await inspect(root);
    expect(without).toContain(
      `config   ${path.join('node_modules', '@acme', 'kit', 'onsystem.config.json')} (declared by @acme/kit)`,
    );
    expect(without).toContain('detected installed package @acme/kit');

    fs.writeFileSync(path.join(root, 'pnpm-workspace.yaml'), SETTINGS_ONLY);
    expect(await inspect(root)).toBe(without);
    const check = await run(
      ['check', '.', '--format', 'json', '--no-cache', '--require-design-system'],
      root,
    );
    expect(check.code).toBe(1);
    type Results = { file: string; diagnostics: { ruleId: string; message: string }[] }[];
    expect(
      (JSON.parse(check.stdout) as Results).flatMap((r) =>
        r.diagnostics.map((d) => `${r.file} ${d.ruleId}: ${d.message}`),
      ),
    ).toEqual([
      'app/page.tsx no-unknown-variant: "danger" is not a valid variant for <Button>. Allowed: default, outline.',
    ]);
  });
});
