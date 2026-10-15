import fs from 'node:fs';
import path from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { describe, expect, it } from 'vitest';

import { main, type Io } from '../src/cli.js';
import { createServer } from '../src/server/index.js';
import { DEMO_ROOT, fixture, load } from './helpers.js';

// What a run could not read is said after its results, as for missing components and tokens,
// so a clean result is not taken for a checked one: a component library onsystem does not read
// yet (Chakra UI, Mantine), and dependencies that are not installed.

async function run(args: string[], cwd: string) {
  const out: string[] = [];
  const err: string[] = [];
  const io: Io = { cwd, color: false, stdout: (t) => out.push(t), stderr: (t) => err.push(t) };
  const code = await main(args, io);
  return { code, stdout: out.join('\n'), stderr: err.join('\n') };
}

const NO_DESIGN_SYSTEM =
  'No design system found (no components or color tokens): only the accessibility rule ran. See https://onsystem.vercel.app/docs/configuration';

describe('a component library onsystem does not read', () => {
  // The app from the report: Chakra UI and Mantine, and nothing of its own.
  const app = (files: Record<string, string> = {}) =>
    fixture({
      'package.json': JSON.stringify({
        name: 'chakra-app',
        dependencies: {
          '@chakra-ui/react': '^3.37.0',
          '@mantine/core': '^9.7.2',
          react: '^19.0.0',
        },
      }),
      'src/App.tsx': [
        'import { Button, IconButton } from "@chakra-ui/react";',
        'import { Button as MButton } from "@mantine/core";',
        'export const App = () => (',
        '  <>',
        '    <Button colorPalette="red" variant="danger" tone="x">Go</Button>',
        '    <IconButton><svg /></IconButton>',
        '    <MButton isDisabled>Go</MButton>',
        '  </>',
        ');',
      ].join('\n'),
      ...files,
    });
  const UNREAD =
    'Chakra UI (@chakra-ui/react) and Mantine (@mantine/core) are dependencies, but onsystem does not read them yet: of the published component libraries, it reads only MUI so far. Wrap their components in your own and point "components" in the config at those. See https://onsystem.vercel.app/docs/how-it-works#limits';

  it('says so after a clean check, in every format', async () => {
    const root = app();
    const pretty = await run(['check', 'src', '--no-cache'], root);
    expect(pretty.code).toBe(0);
    expect(pretty.stdout.split('\n').slice(-2)).toEqual([NO_DESIGN_SYSTEM, UNREAD]);
    const json = await run(['check', 'src', '--format', 'json', '--no-cache'], root);
    expect(JSON.parse(json.stdout)).toHaveLength(1);
    expect(json.stderr).toBe(`${NO_DESIGN_SYSTEM}\n${UNREAD}`);
    const github = await run(['check', 'src', '--format', 'github', '--no-cache'], root);
    expect(github.stdout.split('\n').at(-1)).toBe(`::warning title=onsystem::${UNREAD}`);
    // The GitHub Action's default: the failure says why.
    const required = await run(['check', 'src', '--require-design-system', '--no-cache'], root);
    expect(required).toEqual({
      code: 2,
      stdout: '',
      stderr: `check --require-design-system: ${NO_DESIGN_SYSTEM}\n${UNREAD}`,
    });
  });

  it('names one library in the singular, with check_ui too', async () => {
    const root = fixture({
      'package.json': JSON.stringify({ dependencies: { antd: '^5.0.0' } }),
      'src/App.tsx': 'export const App = () => <p>Hi</p>',
    });
    const one =
      'Ant Design (antd) is a dependency, but onsystem does not read it yet: of the published component libraries, it reads only MUI so far. Wrap its components in your own and point "components" in the config at those. See https://onsystem.vercel.app/docs/how-it-works#limits';
    expect((await run(['check', 'src', '--no-cache'], root)).stdout.split('\n').at(-1)).toBe(one);

    const ds = await load(root);
    const server = createServer({ getDesignSystem: () => Promise.resolve(ds) });
    const client = new Client({ name: 'test-client', version: '1.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    const result = await client.callTool({ name: 'check_ui', arguments: { code: '<p>Hi</p>' } });
    expect(result.structuredContent).toMatchObject({ notice: `${NO_DESIGN_SYSTEM}\n\n${one}` });
    await client.close();
  });

  it('lists it on the library line of inspect, with the installed version', async () => {
    const root = app({
      'node_modules/@chakra-ui/react/package.json':
        '{ "name": "@chakra-ui/react", "version": "3.37.0" }',
    });
    const { stdout } = await run(['inspect', '--no-cache'], root);
    expect(stdout).toContain(
      'library  Chakra UI (@chakra-ui/react 3.37.0): a dependency onsystem does not read yet (it reads only MUI so far)\n' +
        'library  Mantine (@mantine/core): a dependency onsystem does not read yet (it reads only MUI so far)\n',
    );
    const explained = await run(['inspect', '--explain', '--no-cache'], root);
    expect(explained.stdout).toContain(
      '  no     @chakra-ui/react 3.37.0: a dependency onsystem does not read yet (it reads only MUI so far)\n',
    );
  });

  it('says nothing after a check when the project has components of its own', async () => {
    const root = app({
      'components/ui/button.tsx':
        'export function Button(props: { children?: string }) { return <button>{props.children}</button> }',
      'app/globals.css': ':root { --primary: oklch(0.205 0 0); }',
    });
    const { stdout, stderr } = await run(['check', 'src', '--no-cache'], root);
    expect(stdout).not.toContain('does not read');
    expect(stderr).not.toContain('does not read');
    // inspect still lists it.
    expect((await run(['inspect', '--no-cache'], root)).stdout).toContain(
      'library  Chakra UI (@chakra-ui/react): a dependency onsystem does not read yet',
    );
  });
});

describe('dependencies that are not installed', () => {
  /** The demo as a stranger copies it: everything but node_modules. */
  const demoWithoutInstall = () => {
    const files: Record<string, string> = {};
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules') continue;
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(file);
        else files[path.relative(DEMO_ROOT, file)] = fs.readFileSync(file, 'utf8');
      }
    };
    walk(DEMO_ROOT);
    return fixture(files);
  };
  const MISSING =
    'The dependencies are not installed (no node_modules): no-unknown-prop skips 20 components whose props come from them. Install them (npm install, pnpm install) and run again.';

  it('says that no-unknown-prop skipped components, after check and on stderr from inspect', async () => {
    const root = demoWithoutInstall();
    const pretty = await run(['check', 'app/**/*.tsx', '--no-cache'], root);
    expect(pretty.code).toBe(1);
    // The finding it costs: <Badge tone="warning"> in the installed demo.
    expect(pretty.stdout).toContain('7 errors, 3 warnings in 1 of 2 files checked');
    expect(pretty.stdout.split('\n').at(-1)).toBe(MISSING);
    const json = await run(['check', 'app/**/*.tsx', '--format', 'json', '--no-cache'], root);
    expect(json.stderr).toBe(MISSING);
    const github = await run(['check', 'app/**/*.tsx', '--format', 'github', '--no-cache'], root);
    expect(github.stdout.split('\n').at(-1)).toBe(`::warning title=onsystem::${MISSING}`);

    const inspected = await run(['inspect', '--no-cache'], root);
    expect(inspected.code).toBe(0);
    expect(inspected.stderr).toBe(MISSING);
    // --explain says it in full on stdout, so not again.
    expect((await run(['inspect', '--explain', '--no-cache'], root)).stderr).toBe('');
  });

  it('says it in check_ui', async () => {
    const ds = await load(demoWithoutInstall());
    const server = createServer({ getDesignSystem: () => Promise.resolve(ds) });
    const client = new Client({ name: 'test-client', version: '1.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    const result = await client.callTool({
      name: 'check_ui',
      arguments: { code: '<Badge tone="warning">Due</Badge>' },
    });
    expect(result.structuredContent).toMatchObject({ ok: true, notice: MISSING });
    await client.close();
  });

  it('says nothing when they are installed, or when no-unknown-prop is off', async () => {
    const installed = await run(['check', 'app/**/*.tsx', '--no-cache'], DEMO_ROOT);
    expect(installed.stdout).toContain('8 errors, 3 warnings');
    expect(installed.stdout).not.toContain('not installed');
    expect((await run(['inspect', '--no-cache'], DEMO_ROOT)).stderr).toBe('');

    const root = demoWithoutInstall();
    fs.writeFileSync(
      path.join(root, 'onsystem.config.json'),
      JSON.stringify({
        components: ['components/ui/**/*.tsx'],
        tokens: ['app/globals.css'],
        rules: { 'no-unknown-prop': 'off' },
      }),
    );
    const off = await run(['check', 'app/**/*.tsx', '--no-cache'], root);
    expect(off.stdout).not.toContain('not installed');
    expect((await run(['inspect', '--no-cache'], root)).stderr).toBe('');
  });

  it('names the projects at a monorepo root, once', async () => {
    const button =
      'export function Button(props: React.ComponentProps<"button">) { return <button {...props} /> }';
    const page =
      'import { Button } from "@/components/ui/button"\nexport default () => <Button tone="x" />';
    const tsconfig = JSON.stringify({
      compilerOptions: { jsx: 'react-jsx', paths: { '@/*': ['./*'] } },
    });
    const app = (name: string) => ({
      [`apps/${name}/package.json`]: JSON.stringify({ name, dependencies: { react: '^19.0.0' } }),
      [`apps/${name}/tsconfig.json`]: tsconfig,
      [`apps/${name}/components/ui/button.tsx`]: button,
      [`apps/${name}/app/globals.css`]: ':root { --primary: oklch(0.205 0 0); }',
      [`apps/${name}/app/page.tsx`]: page,
    });
    const root = fixture({
      'package.json': JSON.stringify({ name: 'root', private: true, workspaces: ['apps/*'] }),
      ...app('admin'),
      ...app('web'),
    });
    const notice =
      'The dependencies of apps/admin and apps/web are not installed (no node_modules): no-unknown-prop skips 2 components whose props come from them. Install them (npm install, pnpm install) and run again.';
    const checked = await run(['check', '.', '--no-cache'], root);
    expect(checked.stdout.split(notice)).toHaveLength(2);
    expect((await run(['inspect', '--no-cache'], root)).stderr).toBe(notice);
  });
});
