import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import * as nodeModule from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { describe, expect, it, vi } from 'vitest';

import { main, type Io } from '../src/cli.js';
import { loadConfig } from '../src/config.js';
import { buildModel, DesignSystemHost, tokenFiles } from '../src/design-system.js';
import { serveStdio } from '../src/server/stdio.js';
import { silentLogger } from '../src/util/log.js';
import { pathOf } from '../src/util/paths.js';
import { fixture } from './helpers.js';

function text(result: unknown): string {
  const content = (result as CallToolResult).content[0];
  return content?.type === 'text' ? content.text : '';
}

const CHIP = 'export function Chip(props: { tone?: "neutral" | "accent" }) { return <span /> }\n';

/** A project whose page passes a tone its Chip does not have: one `no-unknown-variant` error. */
function chipProject(name: string, files: Record<string, string> = {}) {
  return fixture({
    'package.json': JSON.stringify({ name }),
    'components/ui/chip.tsx': CHIP,
    'app/page.tsx': 'export default () => <Chip tone="loud" />;\n',
    ...files,
  });
}

/** Serves `options` over an in-memory transport to a 2025-era client without roots. */
async function serve(options: Omit<Parameters<typeof serveStdio>[0], 'transport'>) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = await serveStdio({ ...options, transport: serverTransport });
  const client = new Client({ name: 'c', version: '1.0.0' });
  await client.connect(clientTransport);
  return {
    call: (name: string, args: Record<string, unknown> = {}) =>
      client.callTool({ name, arguments: args }),
    read: async (uri: string) =>
      (await client.readResource({ uri })).contents.map((c) => ('text' in c ? c.text : '')),
    close: async () => {
      await client.close();
      await server.close();
    },
  };
}

describe('a config that is invalid when the server starts', () => {
  it('is read again on the next request once it is fixed', async () => {
    const project = chipProject('chips', {
      // A typo in a rule id: the config does not validate.
      'onsystem.config.json': JSON.stringify({ rules: { 'no-unknown-varient': 'off' } }),
    });
    const errors: string[] = [];
    const logger = { ...silentLogger, error: (message: string) => errors.push(message) };
    const served = await serve({ cwd: project, cache: false, watch: false, logger });

    const broken = await served.call('list_components');
    expect(broken.isError).toBe(true);
    expect(text(broken)).toContain('Invalid config');

    fs.writeFileSync(
      path.join(project, 'onsystem.config.json'),
      JSON.stringify({ rules: { 'no-unknown-variant': 'off' } }),
    );
    const fixed = await served.call('list_components');
    expect(fixed.isError).toBeFalsy();
    expect(text(fixed)).toContain('Chip');
    // The fixed config applies: the rule it turns off does not report.
    const checked = await served.call('check_ui', { path: 'app/page.tsx' });
    expect(checked.structuredContent).toMatchObject({ errorCount: 0 });
    expect(errors.some((line) => line.includes('Invalid config'))).toBe(true);
    await served.close();
  });

  it('in a project found from a path, is read again once it follows the advice', async () => {
    const failing = chipProject('failing', { 'onsystem.config.mjs': 'export default {};\n' });
    const other = chipProject('other');
    const served = await serve({
      cwd: fixture({}),
      cache: false,
      watch: false,
      logger: silentLogger,
    });

    const refused = await served.call('check_ui', { path: path.join(failing, 'app/page.tsx') });
    expect(refused.isError).toBe(true);
    expect(text(refused)).toContain('or use onsystem.config.json');

    // The project that failed is not one of the projects found: a call without a path answers
    // from the one that loaded.
    const checked = await served.call('check_ui', { path: path.join(other, 'app/page.tsx') });
    expect(checked.structuredContent).toMatchObject({ errorCount: 1 });
    const chip = await served.call('get_component', { name: 'Chip' });
    expect(chip.isError).toBeFalsy();
    expect(text(chip)).toContain('tone?: "neutral" | "accent"');

    // What the error said to do: a JSON config instead.
    fs.rmSync(path.join(failing, 'onsystem.config.mjs'));
    fs.writeFileSync(path.join(failing, 'onsystem.config.json'), '{}');
    const fixed = await served.call('check_ui', { path: path.join(failing, 'app/page.tsx') });
    expect(fixed.isError).toBeFalsy();
    expect(fixed.structuredContent).toMatchObject({ errorCount: 1 });
    await served.close();
  });
});

describe('a design system whose first build fails', () => {
  it('is built again by the next request', async () => {
    const config = await loadConfig({ root: chipProject('chips') });
    let calls = 0;
    const build: typeof buildModel = (c, o) =>
      ++calls === 1 ? Promise.reject(new Error('disk on fire')) : buildModel(c, o);
    const host = new DesignSystemHost(config, { cache: false, build });
    await expect(host.get()).rejects.toThrow('disk on fire');
    expect((await host.get()).getComponent('Chip')).toBeDefined();
    expect(calls).toBe(2);
  });
});

/**
 * A Node.js process that loads src/config.ts as the built CLI does, each source file compiled by
 * TypeScript as it is imported, and prints the severity of no-unknown-variant that an edited
 * CommonJS config gives, before and after the edit.
 */
const COMMONJS_RELOAD = `
import fs from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && specifier.endsWith('.js') && context.parentURL?.endsWith('.ts')) {
      const url = new URL(specifier.replace(/\\.js$/, '.ts'), context.parentURL);
      if (fs.existsSync(url)) return { url: url.href, format: 'module', shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (!url.startsWith('file:') || !url.endsWith('.ts')) return next(url, context);
    const { outputText } = ts.transpileModule(fs.readFileSync(new URL(url), 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2023,
        verbatimModuleSyntax: true,
      },
      fileName: fileURLToPath(url),
    });
    return { format: 'module', source: outputText, shortCircuit: true };
  },
});
const [config, root] = process.argv.slice(1);
const { loadConfig } = await import(config);
const severities = [];
for (const severity of ['off', 'warn']) {
  fs.writeFileSync(
    path.join(root, 'onsystem.config.js'),
    "module.exports = { rules: { 'no-unknown-variant': '" + severity + "' } };\\n",
  );
  severities.push((await loadConfig({ root })).rules['no-unknown-variant'].severity);
}
console.log(JSON.stringify(severities));
`;

describe('a config written in code, edited while the process runs', () => {
  const configs = [
    ['onsystem.config.mjs', 'export default'],
    ['onsystem.config.ts', 'export default'],
    // CommonJS, in a package without "type": "module". Vitest's module runner keeps no CommonJS
    // module in require's cache, as Node.js does: the test below runs this one in Node.js itself.
    ['onsystem.config.js', 'module.exports ='],
  ] as const;
  for (const [name, exported] of configs) {
    it(`is read again from ${name}`, async () => {
      const root = chipProject('chips');
      const file = path.join(root, name);
      const write = (severity: string) => {
        fs.writeFileSync(file, `${exported} { rules: { 'no-unknown-variant': '${severity}' } };\n`);
      };
      write('off');
      expect((await loadConfig({ root })).rules['no-unknown-variant'].severity).toBe('off');
      write('warn');
      expect((await loadConfig({ root })).rules['no-unknown-variant'].severity).toBe('warn');
    });
  }

  // module.registerHooks is in Node.js 22.15 and later.
  it.skipIf(!('registerHooks' in nodeModule))(
    'is read again from a CommonJS onsystem.config.js in Node.js, which keeps it in require.cache',
    () => {
      const root = chipProject('chips');
      const repo = path.resolve(import.meta.dirname, '..');
      const config = pathToFileURL(path.join(repo, 'src/config.ts')).href;
      const run = spawnSync(
        process.execPath,
        ['--input-type=module', '-e', COMMONJS_RELOAD, config, root],
        { cwd: repo, encoding: 'utf8', timeout: 60_000 },
      );
      expect(run.status, run.stderr).toBe(0);
      expect(JSON.parse(run.stdout)).toEqual(['off', 'warn']);
    },
  );

  it('reloads the rules the MCP server applies', async () => {
    const root = chipProject('chips');
    const file = path.join(root, 'onsystem.config.mjs');
    fs.writeFileSync(file, "export default { rules: { 'no-unknown-variant': 'off' } };\n");
    const served = await serve({ cwd: root, cache: false, watch: true, logger: silentLogger });
    const before = await served.call('check_ui', { path: 'app/page.tsx' });
    expect(before.structuredContent).toMatchObject({ errorCount: 0 });

    // Give the watcher a moment to attach before writing.
    await new Promise((r) => setTimeout(r, 100));
    fs.writeFileSync(file, "export default { rules: { 'no-unknown-variant': 'error' } };\n");
    await vi.waitFor(
      async () => {
        const after = await served.call('check_ui', { path: 'app/page.tsx' });
        expect(after.structuredContent).toMatchObject({ errorCount: 1 });
      },
      { timeout: 10_000, interval: 200 },
    );
    await served.close();
  }, 15_000);
});

/**
 * A folder of repositories, as `--root ${workspaceFolder}` names one when the editor has a parent
 * folder open: `a` with its own components and `b` with a DTCG token for the color `a` hard-codes.
 */
function folderOfRepos() {
  return fixture({
    'a/package.json': JSON.stringify({ name: 'a' }),
    'a/components/ui/chip.tsx': CHIP,
    'a/app/page.tsx': 'export default () => <Chip tone="loud" />;\n',
    'a/app/alert.tsx': 'export default () => <div className="bg-[#ef4444]" />;\n',
    'b/package.json': JSON.stringify({ name: 'b' }),
    'b/tokens/brand.tokens.json': JSON.stringify({
      danger: { $type: 'color', $value: '#ef4444' },
    }),
  });
}

describe('--root on a folder that holds projects but is none', () => {
  it("answers each request from the project of the path it names, never another one's tokens", async () => {
    const parent = folderOfRepos();
    const infos: string[] = [];
    const logger = { ...silentLogger, info: (message: string) => infos.push(message) };
    const served = await serve({
      cwd: fixture({}),
      root: parent,
      cache: false,
      watch: false,
      logger,
    });

    // Checked by a's own design system: the component rules run.
    const page = await served.call('check_ui', { path: path.join(parent, 'a/app/page.tsx') });
    expect(page.structuredContent).toMatchObject({ errorCount: 1 });
    expect(text(page)).toContain('"loud" is not a valid tone for <Chip>');
    // No fix cites the token of b, another project.
    const alert = await served.call('check_ui', { path: path.join(parent, 'a/app/alert.tsx') });
    expect(text(alert)).not.toContain('danger');
    expect(infos.join('\n')).toContain('holds no project');

    // Without a path: the one project found so far.
    const chip = await served.call('get_component', { name: 'Chip' });
    expect(text(chip)).toContain('tone?: "neutral" | "accent"');
    await served.close();
  });

  it('says to pass a path when no request has named one yet', async () => {
    const parent = folderOfRepos();
    const served = await serve({
      cwd: fixture({}),
      root: parent,
      cache: false,
      watch: false,
      logger: silentLogger,
    });
    const listed = await served.call('list_components');
    expect(listed.isError).toBe(true);
    expect(text(listed)).toContain('holds no project of its own');
    expect(text(listed)).toContain('Pass `path`');
    await served.close();
  });

  it('refuses a path outside the folder, and loads nothing from there', async () => {
    const parent = folderOfRepos();
    const elsewhere = chipProject('elsewhere');
    const served = await serve({
      cwd: fixture({}),
      root: parent,
      cache: false,
      watch: false,
      logger: silentLogger,
    });
    const outside = await served.call('get_component', {
      name: 'Chip',
      path: path.join(elsewhere, 'app/page.tsx'),
    });
    expect(outside.isError).toBe(true);
    expect(text(outside)).toContain(
      `is outside ${pathOf(parent)}, the folder the server answers for`,
    );
    expect(text(outside)).toContain('Pass the absolute path of a file inside it');
    expect(text(outside)).not.toContain('tone?:');
    // Nothing was loaded from it: without a path, there is still no project to answer from.
    const chip = await served.call('get_component', { name: 'Chip' });
    expect(chip.isError).toBe(true);
    expect(text(chip)).toContain('holds no project of its own');
    await served.close();
  });

  it('refuses a relative path, also once another project has answered', async () => {
    const parent = folderOfRepos();
    const served = await serve({
      cwd: fixture({}),
      root: parent,
      cache: false,
      watch: false,
      logger: silentLogger,
    });
    const code = 'export default () => <div className="bg-[#ef4444]" />;\n';
    // b answers first, with the token for the color the code hard-codes.
    const inB = await served.call('check_ui', { code, filename: path.join(parent, 'b/app/x.tsx') });
    expect(text(inB)).toContain('danger');

    for (const args of [
      { code, filename: 'a/app/new.tsx' },
      { code, filename: 'app/new.tsx' },
      { path: 'a/app/page.tsx' },
      { path: 'app/page.tsx' },
    ]) {
      const relative = await served.call('check_ui', args);
      expect(relative.isError, JSON.stringify(args)).toBe(true);
      expect(text(relative)).toContain('it is a relative path');
      expect(text(relative)).toContain('as the absolute path of the file you are editing');
      expect(text(relative)).not.toContain('danger');
    }
    await served.close();
  });

  it('names the projects, quoted, when requests have named more than one', async () => {
    const parent = fixture({
      'my app/package.json': JSON.stringify({ name: 'my-app' }),
      'my app/components/ui/chip.tsx': CHIP,
      'b/package.json': JSON.stringify({ name: 'b' }),
      'b/components/ui/chip.tsx': CHIP,
    });
    const served = await serve({
      cwd: fixture({}),
      root: parent,
      cache: false,
      watch: false,
      logger: silentLogger,
    });
    for (const dir of ['my app', 'b']) {
      const listed = await served.call('list_components', { path: path.join(parent, dir) });
      expect(listed.isError).toBeFalsy();
    }
    const chip = await served.call('get_component', { name: 'Chip' });
    expect(chip.isError).toBe(true);
    expect(text(chip)).toContain(
      `Requests have named files in 2 projects (${JSON.stringify(path.join(parent, 'my app'))}, ${path.join(parent, 'b')})`,
    );
    await served.close();
  });

  it('says to start the server for a project in the folder to use its JavaScript config', async () => {
    const parent = fixture({
      'my app/package.json': JSON.stringify({ name: 'my-app' }),
      'my app/components/ui/chip.tsx': CHIP,
      'my app/onsystem.config.mjs': 'export default {};\n',
      'b/package.json': JSON.stringify({ name: 'b' }),
    });
    const served = await serve({
      cwd: fixture({}),
      root: parent,
      cache: false,
      watch: false,
      logger: silentLogger,
    });
    const project = path.join(parent, 'my app');
    const refused = await served.call('list_components', { path: project });
    expect(refused.isError).toBe(true);
    expect(text(refused)).toContain(
      `${JSON.stringify(path.join(project, 'onsystem.config.mjs'))} was not run: the server was started for ${pathOf(parent)}`,
    );
    expect(text(refused)).toContain(`Start the server with --root ${JSON.stringify(project)}`);
    await served.close();
  });

  it('still serves a folder without a package.json that holds no other project', async () => {
    const root = fixture({ 'components/ui/chip.tsx': CHIP });
    const served = await serve({
      cwd: fixture({}),
      root,
      cache: false,
      watch: false,
      logger: silentLogger,
    });
    const listed = await served.call('list_components');
    expect(listed.isError).toBeFalsy();
    expect(text(listed)).toContain('Chip');
    await served.close();
  });
});

/**
 * `mono`, a pnpm workspace whose root config turns off the rule a page in `apps/web` breaks,
 * and whose `packages/secret` has a component and a token `apps/web` does not depend on.
 */
function monorepo() {
  return fixture({
    'package.json': JSON.stringify({ name: 'mono', private: true }),
    'pnpm-workspace.yaml': "packages:\n  - 'apps/*'\n  - 'packages/*'\n",
    'onsystem.config.json': JSON.stringify({ rules: { 'no-unknown-variant': 'off' } }),
    'packages/secret/package.json': JSON.stringify({ name: '@mono/secret' }),
    'packages/secret/components/ui/vault.tsx': 'export function Vault() { return <div /> }\n',
    'packages/secret/tokens/brand.tokens.json': JSON.stringify({
      danger: { $type: 'color', $value: '#ef4444' },
    }),
    'apps/web/package.json': JSON.stringify({ name: 'web' }),
    'apps/web/components/ui/chip.tsx': CHIP,
    'apps/web/app/page.tsx': 'export default () => <Chip tone="loud" />;\n',
    'apps/web/app/alert.tsx': 'export default () => <div className="bg-[#ef4444]" />;\n',
  });
}

describe('--root on a folder of a monorepo that holds its projects', () => {
  it("answers from the project in it, never from the monorepo root's config or packages", async () => {
    const mono = monorepo();
    const apps = path.join(mono, 'apps');
    const infos: string[] = [];
    const logger = { ...silentLogger, info: (message: string) => infos.push(message) };
    const served = await serve({
      cwd: fixture({}),
      root: apps,
      cache: false,
      watch: false,
      logger,
    });

    // The root config, which turns the rule off, does not apply.
    const page = await served.call('check_ui', { path: path.join(apps, 'web/app/page.tsx') });
    expect(page.structuredContent).toMatchObject({ errorCount: 1 });
    expect(text(page)).toContain('"loud" is not a valid tone for <Chip>');
    const alert = await served.call('check_ui', { path: path.join(apps, 'web/app/alert.tsx') });
    expect(text(alert)).not.toContain('danger');
    const listed = await served.call('list_components', { path: path.join(apps, 'web') });
    expect(text(listed)).toContain('Chip');
    expect(text(listed)).not.toContain('Vault');
    const all = await served.call('list_components');
    expect(text(all)).not.toContain('Vault');

    const secret = await served.call('get_component', {
      name: 'Vault',
      path: path.join(mono, 'packages/secret/components/ui/vault.tsx'),
    });
    expect(secret.isError).toBe(true);
    expect(text(secret)).toContain(`is outside ${pathOf(apps)}`);
    expect(infos).toContain(
      `using ${path.join(apps, 'web')}, the project of ${path.join(apps, 'web/app/page.tsx')}`,
    );
    expect(infos.join('\n')).not.toContain(`using ${mono},`);
    await served.close();
  });
});

const VAULT = 'export function Vault(props: { sealed?: boolean }) { return <div /> }\n';

/** A project outside the folder the server answers for: no answer may show its Vault. */
function vaultProject(files: Record<string, string> = {}) {
  return fixture({
    'package.json': JSON.stringify({ name: 'vault' }),
    'components/ui/vault.tsx': VAULT,
    'app/page.tsx': 'export default () => <Vault sealed />;\n',
    ...files,
  });
}

/** Links `at` to the folder `target`: a junction on Windows, which needs no rights to make. */
function link(target: string, at: string) {
  fs.symlinkSync(target, at, 'junction');
}

const SEALED_TOKEN = JSON.stringify({ 'vault-steel': { $type: 'color', $value: '#123456' } });

/**
 * Replaces the folder `dir`, which a running server watches, with a link to `target`. False where
 * the file system does not let a watched folder be moved.
 */
function replaceWithLink(dir: string, target: string): boolean {
  const moved = path.join(fixture({}), path.basename(dir));
  try {
    fs.renameSync(dir, moved);
  } catch (error) {
    if (['EPERM', 'EBUSY', 'EACCES'].includes((error as NodeJS.ErrnoException).code ?? '')) {
      return false;
    }
    throw error;
  }
  link(target, dir);
  // A change in the moved folder too, for a watcher that follows the folder rather than its path.
  fs.writeFileSync(path.join(moved, 'components/ui/moved.tsx'), 'export const moved = 1;\n');
  return true;
}

describe('--root on a folder of projects, with links and workspace packages that lead outside it', () => {
  const leads = (parent: string) =>
    `leads outside ${pathOf(parent)}, the folder the server answers for, through a link`;

  it('refuses a link in the folder to a project outside it', async () => {
    const parent = folderOfRepos();
    const linked = path.join(parent, 'vault');
    link(vaultProject(), linked);
    const served = await serve({
      cwd: fixture({}),
      root: parent,
      cache: false,
      watch: false,
      logger: silentLogger,
    });
    const page = path.join(linked, 'app/page.tsx');
    for (const [name, args] of [
      ['get_component', { name: 'Vault', path: page }],
      ['check_ui', { path: page }],
      ['check_ui', { code: '<Vault />', filename: path.join(linked, 'app/new.tsx') }],
      ['list_components', { path: linked }],
    ] as const) {
      const refused = await served.call(name, args);
      expect(refused.isError, `${name} ${JSON.stringify(args)}`).toBe(true);
      expect(text(refused)).toContain(leads(parent));
      expect(text(refused)).not.toContain('sealed');
    }
    // Nothing was loaded from it: without a path, there is still no project to answer from.
    const vault = await served.call('get_component', { name: 'Vault' });
    expect(vault.isError).toBe(true);
    expect(text(vault)).toContain('holds no project of its own');
    await served.close();
  });

  it('refuses a link in the folder to a monorepo outside it', async () => {
    const parent = folderOfRepos();
    const linked = path.join(parent, 'mono');
    link(monorepo(), linked);
    const served = await serve({
      cwd: fixture({}),
      root: parent,
      cache: false,
      watch: false,
      logger: silentLogger,
    });
    for (const [name, args] of [
      ['list_components', { path: path.join(linked, 'apps/web') }],
      ['get_component', { name: 'Vault', path: path.join(linked, 'packages/secret') }],
      ['search_components', { query: 'vault', path: path.join(linked, 'apps/web/app/page.tsx') }],
    ] as const) {
      const refused = await served.call(name, args);
      expect(refused.isError, `${name} ${JSON.stringify(args)}`).toBe(true);
      expect(text(refused)).toContain(leads(parent));
      expect(text(refused)).not.toContain('Chip');
    }
    const listed = await served.call('list_components');
    expect(listed.isError).toBe(true);
    expect(text(listed)).toContain('holds no project of its own');
    await served.close();
  });

  it('refuses a linked folder in a project, and keeps answering from the project', async () => {
    const parent = folderOfRepos();
    link(vaultProject(), path.join(parent, 'a/vendor'));
    const infos: string[] = [];
    const logger = { ...silentLogger, info: (message: string) => infos.push(message) };
    const served = await serve({
      cwd: fixture({}),
      root: parent,
      cache: false,
      watch: false,
      logger,
    });
    const page = await served.call('check_ui', { path: path.join(parent, 'a/app/page.tsx') });
    expect(page.structuredContent).toMatchObject({ errorCount: 1 });

    const refused = await served.call('get_component', {
      name: 'Vault',
      path: path.join(parent, 'a/vendor/app/page.tsx'),
    });
    expect(refused.isError).toBe(true);
    expect(text(refused)).toContain(leads(parent));
    expect(text(refused)).not.toContain('sealed');
    expect(infos.join('\n')).not.toContain(`using ${path.join(parent, 'a/vendor')},`);
    // Without a path: a, still the one project found.
    const chip = await served.call('get_component', { name: 'Chip' });
    expect(text(chip)).toContain('tone?: "neutral" | "accent"');
    const vault = await served.call('get_component', { name: 'Vault' });
    expect(vault.isError).toBe(true);
    expect(text(vault)).not.toContain('sealed');
    await served.close();
  });

  it('refuses a link in a monorepo in the folder to a project outside it', async () => {
    const parent = fixture({
      'mono/package.json': JSON.stringify({ name: 'mono', private: true }),
      'mono/pnpm-workspace.yaml': "packages:\n  - 'apps/*'\n",
      'mono/apps/web/package.json': JSON.stringify({ name: 'web' }),
      'mono/apps/web/components/ui/chip.tsx': CHIP,
    });
    const mono = path.join(parent, 'mono');
    link(vaultProject(), path.join(mono, 'apps/vendor'));
    const warnings: string[] = [];
    const logger = { ...silentLogger, warn: (message: string) => warnings.push(message) };
    const served = await serve({
      cwd: fixture({}),
      root: parent,
      cache: false,
      watch: false,
      logger,
    });

    const web = await served.call('list_components', { path: path.join(mono, 'apps/web') });
    expect(text(web)).toContain('Chip');
    const refused = await served.call('get_component', {
      name: 'Vault',
      path: path.join(mono, 'apps/vendor/app/page.tsx'),
    });
    expect(refused.isError).toBe(true);
    expect(text(refused)).toContain(leads(parent));
    for (const [name, args] of [
      ['list_components', {}],
      ['get_component', { name: 'Vault' }],
    ] as const) {
      expect(text(await served.call(name, args)), name).not.toContain('sealed');
    }
    // The query is lowercase: a capital V would be the component's name.
    expect(text(await served.call('search_components', { query: 'vault' }))).not.toContain('Vault');
    expect(warnings.join('\n')).toContain(pathOf(path.join(mono, 'apps/vendor')));
    await served.close();
  });

  it('leaves out the packages of a workspace in the folder that are outside it, and says so', async () => {
    const root = fixture({
      'folder/mono/package.json': JSON.stringify({ name: 'mono', private: true }),
      'folder/mono/pnpm-workspace.yaml': "packages:\n  - 'apps/*'\n  - '../../outside'\n",
      'folder/mono/apps/web/package.json': JSON.stringify({ name: 'web' }),
      'folder/mono/apps/web/components/ui/chip.tsx': CHIP,
      'outside/package.json': JSON.stringify({ name: 'outside' }),
      'outside/components/ui/vault.tsx': VAULT,
    });
    const folder = path.join(root, 'folder');
    const mono = path.join(folder, 'mono');
    const warnings: string[] = [];
    const logger = { ...silentLogger, warn: (message: string) => warnings.push(message) };
    const served = await serve({
      cwd: fixture({}),
      root: folder,
      cache: false,
      watch: false,
      logger,
    });

    const web = await served.call('list_components', { path: path.join(mono, 'apps/web') });
    expect(web.isError).toBeFalsy();
    expect(text(web)).toContain('Chip');
    for (const [name, args] of [
      ['list_components', {}],
      ['get_component', { name: 'Vault' }],
    ] as const) {
      const answer = text(await served.call(name, args));
      expect(answer, name).not.toContain('sealed');
      expect(answer, name).not.toContain('outside');
    }
    const search = text(await served.call('search_components', { query: 'vault' }));
    expect(search).not.toContain('Vault');
    expect(search).not.toContain('outside');
    const warned = warnings.find((line) => line.includes(path.join(root, 'outside')));
    expect(warned).toContain(`${pathOf(mono)} names workspace packages outside ${pathOf(folder)}`);
    expect(warned).toContain(`start the server with --root ${pathOf(mono)}`);
    await served.close();
  });

  /** A logger that keeps the info and error lines, and waits for the first reload after `from`. */
  function reloadLog() {
    const lines: string[] = [];
    const keep = (message: string) => lines.push(message);
    return {
      lines,
      logger: { ...silentLogger, info: keep, error: keep },
      reloaded: (from: number) =>
        vi.waitFor(
          () => {
            expect(lines.slice(from).some((line) => /^reload(ed | failed: )/.test(line))).toBe(
              true,
            );
          },
          { timeout: 10_000, interval: 200 },
        ),
    };
  }

  it('keeps the model read from inside when a loaded project is replaced by a link while watching', async (ctx) => {
    const parent = fixture({
      'a/package.json': JSON.stringify({ name: 'a' }),
      'a/components/ui/chip.tsx': CHIP,
      'a/app/page.tsx': 'export default () => <Chip tone="loud" />;\n',
      'a/tokens/brand.tokens.json': JSON.stringify({
        brand: { $type: 'color', $value: '#2563eb' },
      }),
      'b/package.json': JSON.stringify({ name: 'b' }),
    });
    const a = path.join(parent, 'a');
    const log = reloadLog();
    const served = await serve({
      cwd: fixture({}),
      root: parent,
      cache: false,
      watch: true,
      logger: log.logger,
    });
    const page = await served.call('check_ui', { path: path.join(a, 'app/page.tsx') });
    expect(page.structuredContent).toMatchObject({ errorCount: 1 });

    // Give the watcher a moment to attach before the change.
    await new Promise((r) => setTimeout(r, 100));
    const from = log.lines.length;
    if (!replaceWithLink(a, vaultProject({ 'tokens/vault.tokens.json': SEALED_TOKEN }))) {
      await served.close();
      ctx.skip();
    }
    await log.reloaded(from);
    expect(log.lines).toContain(
      `reload failed: ${pathOf(a)} now leads outside ${pathOf(parent)}, the folder the server answers for, through a link: it is not read from there.`,
    );

    for (const [name, args] of [
      ['get_component', { name: 'Vault' }],
      ['list_components', {}],
      ['get_tokens', {}],
      ['search_components', { query: 'vault' }],
    ] as const) {
      const answer = text(await served.call(name, args));
      expect(answer, name).not.toContain('sealed');
      expect(answer, name).not.toContain('vault-steel');
    }
    expect((await served.read('ds://tokens')).join('\n')).not.toContain('vault-steel');
    // Still answered from the model read from inside the folder.
    expect(text(await served.call('get_component', { name: 'Chip' }))).toContain(
      'tone?: "neutral" | "accent"',
    );
    expect(text(await served.call('get_tokens', {}))).toContain('brand');
    await served.close();
  }, 20_000);

  it('keeps the model read from inside when a workspace package in the folder is replaced by a link while watching', async (ctx) => {
    const parent = fixture({
      'mono/package.json': JSON.stringify({ name: 'mono', private: true }),
      'mono/pnpm-workspace.yaml': "packages:\n  - 'apps/*'\n",
      'mono/apps/web/package.json': JSON.stringify({ name: 'web' }),
      'mono/apps/web/components/ui/chip.tsx': CHIP,
      'mono/apps/web/tokens/brand.tokens.json': JSON.stringify({
        brand: { $type: 'color', $value: '#2563eb' },
      }),
    });
    const web = path.join(parent, 'mono/apps/web');
    const log = reloadLog();
    const served = await serve({
      cwd: fixture({}),
      root: parent,
      cache: false,
      watch: true,
      logger: log.logger,
    });
    const listed = await served.call('list_components', { path: web });
    expect(text(listed)).toContain('Chip');

    await new Promise((r) => setTimeout(r, 100));
    const from = log.lines.length;
    if (!replaceWithLink(web, vaultProject({ 'tokens/vault.tokens.json': SEALED_TOKEN }))) {
      await served.close();
      ctx.skip();
    }
    await log.reloaded(from);
    expect(log.lines).toContain(
      `reload failed: ${pathOf(web)} now leads outside ${pathOf(parent)}, the folder the server answers for, through a link: it is not read from there.`,
    );

    for (const [name, args] of [
      ['list_components', {}],
      ['get_component', { name: 'Vault' }],
      ['get_tokens', {}],
      ['search_components', { query: 'vault' }],
    ] as const) {
      const answer = text(await served.call(name, args));
      expect(answer, name).not.toContain('sealed');
      expect(answer, name).not.toContain('vault-steel');
    }
    expect(text(await served.call('list_components', {}))).toContain('Chip');
    await served.close();
  }, 20_000);

  it('loads a project named in two letter cases once, where the file system ignores case', async (ctx) => {
    const parent = fixture({
      'Web/package.json': JSON.stringify({ name: 'web' }),
      'Web/components/ui/chip.tsx': CHIP,
    });
    if (!fs.existsSync(path.join(parent, 'web'))) ctx.skip();
    const infos: string[] = [];
    const logger = { ...silentLogger, info: (message: string) => infos.push(message) };
    const served = await serve({
      cwd: fixture({}),
      root: parent,
      cache: false,
      watch: false,
      logger,
    });
    for (const dir of ['Web', 'web']) {
      const listed = await served.call('list_components', { path: path.join(parent, dir) });
      expect(listed.isError, dir).toBeFalsy();
    }
    const chip = await served.call('get_component', { name: 'Chip' });
    expect(chip.isError).toBeFalsy();
    expect(text(chip)).toContain('tone?: "neutral" | "accent"');
    expect(infos.filter((line) => line.startsWith('using '))).toHaveLength(1);
    await served.close();
  });
});

describe('a JavaScript config in a project found from a path', () => {
  it('is named, quoted, in the error', async () => {
    const parent = fixture({
      'my app/package.json': JSON.stringify({ name: 'my-app' }),
      'my app/onsystem.config.mjs': 'export default {};\n',
    });
    const served = await serve({
      cwd: fixture({}),
      cache: false,
      watch: false,
      logger: silentLogger,
    });
    const refused = await served.call('list_components', { path: path.join(parent, 'my app') });
    expect(refused.isError).toBe(true);
    expect(text(refused)).toContain(
      `${JSON.stringify(path.join(parent, 'my app/onsystem.config.mjs'))} was not run: the server runs a JavaScript or TypeScript config only in a project it was started in`,
    );
    await served.close();
  });
});

describe('zero config at a folder that holds projects but is none', () => {
  it('reads no token file of a project in it', async () => {
    const parent = folderOfRepos();
    const found = async (root: string) =>
      (await tokenFiles(await loadConfig({ root }))).map((file) => path.relative(parent, file));
    const own = path.join('b', 'tokens', 'brand.tokens.json');
    expect(await found(parent)).toEqual([]);
    // From b itself, or from a project that holds b, the file is read as before.
    expect(await found(path.join(parent, 'b'))).toEqual([own]);
    fs.writeFileSync(path.join(parent, 'package.json'), JSON.stringify({ name: 'all' }));
    expect(await found(parent)).toEqual([own]);
  });

  it('says nothing about a token file of a project in it that leads outside', async () => {
    const parent = folderOfRepos();
    link(fixture({ 'brand.tokens.json': SEALED_TOKEN }), path.join(parent, 'b/tokens/linked'));
    const { model } = await buildModel(await loadConfig({ root: parent }), { cache: false });
    expect(model.tokens).toEqual([]);
    expect(model.warnings.join('\n')).not.toContain('Not read');
    // From b itself, the link is still named as a file that is not read.
    const own = await buildModel(await loadConfig({ root: path.join(parent, 'b') }), {
      cache: false,
    });
    expect(own.model.warnings.join('\n')).toContain(
      'Not read: tokens/linked/brand.tokens.json leads',
    );
  });

  it('gives check no fix from another project', async () => {
    const parent = folderOfRepos();
    const out: string[] = [];
    const io: Io = {
      cwd: parent,
      color: false,
      stdout: (t) => out.push(t),
      stderr: () => undefined,
    };
    await main(['check', 'a/app/alert.tsx'], io);
    expect(out.join('\n')).not.toContain('danger');
  });
});
