import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { main, type Io } from '../src/cli.js';
import { isWorkspaceRoot } from '../src/detect.js';
import { loadTarget } from '../src/workspace.js';
import { fixture } from './helpers.js';

const HOOK = path.resolve(import.meta.dirname, '../plugins/onsystem/hooks/check-ui.mjs');

// Stands in for the CLI: records the folder the hook started it in and its arguments, then
// prints the answer in STUB_ANSWER, which the test gets from the real CLI for that command there.
const STUB = `import fs from 'node:fs';
fs.writeFileSync(process.env.STUB_LOG, JSON.stringify({ cwd: process.cwd(), args: process.argv.slice(2) }));
const answer = JSON.parse(fs.readFileSync(process.env.STUB_ANSWER, 'utf8'));
process.stdout.write(answer.stdout);
process.exit(answer.code);
`;

const json = (value: unknown) => JSON.stringify(value, null, 2);

/** A pnpm monorepo with one app on its own components and color tokens, whose page hardcodes a color. */
const MONOREPO = {
  'package.json': json({ name: 'mono', private: true }),
  'pnpm-workspace.yaml': 'packages:\n  - apps/*\n',
  'apps/web/package.json': json({ name: 'web' }),
  'apps/web/components/ui/button.tsx':
    'export function Button(props: React.ComponentProps<"button">) { return <button {...props} /> }\n',
  'apps/web/app/globals.css': ':root { --destructive: #ef4444; }\n',
  'apps/web/app/page.tsx':
    'import { Button } from "../components/ui/button";\n\nexport default function Page() {\n  return <div className="bg-[#ef4444]"><Button>Hi</Button></div>;\n}\n',
};
const NEW_PAGE =
  'export default function Promo() {\n  return <p className="text-[#ef4444]">Sale</p>;\n}\n';

async function run(args: string[], cwd: string) {
  const out: string[] = [];
  const err: string[] = [];
  const io: Io = { cwd, color: false, stdout: (t) => out.push(t), stderr: (t) => err.push(t) };
  const code = await main(args, io);
  return { code, stdout: out.join('\n'), stderr: err.join('\n') };
}

const tools = fixture({ 'cli.mjs': STUB });
const log = path.join(tools, 'log.json');
const answer = path.join(tools, 'answer.json');

/** The environment without the variables that point the hook at a CLI. */
const withoutBin = ({
  ONSYSTEM_BIN: _bin,
  DESIGN_SYSTEM_MCP_BIN: _legacy,
  ...env
}: NodeJS.ProcessEnv) => env;

/** Runs the hook on a Write of `file` (relative to `cwd`, Claude's folder), with `stdout` and `code` as the CLI's answer. */
function spawnHook(cwd: string, file: string, reply = { stdout: '[]', code: 0 }, bin = true) {
  fs.rmSync(log, { force: true });
  fs.writeFileSync(answer, JSON.stringify(reply));
  const run = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify({
      session_id: randomUUID(),
      hook_event_name: 'PostToolUse',
      tool_name: 'Write',
      cwd,
      tool_input: { file_path: path.join(cwd, file) },
    }),
    encoding: 'utf8',
    env: {
      ...withoutBin(process.env),
      ...(bin ? { ONSYSTEM_BIN: path.join(tools, 'cli.mjs') } : {}),
      STUB_LOG: log,
      STUB_ANSWER: answer,
    },
  });
  const started = fs.existsSync(log)
    ? (JSON.parse(fs.readFileSync(log, 'utf8')) as { cwd: string; args: string[] })
    : undefined;
  return { code: run.status, stdout: run.stdout, stderr: run.stderr, started };
}

/** The folder the hook runs `check` in for a Write of `file`. */
function folderOf(cwd: string, file: string): string | undefined {
  return spawnHook(cwd, file).started?.cwd;
}

/**
 * The hook on a Write of `file`, answered by the real CLI: the command the hook runs, run in
 * the folder it runs it in.
 */
async function hook(cwd: string, file: string) {
  const started = spawnHook(cwd, file).started;
  if (!started) throw new Error('The hook did not run the CLI.');
  const real = await run([...started.args, '--no-cache'], started.cwd);
  const { code, stdout, stderr } = spawnHook(cwd, file, { stdout: real.stdout, code: real.code });
  return { code, stdout, stderr, cwd: started.cwd };
}

const real = (dir: string) => fs.realpathSync(dir);

describe('check-ui hook at a monorepo root with a config or a baseline', () => {
  it('honours the baseline and config that init writes at the root, as check . there does', async () => {
    const root = fixture(MONOREPO);
    const init = await run(['init', '--yes', '--no-cache'], root);
    expect(init.stdout).toContain(
      'rules and overrides you add here apply to every project without a config of its own',
    );
    expect(init.stdout).toContain('Baseline: 1 finding in 1 file → onsystem.baseline.json');
    expect((await run(['check', '.', '--no-cache'], root)).code).toBe(0);

    // The page's finding is in the root's baseline: a Write of the whole page passes.
    expect(await hook(root, 'apps/web/app/page.tsx')).toEqual({
      code: 0,
      stdout: '',
      stderr: '',
      cwd: real(root),
    });
    // A new finding still blocks, named from the root.
    fs.writeFileSync(path.join(root, 'apps/web/app/promo.tsx'), NEW_PAGE);
    const promo = await hook(root, 'apps/web/app/promo.tsx');
    expect(promo.code).toBe(2);
    expect(promo.stderr).toMatch(
      /^apps\/web\/app\/promo\.tsx: this change breaks the project's design system/,
    );
    expect(promo.stderr).toContain('2:24 error [no-hardcoded-color]');
    expect((await run(['check', '.', '--no-cache'], root)).code).toBe(1);
  });

  it('turns off the rules the root config turns off, as check . there does', async () => {
    const root = fixture({
      ...MONOREPO,
      'onsystem.config.json': json({ rules: { 'no-hardcoded-color': 'off' } }),
    });
    expect((await run(['check', '.', '--no-cache'], root)).code).toBe(0);
    expect(await hook(root, 'apps/web/app/page.tsx')).toEqual({
      code: 0,
      stdout: '',
      stderr: '',
      cwd: real(root),
    });
    // Claude started in the app: the same.
    expect((await hook(path.join(root, 'apps/web'), 'app/page.tsx')).code).toBe(0);
    // A config the root's package.json names in its `onsystem` field, which check reads too.
    const declared = fixture({
      ...MONOREPO,
      'package.json': json({ name: 'mono', private: true, onsystem: './onsystem.shared.json' }),
      'onsystem.shared.json': json({ rules: { 'no-hardcoded-color': 'off' } }),
    });
    expect((await run(['check', '.', '--no-cache'], declared)).code).toBe(0);
    expect(await hook(declared, 'apps/web/app/page.tsx')).toEqual({
      code: 0,
      stdout: '',
      stderr: '',
      cwd: real(declared),
    });
  });

  it('reaches the root through a symlink, as the CLI sees it by its real path', async () => {
    const root = fixture({
      ...MONOREPO,
      'onsystem.config.json': json({}),
      'apps/web/app/promo.tsx': NEW_PAGE,
    });
    const link = path.join(os.tmpdir(), `onsystem-link-${randomUUID()}`);
    fs.symlinkSync(root, link, 'junction');
    try {
      const promo = await hook(link, 'apps/web/app/promo.tsx');
      expect(promo.code).toBe(2);
      expect(promo.stderr).toContain('2:24 error [no-hardcoded-color]');
    } finally {
      fs.rmSync(link, { force: true });
    }
  });

  it("runs the app's own install of the CLI from the root", () => {
    const root = fixture({
      ...MONOREPO,
      'onsystem.config.json': json({}),
      'apps/web/node_modules/onsystem/package.json': json({
        name: 'onsystem',
        bin: { onsystem: 'cli.mjs' },
      }),
      'apps/web/node_modules/onsystem/cli.mjs': STUB,
    });
    const { code, started } = spawnHook(root, 'apps/web/app/page.tsx', undefined, false);
    expect(code).toBe(0);
    expect(started).toEqual({
      cwd: real(root),
      args: [
        'check',
        `.${path.sep}${path.join('apps', 'web', 'app', 'page.tsx')}`,
        '--format',
        'json',
        '--quiet-without-design-system',
      ],
    });
  });

  it('checks from the project folder when the root adds nothing, or the project keeps its own baseline', async () => {
    // Nothing at the root: as before, from the app, which reports the page's finding.
    const bare = fixture(MONOREPO);
    const app = await hook(bare, 'apps/web/app/page.tsx');
    expect(app.cwd).toBe(real(path.join(bare, 'apps/web')));
    expect(app.code).toBe(2);
    expect(app.stderr).toMatch(/^app\/page\.tsx: this change breaks/);
    // A job per app, with the app's own baseline (the GitHub Action's working-directory).
    const perApp = fixture({
      ...MONOREPO,
      'onsystem.config.json': json({}),
      'apps/web/onsystem.baseline.json': json({ version: 1, files: {} }),
    });
    expect(folderOf(perApp, 'apps/web/app/page.tsx')).toBe(real(path.join(perApp, 'apps/web')));
    // A single app whose pnpm-workspace.yaml holds settings alone is no monorepo.
    const single = fixture({
      'package.json': json({ name: 'app' }),
      'pnpm-workspace.yaml': 'allowBuilds:\n  esbuild: true\n',
      'onsystem.config.json': json({}),
      'tools/emails/package.json': json({ name: 'emails' }),
    });
    expect(folderOf(single, 'tools/emails/welcome.tsx')).toBe(
      real(path.join(single, 'tools/emails')),
    );
  });

  it('checks from the project folder when the root is one project with a design system of its own', async () => {
    // The root is an app on its own components; packages/site keeps components of its own.
    const root = fixture({
      'package.json': json({ name: 'site-root', private: true }),
      'pnpm-workspace.yaml': 'packages:\n  - packages/*\n',
      'components/ui/button.tsx': MONOREPO['apps/web/components/ui/button.tsx'],
      'app/globals.css': ':root { --background: #fafafa; }\n',
      'app/page.tsx':
        'import { Button } from "../components/ui/button";\n\nexport default function Page() {\n  return <Button>Hi</Button>;\n}\n',
      'packages/site/package.json': json({ name: 'site' }),
      'packages/site/components/ui/kbd.tsx':
        'export function Kbd(props: React.ComponentProps<"kbd">) { return <kbd {...props} /> }\n',
      'packages/site/app/globals.css': ':root { --background: #fafafa; }\n',
      'packages/site/app/help.tsx':
        'import { Kbd } from "../components/ui/kbd";\n\nexport default function Help() {\n  return <p>Press <Kbd>K</Kbd> to search</p>;\n}\n',
    });
    const init = await run(['init', '--yes', '--no-cache'], root);
    expect(init.code).toBe(0);
    const config = JSON.parse(fs.readFileSync(path.join(root, 'onsystem.config.json'), 'utf8')) as {
      components?: unknown;
    };
    expect(config.components).toEqual(['components/ui/**/*.{tsx,jsx}']);
    const site = real(path.join(root, 'packages/site'));
    expect(await hook(root, 'packages/site/app/help.tsx')).toEqual({
      code: 0,
      stdout: '',
      stderr: '',
      cwd: site,
    });
    // The package's own design-system file is left alone, as check in the package leaves it.
    const kbd = 'packages/site/components/ui/kbd.tsx';
    fs.writeFileSync(
      path.join(root, kbd),
      'export function Kbd(props: React.ComponentProps<"kbd">) {\n  return <kbd className="p-[3px] bg-[#fafafa]" {...props} />;\n}\n',
    );
    expect(await hook(root, kbd)).toEqual({ code: 0, stdout: '', stderr: '', cwd: site });
    // check at the root would hold it to the root's design system instead.
    const fromRoot = await run(['check', kbd, '--no-cache'], root);
    expect(fromRoot.code).toBe(1);
    expect(fromRoot.stdout).toMatch(/2:34 +error +Hardcoded color `bg-\[#fafafa\]`/);
  });

  it('checks a project without design-system components under a root config, as check . there does', async () => {
    const root = fixture({
      ...MONOREPO,
      'onsystem.config.json': json({}),
      'apps/docs/package.json': json({ name: 'docs' }),
      'apps/docs/app/page.tsx':
        'export default function Page() {\n  return <button><svg aria-hidden="true" /></button>;\n}\n',
    });
    const docs = await hook(root, 'apps/docs/app/page.tsx');
    expect(docs.cwd).toBe(real(root));
    expect(docs.code).toBe(2);
    expect(docs.stderr).toContain('2:11 error [icon-button-accessible-name]');
    const check = await run(['check', '.', '--no-cache'], root);
    expect(check.code).toBe(1);
    expect(check.stdout).toMatch(
      /apps\/docs\/app\/page\.tsx\n +2:11 +error .+icon-button-accessible-name/,
    );
    // Without the root config, the hook stays quiet there.
    fs.rmSync(path.join(root, 'onsystem.config.json'));
    expect(await hook(root, 'apps/docs/app/page.tsx')).toEqual({
      code: 0,
      stdout: '',
      stderr: '',
      cwd: real(path.join(root, 'apps/docs')),
    });
  });

  it('reads a root with a design system of its own as check does', async () => {
    const component = (name: string) =>
      `import { Slot } from "@radix-ui/react-slot";\n\nexport function ${name}(props: React.ComponentProps<"div">) { return <Slot {...props} /> }\n`;
    const flat = Object.fromEntries(
      ['Button', 'Card', 'Dialog', 'Input', 'Select'].map((n) => [`src/${n}.tsx`, component(n)]),
    );
    const layouts: Record<string, Record<string, string>> = {
      'a config without components': {},
      'a config with components': {
        'onsystem.config.json': json({ components: ['design/**/*.tsx'] }),
      },
      'a JavaScript config with components': {
        'onsystem.config.mjs': "export default { components: ['design/**/*.tsx'] };\n",
      },
      'components/ui': { 'components/ui/button.tsx': component('Button') },
      'src/components/ui': { 'src/components/ui/button.tsx': component('Button') },
      'components/ui without components': { 'components/ui/utils.ts': 'export {};\n' },
      'a components.json': {
        'components.json': json({ aliases: { components: '@/components', ui: '@/design/ui' } }),
        'tsconfig.json': json({ compilerOptions: { paths: { '@/*': ['./*'] } } }),
        'design/ui/button.tsx': component('Button'),
      },
      'its own exports': {
        'package.json': json({ name: 'mono', exports: { './*': './lib/*.tsx' } }),
        'lib/button.tsx': component('Button'),
      },
      'a workspace design-system package': {
        'pnpm-workspace.yaml': 'packages:\n  - apps/*\n  - packages/*\n',
        'package.json': json({ name: 'mono', devDependencies: { '@acme/ui': 'workspace:*' } }),
        'packages/ui/package.json': json({ name: '@acme/ui', exports: { './*': './src/*.tsx' } }),
        'packages/ui/src/button.tsx': component('Button'),
        'packages/ui/src/card.tsx': component('Card'),
        'packages/ui/src/input.tsx': component('Input'),
      },
      'an installed package named like one (@vitest/ui)': {
        'package.json': json({ name: 'mono', devDependencies: { '@vitest/ui': '^3.0.0' } }),
      },
      'a flat src/ on a primitives library': {
        'package.json': json({ name: 'mono', dependencies: { '@radix-ui/react-slot': '^1.0.0' } }),
        ...flat,
      },
    };
    const read: [string, boolean][] = [];
    for (const [name, files] of Object.entries(layouts)) {
      // A config of the layout's own, else one without components, as init writes at a root.
      const configured = Object.keys(files).some((f) => f.startsWith('onsystem.config.'));
      const root = fixture({
        'package.json': json({ name: 'mono' }),
        'pnpm-workspace.yaml': 'packages:\n  - apps/*\n',
        ...(configured ? {} : { 'onsystem.config.json': json({}) }),
        'apps/web/package.json': json({ name: 'web' }),
        ...files,
      });
      const fromRoot = folderOf(root, 'apps/web/app/page.tsx') === real(root);
      const { workspace } = await loadTarget({ cwd: root });
      expect(fromRoot, name).toBe(workspace !== undefined);
      read.push([name, fromRoot]);
    }
    expect(Object.fromEntries(read)).toEqual({
      'a config without components': true,
      'a config with components': false,
      'a JavaScript config with components': false,
      'components/ui': false,
      'src/components/ui': false,
      'components/ui without components': true,
      'a components.json': false,
      'its own exports': false,
      'a workspace design-system package': false,
      'an installed package named like one (@vitest/ui)': true,
      'a flat src/ on a primitives library': false,
    });
  });

  it('reads a monorepo root as check does', () => {
    const roots: Record<string, Record<string, string>> = {
      'pnpm, block list': { 'pnpm-workspace.yaml': 'packages:\n  - apps/*\n' },
      'pnpm, flow list': { 'pnpm-workspace.yaml': "packages: ['apps/*', 'packages/*']\n" },
      'pnpm, quoted key after a byte order mark': {
        'pnpm-workspace.yaml': '\uFEFF"packages":\n  # apps\n  - "apps/*" # every app\n',
      },
      'pnpm, the root alone': { 'pnpm-workspace.yaml': "packages:\n  - '.'\n" },
      'pnpm, settings alone': { 'pnpm-workspace.yaml': 'allowBuilds:\n  esbuild: true\n' },
      'npm workspaces': { 'package.json': json({ name: 'mono', workspaces: ['apps/*'] }) },
      'pnpm settings next to npm workspaces': {
        'pnpm-workspace.yaml': 'allowBuilds:\n  esbuild: true\n',
        'package.json': json({ name: 'mono', workspaces: ['apps/*'] }),
      },
      nx: { 'nx.json': '{}' },
      'lerna with packages': { 'lerna.json': json({ packages: ['apps/*'] }) },
      'lerna without packages': { 'lerna.json': json({ version: '1.0.0' }) },
    };
    const read = Object.entries(roots).map(([name, files]) => {
      const root = fixture({
        'package.json': json({ name: 'mono' }),
        'onsystem.config.json': json({}),
        'apps/web/package.json': json({ name: 'web' }),
        ...files,
      });
      const fromRoot = folderOf(root, 'apps/web/app/page.tsx') === real(root);
      expect(fromRoot, name).toBe(isWorkspaceRoot(root));
      return [name, fromRoot];
    });
    expect(Object.fromEntries(read)).toEqual({
      'pnpm, block list': true,
      'pnpm, flow list': true,
      'pnpm, quoted key after a byte order mark': true,
      'pnpm, the root alone': false,
      'pnpm, settings alone': false,
      'npm workspaces': true,
      'pnpm settings next to npm workspaces': true,
      nx: true,
      'lerna with packages': true,
      'lerna without packages': false,
    });
  });
});
