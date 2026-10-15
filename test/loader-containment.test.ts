import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { main, type Io } from '../src/cli.js';
import { loadConfig } from '../src/config.js';
import { buildModel, type DesignSystem } from '../src/design-system.js';
import { createServer } from '../src/server/index.js';
import { serveStdio } from '../src/server/stdio.js';
import { silentLogger } from '../src/util/log.js';
import { toPosix } from '../src/util/paths.js';
import { fixture, load } from './helpers.js';

// Made-up values: what a cloned repository must not be able to read through the tools.
const SECRET = 'FAKEsecretNOTreal0000';

/** Files elsewhere on the machine: a home folder's credentials, a token, a stylesheet, a component. */
function elsewhere(): string {
  return fixture({
    '.aws/credentials': `[default]\naws_access_key_id = AKIAFAKE0000\naws_secret_access_key = ${SECRET}\n`,
    '.npmrc': `FAKE_TOKEN=${SECRET}\n`,
    'theme.css': ':root { --leak: #123456; }\n',
    'secret.tsx': `/** ${SECRET} */\nexport function Secret() { return <span /> }\n`,
  });
}

const COMPONENT = (name: string) => `export function ${name}() { return <span /> }\n`;

/** A relative link, as a repository commits it and `git clone` restores it. */
function link(target: string, at: string): void {
  fs.mkdirSync(path.dirname(at), { recursive: true });
  fs.symlinkSync(path.relative(path.dirname(at), target), at);
}

function text(result: unknown): string {
  const content = (result as CallToolResult).content[0];
  return content?.type === 'text' ? content.text : '';
}

async function connect(ds: DesignSystem) {
  const server = createServer({ getDesignSystem: () => Promise.resolve(ds) });
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return client;
}

async function run(args: string[], cwd: string) {
  const out: string[] = [];
  const io: Io = { cwd, color: false, stdout: (t) => out.push(t), stderr: () => undefined };
  const code = await main(args, io);
  return { code, stdout: out.join('\n') };
}

describe('design-system files that lead outside the project', () => {
  it('does not return a linked file as the docs of a component, with zero config', async () => {
    const outside = elsewhere();
    const root = fixture({
      'package.json': JSON.stringify({ name: 'starter' }),
      'components/ui/credentials.tsx': COMPONENT('Credentials'),
    });
    link(path.join(outside, '.aws/credentials'), path.join(root, 'components/ui/credentials.md'));
    const ds = await load(root);
    expect(ds.model.stats.files.docs).toBe(0);
    expect(ds.model.warnings.join('\n')).toContain(
      'Not read: components/ui/credentials.md leads outside the project.',
    );
    const client = await connect(ds);
    try {
      const result = await client.callTool({
        name: 'get_component',
        arguments: { name: 'Credentials' },
      });
      expect(result.isError).toBeFalsy();
      expect(JSON.stringify(result)).not.toContain(SECRET);
    } finally {
      await client.close();
    }
  });

  it('reads none of the paths outside the project that a JSON config names, when found from a path', async () => {
    const outside = elsewhere();
    const root = fixture({
      'package.json': JSON.stringify({ name: 'starter' }),
      'components/ui/credentials.tsx': COMPONENT('Credentials'),
      'app/globals.css': ':root { --primary: #2563eb; }\n',
      'app/page.tsx': 'export default () => <div />\n',
      'onsystem.config.json': JSON.stringify({
        // Fixtures are folders next to each other: `../dsm-fixture-…/*.tsx`.
        components: ['components/ui/**/*.tsx', `../${path.basename(outside)}/*.tsx`],
        docs: ['docs/**/*.md', toPosix(path.join(outside, '.aws/credentials'))],
        tokens: ['app/globals.css', toPosix(path.join(outside, '.npmrc'))],
      }),
    });
    link(path.join(outside, '.aws/credentials'), path.join(root, 'docs/credentials.md'));

    // Started outside any project, by a client without roots: the project comes from the path.
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'dsm-outside-'));
    const logged: string[] = [];
    const log = (message: string) => logged.push(message);
    const logger = { ...silentLogger, info: log, warn: log, error: log };
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const server = await serveStdio({
      cwd,
      cache: false,
      watch: false,
      logger,
      transport: serverTransport,
    });
    const client = new Client({ name: 'no-roots', version: '1.0.0' });
    await client.connect(clientTransport);
    try {
      const page = path.join(root, 'app/page.tsx');
      const credentials = await client.callTool({
        name: 'get_component',
        arguments: { name: 'Credentials', path: page },
      });
      expect(credentials.isError).toBeFalsy();
      expect(JSON.stringify(credentials)).not.toContain(SECRET);
      const listed = await client.callTool({ name: 'list_components', arguments: { path: page } });
      expect(text(listed)).toContain('Credentials');
      expect(text(listed)).not.toContain('Secret');
      const tokens = await client.callTool({ name: 'get_tokens', arguments: { path: page } });
      expect(text(tokens)).toContain('primary');
      expect(JSON.stringify(tokens)).not.toContain(SECRET);
      expect(logged.join('\n')).not.toContain(SECRET);
      const away = `../${path.basename(outside)}`;
      expect(logged.join('\n')).toContain(
        `Not read: ${away}/.aws/credentials, ${away}/.npmrc, ${away}/secret.tsx and docs/credentials.md lead outside the project.`,
      );
    } finally {
      await client.close();
      await server.close();
      fs.rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('reads no component or token stylesheet through a link that leaves the project', async () => {
    const outside = elsewhere();
    const root = fixture({
      'package.json': JSON.stringify({ name: 'starter' }),
      'components/ui/button.tsx': COMPONENT('Button'),
      'app/globals.css': '@import "./theme.css";\n:root { --primary: #2563eb; }\n',
    });
    link(path.join(outside, 'secret.tsx'), path.join(root, 'components/ui/secret.tsx'));
    link(path.join(outside, 'theme.css'), path.join(root, 'app/theme.css'));
    link(path.join(outside, 'theme.css'), path.join(root, 'styles/globals.css'));
    const ds = await load(root);
    expect(ds.components.map((c) => c.name)).toEqual(['Button']);
    expect(ds.tokens.map((t) => t.name)).toContain('primary');
    expect(ds.tokens.map((t) => t.name)).not.toContain('leak');
    expect(ds.model.warnings).toContain(
      "Not read: app/theme.css, components/ui/secret.tsx and styles/globals.css lead outside the project. Links resolved, the design system's files must be in the project, the workspace or git repository it is in, a package installed in their node_modules, or a package that declares its config (run onsystem init in it).",
    );
  });

  it('keeps links inside the project, its workspace and installed packages, each file once', async () => {
    // pnpm's store, outside the project: node_modules/@acme/tokens links to it.
    const store = fixture({
      'node_modules/.pnpm/@acme+tokens@1.0.0/node_modules/@acme/tokens/package.json':
        JSON.stringify({ name: '@acme/tokens', version: '1.0.0' }),
      'node_modules/.pnpm/@acme+tokens@1.0.0/node_modules/@acme/tokens/theme.css':
        ':root { --brand: #7c3aed; }\n',
    });
    const workspace = fixture({
      'package.json': JSON.stringify({ name: 'monorepo', private: true }),
      'pnpm-workspace.yaml': 'packages:\n  - apps/*\n  - packages/*\n',
      'packages/ui/package.json': JSON.stringify({ name: '@acme/ui' }),
      'packages/ui/src/card.tsx': COMPONENT('Card'),
      'apps/web/package.json': JSON.stringify({ name: 'web' }),
      'apps/web/components/ui/button.tsx': COMPONENT('Button'),
      'apps/web/onsystem.config.json': JSON.stringify({
        components: ['components/ui/**/*.tsx', '../../packages/ui/src/*.tsx'],
        tokens: ['node_modules/@acme/tokens/theme.css'],
      }),
    });
    const root = path.join(workspace, 'apps/web');
    fs.mkdirSync(path.join(root, 'node_modules/@acme'), { recursive: true });
    fs.symlinkSync(
      path.join(store, 'node_modules/.pnpm/@acme+tokens@1.0.0/node_modules/@acme/tokens'),
      path.join(root, 'node_modules/@acme/tokens'),
      'junction',
    );
    // A link to a sibling package, and a folder that links back to its parent: a loop.
    link(path.join(workspace, 'packages/ui/src'), path.join(root, 'components/ui/shared'));
    fs.symlinkSync(
      path.join(root, 'components/ui'),
      path.join(root, 'components/ui/loop'),
      'junction',
    );
    const config = await loadConfig({ root });
    const { model } = await buildModel(config, { cache: false });
    expect(model.components.map((c) => c.name).sort()).toEqual(['Button', 'Card']);
    expect(model.sources?.sort()).toEqual([
      '../../packages/ui/src/card.tsx',
      'components/ui/button.tsx',
    ]);
    expect(model.tokens.map((t) => t.name)).toContain('brand');
    expect(model.warnings.join('\n')).not.toContain('outside the project');
  });

  it("does not read another project's installed package through a link in the project", async () => {
    const other = fixture({
      'node_modules/private-pkg/package.json': JSON.stringify({ name: 'private-pkg' }),
      'node_modules/private-pkg/credentials.md': `# Credentials\n\n${SECRET}\n`,
    });
    const root = fixture({
      'package.json': JSON.stringify({ name: 'starter' }),
      'components/ui/credentials.tsx': COMPONENT('Credentials'),
    });
    link(
      path.join(other, 'node_modules/private-pkg/credentials.md'),
      path.join(root, 'components/ui/credentials.md'),
    );
    const ds = await load(root);
    expect(ds.model.stats.files.docs).toBe(0);
    expect(JSON.stringify(ds.model)).not.toContain(SECRET);
    expect(ds.model.warnings.join('\n')).toContain(
      'Not read: components/ui/credentials.md leads outside the project.',
    );
  });

  it('reads files elsewhere in the git repository the project is in', async () => {
    const repository = fixture({
      '.git/HEAD': 'ref: refs/heads/main\n',
      'shared/ui/card.tsx': COMPONENT('Card'),
      'web/package.json': JSON.stringify({ name: 'web' }),
      'web/onsystem.config.json': JSON.stringify({ components: ['../shared/ui/*.tsx'] }),
    });
    const ds = await load(path.join(repository, 'web'));
    expect(ds.components.map((c) => c.name)).toEqual(['Card']);
    expect(ds.model.warnings.join('\n')).not.toContain('outside the project');
  });

  it('reads a package linked from elsewhere (npm link) only when it declares its config', async () => {
    const sources = {
      'src/button.tsx': COMPONENT('Button'),
      'src/card.tsx': COMPONENT('Card'),
      'src/input.tsx': COMPONENT('Input'),
    };
    const exports = {
      './button': './src/button.tsx',
      './card': './src/card.tsx',
      './input': './src/input.tsx',
    };
    const declared = fixture({
      ...sources,
      'package.json': JSON.stringify({
        name: '@acme/kit',
        exports,
        onsystem: './onsystem.config.json',
      }),
      'onsystem.config.json': JSON.stringify({ components: ['src/*.tsx'] }),
    });
    const undeclared = fixture({
      ...sources,
      'package.json': JSON.stringify({ name: '@acme/ui', exports }),
    });
    const app = (name: string, dir: string) => {
      const root = fixture({
        'package.json': JSON.stringify({ name: 'shop', dependencies: { [name]: '^1.0.0' } }),
      });
      fs.mkdirSync(path.join(root, 'node_modules/@acme'), { recursive: true });
      fs.symlinkSync(dir, path.join(root, 'node_modules', name), 'junction');
      return root;
    };

    const withConfig = await load(app('@acme/kit', declared));
    expect(withConfig.config.designSystemPackage?.name).toBe('@acme/kit');
    expect(withConfig.components.map((c) => c.name).sort()).toEqual(['Button', 'Card', 'Input']);

    const zeroConfig = await load(app('@acme/ui', undeclared));
    expect(zeroConfig.config.detected).toBe('workspace package @acme/ui');
    expect(zeroConfig.components).toEqual([]);
    const away = `../${path.basename(undeclared)}`;
    expect(zeroConfig.model.warnings.join('\n')).toContain(
      `Not read: ${away}/src/button.tsx, ${away}/src/card.tsx and ${away}/src/input.tsx lead outside the project.`,
    );
  });

  it('check lints a file reached through linked folders once', async () => {
    const root = fixture({
      'components/ui/button.tsx': COMPONENT('Button'),
      'app/globals.css': ':root { --primary: #2563eb; }\n',
      'app/settings/members.tsx': 'export default () => <div className="bg-[#2563eb]" />\n',
    });
    fs.symlinkSync(path.join(root, 'app'), path.join(root, 'app/settings/loop'), 'junction');
    const { stdout } = await run(['check', '.', '--format', 'json', '--no-cache'], root);
    const files = (JSON.parse(stdout) as { file: string }[]).map((r) => r.file);
    expect(files).toEqual(['app/settings/members.tsx']);
  });
});

describe('the files left out, as the cached model names them', () => {
  it('rebuilds when a link that leads outside the project is removed or added', async () => {
    const outside = elsewhere();
    const root = fixture({
      'package.json': JSON.stringify({ name: 'starter' }),
      'components/ui/credentials.tsx': COMPONENT('Credentials'),
    });
    // The cache is kept in node_modules/.cache/onsystem.
    fs.mkdirSync(path.join(root, 'node_modules'));
    const credentials = path.join(root, 'components/ui/credentials.md');
    link(path.join(outside, '.aws/credentials'), credentials);
    const config = await loadConfig({ root });
    const notRead = (warnings: string[]) => warnings.filter((w) => w.startsWith('Not read:'));

    const first = await buildModel(config);
    expect(first.model.stats.fromCache).toBe(false);
    expect(notRead(first.model.warnings).join('\n')).toContain('components/ui/credentials.md');
    expect((await buildModel(config)).model.stats.fromCache).toBe(true);

    fs.unlinkSync(credentials);
    const removed = await buildModel(config);
    expect(removed.model.stats.fromCache).toBe(false);
    expect(notRead(removed.model.warnings)).toEqual([]);

    link(path.join(outside, '.npmrc'), path.join(root, 'components/ui/notes.md'));
    const added = await buildModel(config);
    expect(added.model.stats.fromCache).toBe(false);
    expect(notRead(added.model.warnings)).toEqual([
      expect.stringContaining('Not read: components/ui/notes.md leads outside the project.'),
    ]);
  });
});

describe('a home folder that looks like a workspace or a repository', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("is not a boundary a package's config may reach, with a stray workspace manifest", async () => {
    const home = fixture({
      'package.json': JSON.stringify({ name: 'dotfiles', private: true, workspaces: ['code/*'] }),
      '.git/HEAD': 'ref: refs/heads/main\n',
      '.aws/credentials': `[default]\naws_secret_access_key = ${SECRET}\n`,
      // A cloned repository with no config of its own and a package of its own that declares one.
      'code/repo/package.json': JSON.stringify({
        name: 'starter',
        dependencies: { 'evil-ds': '1.0.0' },
      }),
      'code/repo/packages/evil-ds/package.json': JSON.stringify({
        name: 'evil-ds',
        version: '1.0.0',
        onsystem: './onsystem.config.json',
      }),
      'code/repo/packages/evil-ds/onsystem.config.json': JSON.stringify({
        components: ['src/*.tsx'],
        docs: ['../../../../.aws/credentials'],
      }),
      'code/repo/packages/evil-ds/src/credentials.tsx': COMPONENT('Credentials'),
    });
    vi.spyOn(os, 'homedir').mockReturnValue(home);
    const root = path.join(home, 'code/repo');
    link(path.join(root, 'packages/evil-ds'), path.join(root, 'node_modules/evil-ds'));

    const ds = await load(root);
    expect(ds.config.designSystemPackage?.name).toBe('evil-ds');
    expect(ds.components.map((c) => c.name)).toEqual(['Credentials']);
    expect(ds.model.stats.files.docs).toBe(0);
    expect((ds.config.warnings ?? []).join('\n')).toContain(
      "evil-ds's onsystem config names paths outside the workspace, which were ignored: docs ../../../../.aws/credentials.",
    );
    const client = await connect(ds);
    try {
      const result = await client.callTool({
        name: 'get_component',
        arguments: { name: 'Credentials' },
      });
      expect(result.isError).toBeFalsy();
      expect(JSON.stringify(result)).not.toContain(SECRET);
    } finally {
      await client.close();
    }
  });

  it('is not the workspace or repository a link may lead into', async () => {
    const home = fixture({
      'package.json': JSON.stringify({ name: 'dotfiles', private: true, workspaces: ['code/*'] }),
      '.git/HEAD': 'ref: refs/heads/main\n',
      '.aws/credentials': `[default]\naws_secret_access_key = ${SECRET}\n`,
      'code/repo/package.json': JSON.stringify({ name: 'starter' }),
      'code/repo/components/ui/credentials.tsx': COMPONENT('Credentials'),
    });
    vi.spyOn(os, 'homedir').mockReturnValue(home);
    const root = path.join(home, 'code/repo');
    link(path.join(home, '.aws/credentials'), path.join(root, 'components/ui/credentials.md'));

    const ds = await load(root);
    expect(ds.model.stats.files.docs).toBe(0);
    expect(JSON.stringify(ds.model)).not.toContain(SECRET);
    expect(ds.model.warnings.join('\n')).toContain(
      'Not read: components/ui/credentials.md leads outside the project.',
    );
  });
});
