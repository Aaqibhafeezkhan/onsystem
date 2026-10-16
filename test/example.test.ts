import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { main, type Io } from '../src/cli.js';
import { DEMO_ROOT, fixture } from './helpers.js';
import { blocks } from './markdown.js';

// The website links examples/shadcn-demo as the demo design system, so people open it from
// GitHub, and some copy the folder out (`npx degit`) to try it. A copy has only the folder: the
// steps its README gives first, its scripts, its config and the draft page's comment must work
// there, without a clone or a build of this repository.

const read = (file: string) => fs.readFileSync(path.join(DEMO_ROOT, file), 'utf8');
const readme = read('README.md');
const manifest = JSON.parse(read('package.json')) as {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
const scripts = manifest.scripts ?? {};

/** What the README says before its section for people working on onsystem itself. */
const forVisitors = readme.split('\n## Working on onsystem\n')[0] ?? '';

/** The `npm run` scripts a block of commands runs, in order. */
const npmRuns = (commands: string) =>
  [...commands.matchAll(/npm run ([\w:-]+)/g)].map((m) => m[1] ?? '');

/** The folder copied outside the repository, with its dependencies installed. */
function copyOfTheFolder(): string {
  const root = fixture({}, { nodeModules: true });
  fs.cpSync(DEMO_ROOT, root, {
    recursive: true,
    filter: (src) => path.relative(DEMO_ROOT, src).split(path.sep)[0] !== 'node_modules',
  });
  return root;
}

/** Runs an `npm run` script of the copy, with this checkout's CLI in place of the npm release. */
async function runScript(name: string, cwd: string) {
  const script = scripts[name] ?? '';
  const npx = 'npx -y onsystem ';
  expect(script.startsWith(npx), `npm run ${name}: ${script}`).toBe(true);
  const args = script.slice(npx.length).split(/\s+/);
  const out: string[] = [];
  const io: Io = { cwd, color: false, stdout: (t) => out.push(t), stderr: (t) => out.push(t) };
  const code = await main([...args, '--no-cache'], io);
  return { code, output: out.join('\n') };
}

describe('examples/shadcn-demo outside the repository', () => {
  it('starts its README with steps that work in a copy of the folder', () => {
    const [first = ''] = blocks(readme, 'sh');
    expect(first).toContain('npx degit dgesteves/onsystem/examples/shadcn-demo');
    expect(first).toContain('npm install');
    expect(npmRuns(first)).toEqual(['inspect', 'check']);
    // Nothing a visitor reads first needs a clone or a build of this repository.
    expect(forVisitors).not.toMatch(/\bpnpm\b|dist\/cli\.js|repository root/);
  });

  it('has the scripts the README runs, with onsystem from npm', () => {
    for (const name of npmRuns(forVisitors)) expect(scripts).toHaveProperty(name);
    // npx, not a dependency: pnpm would install the npm release in this workspace and hoist it to
    // node_modules/.pnpm/node_modules, which the NODE_PATH of pnpm's bins (vitest's among them)
    // puts in reach of every process the tests start, such as the hook's "own install" lookup.
    expect(manifest.dependencies).not.toHaveProperty('onsystem');
    expect(manifest.devDependencies).not.toHaveProperty('onsystem');
  });

  it('runs the README scripts in the copy with the results it describes', async () => {
    const root = copyOfTheFolder();

    const inspect = await runScript('inspect', root);
    expect(inspect.code).toBe(0);
    for (const component of ['Button', 'Badge', 'Card', 'Dialog', 'Input']) {
      expect(inspect.output).toMatch(new RegExp(`^\\s+${component}\\s`, 'm'));
    }
    // The README says to install first: Dialog's props come from Radix's types.
    expect(inspect.output).toMatch(/^\s+Dialog\s+[1-9]\d* props/m);
    expect(forVisitors).toContain("`Dialog`'s come from Radix");

    const check = await runScript('check', root);
    expect(check.code).toBe(1);
    expect(check.output).toContain('app/settings/danger-zone.tsx');
    expect(check.output).not.toContain('members.tsx');
    expect(check.output).toMatch(/\d+ errors?, \d+ warnings? in 1 of 2 files checked/);
    expect(forVisitors).toContain('exits 1: danger-zone.tsx has errors');
  });

  it('points $schema at the published schema, which a copy can load', () => {
    const config = JSON.parse(read('onsystem.config.json')) as { $schema?: string };
    const schema = JSON.parse(
      fs.readFileSync(path.join(import.meta.dirname, '../schema.json'), 'utf8'),
    ) as { $id: string };
    expect(config.$schema).toBe(schema.$id);
  });

  it('names a script the copy has in the draft page', () => {
    const comment = read('app/settings/danger-zone.tsx').split('\n').slice(0, 2).join('\n');
    const [named] = npmRuns(comment);
    expect(named, comment).toBeDefined();
    expect(scripts).toHaveProperty(named ?? '');
  });
});
