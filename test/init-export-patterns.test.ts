import fs from 'node:fs';
import path from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { describe, expect, it } from 'vitest';

import { main, type Io } from '../src/cli.js';
import { serveStdio } from '../src/server/stdio.js';
import { silentLogger } from '../src/util/log.js';
import { fixture } from './helpers.js';

const json = (value: unknown) => JSON.stringify(value, null, 2);

async function run(args: string[], cwd: string) {
  const out: string[] = [];
  const err: string[] = [];
  const io: Io = { cwd, color: false, stdout: (t) => out.push(t), stderr: (t) => err.push(t) };
  const code = await main(args, io);
  return { code, stdout: out.join('\n'), stderr: err.join('\n') };
}

type Results = { file: string; diagnostics: { ruleId: string; message: string }[] }[];

const cva = (name: string, tag: string, variants: string[]) =>
  `import { cva, type VariantProps } from "class-variance-authority"
const ${name.toLowerCase()}Variants = cva("inline-flex", { variants: { variant: { ${variants.map((v) => `${v}: "${v}"`).join(', ')} } }, defaultVariants: { variant: "${variants[0] ?? ''}" } })
export function ${name}({ className, variant, ...props }: React.ComponentProps<"${tag}"> & VariantProps<typeof ${name.toLowerCase()}Variants>) { return <${tag} className={${name.toLowerCase()}Variants({ variant, className })} {...props} /> }
`;

/**
 * shadcn/ui's monorepo template, without the package's components.json: `packages/ui` exports
 * its components by a pattern, and an app imports each one by its own subpath.
 */
const TEMPLATE = {
  'pnpm-workspace.yaml': 'packages:\n  - apps/*\n  - packages/*\n',
  'package.json': json({ name: 'monorepo', private: true }),
  'packages/ui/package.json': json({
    name: '@workspace/ui',
    version: '0.0.0',
    type: 'module',
    private: true,
    exports: {
      './globals.css': './src/styles/globals.css',
      './postcss.config': './postcss.config.mjs',
      './lib/*': './src/lib/*.ts',
      './components/*': './src/components/*.tsx',
      './hooks/*': './src/hooks/*.ts',
    },
  }),
  'packages/ui/postcss.config.mjs': 'export default {}\n',
  'packages/ui/src/lib/utils.ts': 'export function cn(...c: string[]) { return c.join(" ") }\n',
  'packages/ui/src/hooks/use-mobile.ts': 'export function useMobile() { return false }\n',
  'packages/ui/src/styles/globals.css': ':root {\n  --primary: oklch(0.2 0 0);\n}\n',
  'packages/ui/src/components/button.tsx': cva('Button', 'button', ['default', 'outline']),
  'packages/ui/src/components/badge.tsx': cva('Badge', 'span', ['default', 'secondary']),
  'packages/ui/src/components/input.tsx':
    'export function Input(props: React.ComponentProps<"input">) { return <input {...props} /> }\n',
  'apps/web/package.json': json({
    name: 'web',
    dependencies: { '@workspace/ui': 'workspace:*' },
  }),
  'apps/web/app/page.tsx':
    'import { Button } from "@workspace/ui/components/button"\nexport default () => <><Button variant="danger">Go</Button><button>Back</button></>\n',
};

describe('init in a package that exports its components by a pattern', () => {
  it('writes no importPath, so apps keep importing each component by its own subpath', async () => {
    const root = fixture(TEMPLATE);
    const ui = path.join(root, 'packages/ui');
    const app = path.join(root, 'apps/web');

    const init = await run(['init', '--yes', '--no-cache'], ui);
    expect(init.code).toBe(0);
    expect(init.stdout).toContain(
      'Found the design system through package.json exports of @workspace/ui.',
    );
    const config = JSON.parse(
      fs.readFileSync(path.join(ui, 'onsystem.config.json'), 'utf8'),
    ) as Record<string, unknown>;
    // "@workspace/ui/components/*" is a pattern, not an import that compiles.
    expect(config).not.toHaveProperty('importPath');
    expect(config).toMatchObject({
      components: ['src/components/**/*.tsx'],
      tokens: ['src/styles/globals.css'],
    });

    // The app takes on the package's config and is told the import that compiles.
    const { stdout } = await run(['check', '.', '--format', 'json', '--no-cache'], app);
    const messages = (JSON.parse(stdout) as Results).flatMap((r) =>
      r.diagnostics.map((d) => d.message),
    );
    expect(messages).toContain(
      'Native <button> where the design system has <Button>. Use <Button> (import { Button } from "@workspace/ui/components/button").',
    );
    // An import by the subpath is the design system's Button, so its API is checked.
    expect(messages).toContain(
      '"danger" is not a valid variant for <Button>. Allowed: default, outline.',
    );
    expect(messages.join('\n')).not.toContain('@workspace/ui/components/*');

    // The MCP server started in the app gives agents the same import.
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const server = await serveStdio({
      cwd: app,
      cache: false,
      watch: false,
      logger: silentLogger,
      transport: serverTransport,
    });
    const client = new Client({ name: 'init-export-patterns-test', version: '1.0.0' });
    await client.connect(clientTransport);
    const result = (await client.callTool({
      name: 'get_component',
      arguments: { name: 'Button', path: 'app/page.tsx' },
    })) as CallToolResult;
    const content = result.content[0];
    const text = content?.type === 'text' ? content.text : '';
    expect(text).toContain('import { Button } from "@workspace/ui/components/button"');
    expect(text).not.toContain('@workspace/ui/components/*');
    await client.close();
    await server.close();
  });
});
