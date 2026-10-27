import fs from 'node:fs';
import path from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { describe, expect, it, vi } from 'vitest';

import { main, type Io } from '../src/cli.js';
import { loadConfig } from '../src/config.js';
import { buildModel, DesignSystemHost, tokenFiles } from '../src/design-system.js';
import { serveStdio } from '../src/server/stdio.js';
import { silentLogger } from '../src/util/log.js';
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

describe('a config written in code, edited while the process runs', () => {
  const configs = [
    ['onsystem.config.mjs', 'export default'],
    ['onsystem.config.ts', 'export default'],
    // CommonJS, in a package without "type": "module". Node.js keeps it in require's cache, which
    // Vitest's module runner does not use: the built CLI was checked by hand for this one.
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
