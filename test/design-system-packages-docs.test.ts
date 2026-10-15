import fs from 'node:fs';
import path from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { describe, expect, it } from 'vitest';

import { main, type Io } from '../src/cli.js';
import { RULE_IDS } from '../src/config.js';
import { createServer } from '../src/server/index.js';
import { fixture, load } from './helpers.js';
import { section } from './markdown.js';

// docs/design-system-packages.md: what an app that depends on a design-system package gets, by
// how it gets the package. The package is set up with `init`, as its team would, and published
// the way npm publishes it (its `files`); the app has one mistake for each rule, so the rules
// that report are the rules that run.

const docs = fs.readFileSync(
  path.join(import.meta.dirname, '../docs/design-system-packages.md'),
  'utf8',
);
const whatAppsGet = section(docs, 'What apps get');
const inTheApps = section(docs, 'In the apps');

const json = (value: unknown) => JSON.stringify(value, null, 2);

/** `@acme/ui` before `init`: components in `src/`, compiled to `dist/`, tokens in `theme.css`. */
const PACKAGE = {
  'package.json': json({
    name: '@acme/ui',
    version: '1.0.0',
    files: ['dist', 'src', 'theme.css'],
    exports: {
      '.': { types: './dist/index.d.ts', import: './dist/index.mjs' },
      './theme.css': './theme.css',
    },
  }),
  'theme.css':
    '@theme {\n  --spacing: 0.25rem;\n  --color-primary: oklch(0.55 0.2 260);\n  --color-muted: oklch(0.97 0 0);\n  --radius-sm: 0.25rem;\n  --radius-md: 0.375rem;\n}\n',
  'src/index.tsx': 'export * from "./button";\nexport * from "./card";\nexport * from "./input";\n',
  'src/button.tsx':
    'export function Button(props: { variant?: "default" | "outline"; children?: unknown; "aria-label"?: string }) { return <button aria-label={props["aria-label"]} /> }\n',
  'src/card.tsx': 'export function Card(props: { children?: unknown }) { return <div /> }\n',
  'src/input.tsx': 'export function Input(props: { name?: string }) { return <input /> }\n',
  'dist/index.mjs':
    'export function Button() {}\nexport function Card() {}\nexport function Input() {}\n',
  'dist/index.d.ts':
    'export declare function Button(props: { variant?: "default" | "outline" }): unknown;\nexport declare function Card(props: object): unknown;\nexport declare function Input(props: object): unknown;\n',
};

/** One mistake per rule; the icon-only <button> on the last line breaks two. */
const PAGE = `import { Badge, Button } from "@acme/ui";

export default function Page() {
  return (
    <main>
      <div className="bg-blue-500">Color</div>
      <div className="p-[13px]">Spacing</div>
      <div className="rounded-[7px]">Radius</div>
      <input name="q" />
      <Badge>New</Badge>
      <Button tone="quiet">Save</Button>
      <Button variant="danger">Delete</Button>
      <Button><svg /></Button>
      <button><svg /></button>
    </main>
  );
}
`;
const NATIVE_BUTTON_LINE = 14;

/**
 * `@acme/ui` as shadcn's monorepo template exports it: each component by its own subpath
 * (`@acme/ui/components/button`), with no barrel.
 */
const SUBPATH_PACKAGE = {
  'package.json': json({
    name: '@acme/ui',
    version: '1.0.0',
    files: ['src', 'theme.css'],
    exports: { './components/*': './src/components/*.tsx', './theme.css': './theme.css' },
  }),
  'theme.css': PACKAGE['theme.css'],
  'src/components/button.tsx': PACKAGE['src/button.tsx'],
  'src/components/card.tsx': PACKAGE['src/card.tsx'],
  'src/components/input.tsx': PACKAGE['src/input.tsx'],
};

/** The same page, importing each component by its subpath: one line longer. */
const SUBPATH_PAGE = PAGE.replace(
  'import { Badge, Button } from "@acme/ui";',
  'import { Badge } from "@acme/ui/components/badge";\nimport { Button } from "@acme/ui/components/button";',
);

async function run(args: string[], cwd: string) {
  const out: string[] = [];
  const err: string[] = [];
  const io: Io = { cwd, color: false, stdout: (t) => out.push(t), stderr: (t) => err.push(t) };
  const code = await main(args, io);
  return { code, stdout: out.join('\n'), stderr: err.join('\n') };
}

type Results = { diagnostics: { ruleId: string; line: number; message: string }[] }[];

/** `check app/page.tsx` in the app: the findings, the rules they come from, and stderr. */
async function check(app: string) {
  const { code, stdout, stderr } = await run(
    ['check', 'app/page.tsx', '--format', 'json', '--no-cache'],
    app,
  );
  const findings = (JSON.parse(stdout) as Results).flatMap((r) => r.diagnostics);
  return { code, findings, rules: new Set(findings.map((d) => d.ruleId)), stderr };
}

/** The package after `init --yes` in it, file by file, set up once for the file. */
const setUp = new Map<Record<string, string>, Promise<Record<string, string>>>();
function initialised(files: Record<string, string> = PACKAGE): Promise<Record<string, string>> {
  let pkg = setUp.get(files);
  if (!pkg) {
    pkg = initialise(files);
    setUp.set(files, pkg);
  }
  return pkg;
}

async function initialise(source: Record<string, string>): Promise<Record<string, string>> {
  const dir = fixture(source);
  expect((await run(['init', '--yes', '--no-cache'], dir)).code).toBe(0);
  const files: Record<string, string> = {};
  const walk = (rel: string) => {
    for (const entry of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
      const file = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(file);
      else files[file] = fs.readFileSync(path.join(dir, file), 'utf8');
    }
  };
  walk('');
  return files;
}

/** What npm publishes of the package: `package.json` and what its `files` list names. */
function published(pkg: Record<string, string>): Record<string, string> {
  const files = (JSON.parse(pkg['package.json'] ?? '{}') as { files: string[] }).files;
  return Object.fromEntries(
    Object.entries(pkg).filter(
      ([file]) =>
        file === 'package.json' ||
        files.some((entry) => file === entry || file.startsWith(`${entry}/`)),
    ),
  );
}

const at = (prefix: string, files: Record<string, string>) =>
  Object.fromEntries(Object.entries(files).map(([file, text]) => [`${prefix}/${file}`, text]));

/** An app that installs the package from a registry, with `pkg` in node_modules. */
function installedApp(pkg: Record<string, string>, extra: Record<string, string> = {}): string {
  return fixture({
    'package.json': json({ name: 'web', dependencies: { '@acme/ui': '1.0.0' } }),
    'app/page.tsx': PAGE,
    ...at('node_modules/@acme/ui', pkg),
    ...extra,
  });
}

/** A pnpm monorepo: the package in packages/ui, and the app in apps/web. Returns the app. */
function workspaceApp(pkg: Record<string, string>, extra: Record<string, string> = {}): string {
  const root = fixture({
    'pnpm-workspace.yaml': 'packages:\n  - apps/*\n  - packages/*\n',
    'package.json': json({ name: 'acme', private: true }),
    ...at('packages/ui', pkg),
    'apps/web/package.json': json({ name: 'web', dependencies: { '@acme/ui': 'workspace:*' } }),
    'apps/web/app/page.tsx': PAGE,
    ...at('apps/web', extra),
  });
  return path.join(root, 'apps/web');
}

const without = (files: Record<string, string>, drop: (file: string) => boolean) =>
  Object.fromEntries(Object.entries(files).filter(([file]) => !drop(file)));

/** The package's config with `edit` applied. */
function withConfig(
  pkg: Record<string, string>,
  edit: (config: Record<string, unknown>) => Record<string, unknown>,
): Record<string, string> {
  const config = JSON.parse(pkg['onsystem.config.json'] ?? '{}') as Record<string, unknown>;
  return { ...pkg, 'onsystem.config.json': json(edit(config)) };
}

/** The table's rows, as [how the app gets the package, rules that run]. */
function rows(): [string, string][] {
  return whatAppsGet
    .split('\n')
    .filter((line) => line.startsWith('| '))
    .slice(2)
    .map((line) => {
      const [, how = '', rules = ''] = line.split('|').map((cell) => cell.trim());
      return [how, rules];
    });
}

/** The rule ids a cell names: every rule for "All eight". */
function rulesIn(cell: string): Set<string> {
  if (cell.startsWith('All eight')) return new Set(RULE_IDS);
  const named = [...cell.matchAll(/`([a-z-]+)`/g)].map((m) => m[1] ?? '');
  return new Set(named.filter((id) => (RULE_IDS as readonly string[]).includes(id)));
}

/** Calls one MCP tool on the app's design system. */
async function tool(root: string, name: string, args: Record<string, unknown>): Promise<string> {
  const ds = await load(root);
  const server = createServer({ getDesignSystem: () => Promise.resolve(ds) });
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  try {
    const result = (await client.callTool({ name, arguments: args })) as CallToolResult;
    const first = result.content[0];
    return first?.type === 'text' ? first.text : '';
  } finally {
    await client.close();
  }
}

describe('what apps get from a design-system package (docs/design-system-packages.md)', () => {
  it('has a row for a workspace package and for three ways of publishing one', () => {
    expect(rows().map(([how]) => how)).toEqual([
      'As a workspace package',
      'From a registry, with the config, the token files and the component sources (`src/`) published',
      'From a registry, with the config, the token files and compiled `dist/` published, but not `src/`',
      'From a registry, without the config',
    ]);
    expect(RULE_IDS).toHaveLength(8);
  });

  it('runs every rule from a workspace package, and from one published with src/', async () => {
    const pkg = await initialised();
    const [workspace, withSources] = rows();
    expect((await check(workspaceApp(pkg))).rules).toEqual(rulesIn(workspace?.[1] ?? ''));
    expect((await check(installedApp(published(pkg)))).rules).toEqual(
      rulesIn(withSources?.[1] ?? ''),
    );
  });

  it('runs the token rules from a package published without src/, and says the component rules did not run', async () => {
    const pkg = await initialised();
    const distOnly = without(published(pkg), (file) => file.startsWith('src/'));
    expect(Object.keys(distOnly).sort()).toEqual([
      'dist/index.d.ts',
      'dist/index.mjs',
      'onsystem.config.json',
      'package.json',
      'theme.css',
    ]);
    // init's config, as published: apps import the package by one name, so it sets importPath.
    expect(JSON.parse(distOnly['onsystem.config.json'] ?? '{}')).toMatchObject({
      importPath: '@acme/ui',
    });
    const app = installedApp(distOnly);
    const { rules, findings, stderr } = await check(app);
    const cell = rows()[2]?.[1] ?? '';
    expect(cell).toContain('with `importPath` set, also `no-unknown-component`');
    expect(rules).toEqual(rulesIn(cell));
    // The icon rule runs on the native <button> only: the package's <Button> is not known.
    expect(
      findings.filter((d) => d.ruleId === 'icon-button-accessible-name').map((d) => d.line),
    ).toEqual([NATIVE_BUTTON_LINE]);
    expect(whatAppsGet).toContain('`icon-button-accessible-name` on native elements');
    // The notice, although no-unknown-component reports.
    const notice = 'No design-system components found: the component rules did not run.';
    expect(stderr).toContain(notice);
    expect(rules).toContain('no-unknown-component');
    expect(whatAppsGet).toContain(
      `\`${notice}\`, also when \`no-unknown-component\` reports, as in the next point.`,
    );
    // Agents find no component.
    expect(await tool(app, 'list_components', {})).toMatch(/^No components found/);
    expect(await tool(app, 'search_components', { query: 'button' })).toMatch(
      /^No components match/,
    );
    expect(await tool(app, 'get_component', { name: 'Button' })).toMatch(
      /^No component named "Button"/,
    );
    // check_ui reports from the same rules.
    const checked = await tool(app, 'check_ui', { path: 'app/page.tsx' });
    expect(new Set([...checked.matchAll(/ \[([a-z-]+)\] /g)].map((m) => m[1]))).toEqual(rules);
    // --require-design-system fails, with exit code 2.
    const required = await run(['check', '.', '--require-design-system', '--no-cache'], app);
    expect(required.code).toBe(2);
    expect(whatAppsGet).toContain('**`--require-design-system` fails** (exit code 2)');
  });

  it('with importPath, reports every component imported from a package published without src/, and without it, none', async () => {
    const pkg = await initialised();
    const distOnly = without(published(pkg), (file) => file.startsWith('src/'));
    const { findings } = await check(installedApp(distOnly));
    const unknown = findings.filter((d) => d.ruleId === 'no-unknown-component');
    // <Badge>, which the package does not have, and each of the three <Button>s, which it does.
    // The page says so; a change to the rule that stops this changes the page too.
    expect(unknown.map((d) => d.message.split(' (')[0])).toEqual([
      '"Badge" is not a design-system component',
      '"Button" is not a design-system component',
      '"Button" is not a design-system component',
      '"Button" is not a design-system component',
    ]);
    expect(whatAppsGet).toContain(
      '**With `importPath` set, `no-unknown-component` reports every component the app imports from the package**',
    );
    expect(whatAppsGet).toContain(
      '`init` sets `importPath` when apps import the package by one name, such as `@acme/ui`.',
    );
    // Without importPath: the rest of the row, and no no-unknown-component.
    const { rules } = await check(
      installedApp(withConfig(distOnly, ({ importPath: _, ...config }) => config)),
    );
    const expected = rulesIn(rows()[2]?.[1] ?? '');
    expected.delete('no-unknown-component');
    expect(rules).toEqual(expected);
    expect(whatAppsGet).toContain('Without it, `no-unknown-component` reports nothing either.');
  });

  it('gets nothing from a package published without its config, with a warning', async () => {
    const pkg = await initialised();
    const bare = without(
      published(pkg),
      (file) => !file.startsWith('dist/') && file !== 'package.json',
    );
    const { rules, stderr } = await check(installedApp(bare));
    expect(stderr).toContain("@acme/ui's onsystem config was skipped");
    // The app itself has no components or tokens: only the accessibility rule, on <button>.
    expect(rules).toEqual(new Set(['icon-button-accessible-name']));
    expect(rows()[3]?.[1]).toContain('the declaration is skipped with a warning');
  });

  it('runs the token rules only for what the published tokens define', async () => {
    const pkg = await initialised();
    const distOnly = without(published(pkg), (file) => file.startsWith('src/'));
    const colorsOnly = {
      ...withConfig(distOnly, ({ importPath: _, ...config }) => config),
      'theme.css': '@theme {\n  --color-primary: oklch(0.55 0.2 260);\n}\n',
    };
    expect((await check(installedApp(colorsOnly))).rules).toEqual(
      new Set(['no-hardcoded-color', 'icon-button-accessible-name']),
    );
    expect(whatAppsGet).toContain(
      '`no-hardcoded-color` when they hold colors, `no-hardcoded-spacing` and `no-hardcoded-radius` when they set a spacing scale and radii',
    );
  });
});

describe("an app's own config (docs/design-system-packages.md#in-the-apps)", () => {
  const own = json({ rules: { 'no-hardcoded-color': 'warn' } });

  it("replaces the package's: an installed package's components and tokens are gone", async () => {
    const pkg = await initialised();
    const app = installedApp(published(pkg), { 'onsystem.config.json': own });
    const { rules, stderr } = await check(app);
    expect(rules).toEqual(new Set(['icon-button-accessible-name']));
    expect(stderr).toContain('No design system found (no components or color tokens)');
    expect(inTheApps).toContain(
      "So a config that only changes a rule's severity can leave the app without the package's components and tokens, and `check` then says which rules did not run.",
    );
  });

  it('still finds a workspace package named like a design system through zero config', async () => {
    const pkg = await initialised();
    const { rules } = await check(workspaceApp(pkg, { 'onsystem.config.json': own }));
    expect(rules).toContain('no-unknown-variant');
    expect(inTheApps).toContain(
      'it finds a workspace package named like a design system, but never one installed in `node_modules`',
    );
  });

  it("gets every rule back with the package's components, importPath and tokens copied in", async () => {
    const pkg = await initialised();
    const config = JSON.parse(pkg['onsystem.config.json'] ?? '{}') as {
      importPath: string;
      tokens: string[];
    };
    const globs = {
      installed: 'node_modules/@acme/ui/src/**/*.tsx',
      workspace: '../../packages/ui/src/**/*.tsx',
    };
    expect(inTheApps).toContain(
      `\`${globs.installed}\`, or \`${globs.workspace}\` from a workspace app`,
    );
    const copied = (glob: string) =>
      json({
        components: [glob],
        importPath: config.importPath,
        tokens: config.tokens.map((t) => `${glob.split('/src/')[0]}/${t}`),
        rules: { 'no-hardcoded-color': 'warn' },
      });
    const installed = installedApp(published(pkg), {
      'onsystem.config.json': copied(globs.installed),
    });
    expect((await check(installed)).rules).toEqual(new Set(RULE_IDS));
    const workspace = workspaceApp(pkg, { 'onsystem.config.json': copied(globs.workspace) });
    expect((await check(workspace)).rules).toEqual(new Set(RULE_IDS));
  });

  it('is what init --force in the app says it gives up', async () => {
    // When it also loses the package's components or tokens, init says which and what to copy
    // (test/init-registry-apps.test.ts).
    const pkg = await initialised();
    const init = await run(
      ['init', '--yes', '--force', '--no-cache'],
      installedApp(published(pkg)),
    );
    expect(init.code).toBe(0);
    expect(init.stdout).toContain(
      "with --force it has one of its own, which is read instead, so @acme/ui's rules and later changes to its config no longer reach it.",
    );
    expect(inTheApps).toContain('`init --force` in such an app says what it loses');
  });

  it('needs importPath set to the package name for a package imported by subpath', async () => {
    const pkg = await initialised(SUBPATH_PACKAGE);
    const config = JSON.parse(pkg['onsystem.config.json'] ?? '{}') as {
      components: string[];
      tokens: string[];
    };
    // `@acme/ui/components/*` is no import that compiles, so init writes no importPath.
    expect(config).not.toHaveProperty('importPath');
    expect(inTheApps).toContain(
      "`init` writes no `importPath` for a package that apps import by subpath (`@acme/ui/components/button`), so when the package's config has none, set it to the package's name (`@acme/ui`).",
    );
    expect(inTheApps).toContain(
      "Without it, `no-unknown-component`, `no-unknown-prop`, `no-unknown-variant`, and `icon-button-accessible-name` on the package's `<Button>`, check none of the app's imports from the package, and nothing says so.",
    );
    expect(inTheApps).toContain(
      "With it, the same rules run as with the package's config, but the imports that findings and `get_component` suggest name `@acme/ui`, not the subpath.",
    );
    const page = { 'app/page.tsx': SUBPATH_PAGE };
    const iconLines = (findings: { ruleId: string; line: number }[]) =>
      findings.filter((d) => d.ruleId === 'icon-button-accessible-name').map((d) => d.line);
    const inputImport = (findings: { message: string }[]) =>
      findings.map((d) => /import \{ Input \} from "([^"]+)"/.exec(d.message)?.[1]).find(Boolean);
    const layouts = [
      ['node_modules/@acme/ui', installedApp],
      ['../../packages/ui', workspaceApp],
    ] as const;
    for (const [prefix, app] of layouts) {
      const copied = (importPath?: string) =>
        json({
          components: config.components.map((glob) => `${prefix}/${glob}`),
          ...(importPath ? { importPath } : {}),
          tokens: config.tokens.map((file) => `${prefix}/${file}`),
          rules: { 'no-hardcoded-color': 'warn' },
        });
      // No config of its own: the package's config, imports by subpath.
      const declared = await check(app(pkg, page));
      expect(declared.rules).toContain('no-unknown-prop');
      expect(declared.rules).toContain('no-unknown-variant');
      expect(iconLines(declared.findings)).toEqual([NATIVE_BUTTON_LINE, NATIVE_BUTTON_LINE + 1]);
      expect(inputImport(declared.findings)).toBe('@acme/ui/components/input');
      // Copied without importPath: the package's imports go unchecked, without a word.
      const bare = await check(app(pkg, { ...page, 'onsystem.config.json': copied() }));
      for (const rule of ['no-unknown-component', 'no-unknown-prop', 'no-unknown-variant']) {
        expect(bare.rules).not.toContain(rule);
      }
      expect(iconLines(bare.findings)).toEqual([NATIVE_BUTTON_LINE + 1]);
      expect(bare.stderr).toBe('');
      // With the package's name as importPath: the same rules as the package's config.
      const named = app(pkg, { ...page, 'onsystem.config.json': copied('@acme/ui') });
      const withName = await check(named);
      expect(withName.rules).toEqual(declared.rules);
      expect(iconLines(withName.findings)).toEqual([NATIVE_BUTTON_LINE, NATIVE_BUTTON_LINE + 1]);
      expect(inputImport(withName.findings)).toBe('@acme/ui');
      expect(await tool(named, 'get_component', { name: 'Button' })).toContain(
        'import { Button } from "@acme/ui"\n',
      );
    }
    // init --force in such an app writes the copied config without importPath.
    const forced = installedApp(pkg, page);
    expect((await run(['init', '--yes', '--force', '--no-cache'], forced)).code).toBe(0);
    const written = JSON.parse(
      fs.readFileSync(path.join(forced, 'onsystem.config.json'), 'utf8'),
    ) as Record<string, unknown>;
    expect(written).toMatchObject({
      components: ['node_modules/@acme/ui/src/components/**/*.tsx'],
    });
    expect(written).not.toHaveProperty('importPath');
    expect(inTheApps).toContain(
      '`init --force` in such an app says what it loses, but it writes no `importPath` there either.',
    );
  });
});
