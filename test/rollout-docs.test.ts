import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { cli, onChangedLines, parseDiff } from '../action/check.mjs';
import { main, type Io } from '../src/cli.js';
import { DEMO_ROOT, fixture, load } from './helpers.js';
import { section } from './markdown.js';

// docs/rollout.md: the files a team commits so every agent and pull request is held to the
// design system. Each one is checked against what defines it: the marketplace in this
// repository, the configs docs/clients.md and docs/eslint.md show, and the workflow in
// docs/required-check.md.

const root = path.resolve(import.meta.dirname, '..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file: string) => fs.existsSync(path.join(root, file));
const rollout = exists('docs/rollout.md') ? read('docs/rollout.md') : '';

/** The code block whose fence names `title` (```json title=".claude/settings.json"). */
function titled(markdown: string, title: string): string {
  const fence = new RegExp(
    `\`\`\`\\w*[^\\n]*\\btitle="${title.replace(/\./g, '\\.')}"[^\\n]*\\n([\\s\\S]*?)\`\`\``,
  );
  const block = fence.exec(markdown)?.[1];
  if (block === undefined) throw new Error(`no code block titled ${title}`);
  return block;
}

/** The first code block after `text` (a "`.cursor/mcp.json`:" line). */
function after(markdown: string, text: string): string {
  const start = markdown.indexOf(text);
  if (start === -1) throw new Error(`"${text}" not found`);
  const block = /```[^\n]*\n([\s\S]*?)```/.exec(markdown.slice(start + text.length))?.[1];
  if (block === undefined) throw new Error(`no code block after "${text}"`);
  return block;
}

/** The `##` headings between the page's steps markers, in order. */
function steps(markdown: string): string[] {
  const body = markdown.slice(
    markdown.indexOf('<!-- steps -->'),
    markdown.indexOf('<!-- /steps -->'),
  );
  return [...body.matchAll(/^## (.+)$/gm)].map((m) => m[1] ?? '');
}

function git(cwd: string, ...args: string[]): string {
  const result = spawnSync(
    'git',
    [
      '-c',
      'user.name=onsystem test',
      '-c',
      'user.email=test@example.com',
      '-c',
      'commit.gpgsign=false',
      '-c',
      'init.defaultBranch=main',
      ...args,
    ],
    { cwd, encoding: 'utf8' },
  );
  if (result.status !== 0) throw new Error(`git ${args.join(' ')}: ${result.stderr}`);
  return result.stdout;
}

interface Workflow {
  on: unknown;
  jobs: Record<string, { strategy?: { matrix?: { app?: string[] } }; steps: Step[] }>;
}
interface Step {
  uses?: string;
  run?: string;
  with?: Record<string, unknown>;
}

describe('the team rollout page (docs/rollout.md)', () => {
  it('is a docs page', () => {
    expect(exists('docs/rollout.md')).toBe(true);
    expect(rollout).toMatch(/^# Roll out to a team\n/);
  });

  it('goes in an order where nothing fails before the baseline is recorded', () => {
    const order = steps(rollout);
    expect(order).toEqual([
      'Pin the version',
      'Set up the design system',
      'Record the baseline',
      'Give every agent the design system',
      'Add it to ESLint',
      'Gate pull requests',
    ]);
  });

  it("turns the plugin on with this repository's marketplace, which needs no install per person", () => {
    const marketplace = JSON.parse(read('.claude-plugin/marketplace.json')) as {
      name: string;
      plugins: { name: string; source: unknown }[];
    };
    const plugin = marketplace.plugins.find((p) => p.name === 'onsystem');
    // A plugin the marketplace lists by a relative path loads from the marketplace once the
    // folder is trusted; one with an external source would need `claude plugin install` too.
    expect(plugin?.source).toMatch(/^\.\//);
    const settings: unknown = JSON.parse(titled(rollout, '.claude/settings.json'));
    expect(settings).toEqual({
      extraKnownMarketplaces: {
        [marketplace.name]: { source: { source: 'github', repo: 'dgesteves/onsystem' } },
      },
      enabledPlugins: { [`onsystem@${marketplace.name}`]: true },
    });
    const agents = section(rollout, 'Give every agent the design system');
    expect(agents).toContain('trust dialog');
    expect(agents).toContain('with no `/plugin install`');
    expect(agents).toContain('start it at the root');
    // The plugin and a .mcp.json entry register the same tools twice.
    expect(agents).toContain('No `.mcp.json` entry for onsystem');
    // A .mcp.json committed for the other clients is turned off for Claude Code, as
    // docs/clients.md says.
    expect(agents).toContain('`"disabledMcpjsonServers": ["onsystem"]`');
  });

  it('commits the Cursor and VS Code configs that docs/clients.md shows', () => {
    const clients = read('docs/clients.md');
    for (const file of ['.cursor/mcp.json', '.vscode/mcp.json']) {
      expect(titled(rollout, file), file).toBe(after(clients, `\`${file}\`:`));
    }
  });

  it('gives AGENTS.md the line docs/clients.md suggests, and the CLI for agents without the tools', async () => {
    const line = /_"(Before writing UI[^"]+)"_/.exec(read('docs/clients.md'))?.[1];
    expect(line).toBeDefined();
    const agents = titled(rollout, 'AGENTS.md');
    expect(agents.startsWith(String(line))).toBe(true);
    const command = /`npx onsystem check <file>`/.exec(agents)?.[0];
    expect(command).toBeDefined();
    // What it tells those agents to run checks one file and fails on its errors.
    const io: Io = { cwd: DEMO_ROOT, color: false, stdout: () => {}, stderr: () => {} };
    expect(await main(['check', 'app/settings/danger-zone.tsx', '--no-cache'], io)).toBe(1);
  });

  it('adds the ESLint config docs/eslint.md recommends', () => {
    expect(titled(rollout, 'eslint.config.mjs')).toBe(
      titled(read('docs/eslint.md'), 'eslint.config.mjs'),
    );
  });

  it('runs the required-check workflow on every line, reporting only at first', () => {
    const page = parse(titled(rollout, '.github/workflows/onsystem.yml')) as Workflow;
    const required = parse(
      titled(read('docs/required-check.md'), '.github/workflows/onsystem.yml'),
    ) as Workflow;
    // The job keeps the name the check is required by, and the steps before the action.
    expect(Object.keys(page.jobs)).toEqual(['onsystem']);
    expect(page.on).toEqual(required.on);
    const steps = page.jobs.onsystem?.steps ?? [];
    expect(steps.slice(0, -1)).toEqual(required.jobs.onsystem?.steps.slice(0, -1));
    expect(steps.at(-1)).toEqual({
      uses: 'dgesteves/onsystem@v0',
      with: { 'only-changed-lines': false, 'fail-on': 'none' },
    });
    const gate = section(rollout, 'Gate pull requests');
    expect(gate).toContain('](required-check.md)');
    expect(gate).toContain('Remove `fail-on: none`');
    expect(gate).toContain('(required-check.md#make-the-check-required)');
  });

  it('gives the steps for a pnpm repository, as a pnpm monorepo is', () => {
    const npm =
      (parse(titled(rollout, '.github/workflows/onsystem.yml')) as Workflow).jobs.onsystem?.steps ??
      [];
    const setupNode = npm.find((step) => step.uses?.startsWith('actions/setup-node@'));
    expect(npm.map((step) => step.run).filter(Boolean)).toEqual(['npm ci']);
    // `cache: npm` and `npm ci` both need a package-lock.json. pnpm is set up before Node, so that
    // setup-node can cache its store, and installs from pnpm-lock.yaml.
    const { steps } = parse(after(section(rollout, 'Gate pull requests'), 'With pnpm')) as {
      steps: Step[];
    };
    expect(steps).toEqual([
      npm[0],
      { uses: 'pnpm/action-setup@v6' },
      { ...setupNode, with: { ...setupNode?.with, cache: 'pnpm' } },
      { run: 'pnpm install --frozen-lockfile' },
      npm.at(-1),
    ]);
  });

  it('brings the baseline up to date in the pull request that makes the check fail', () => {
    // While `fail-on: none` is on, pull requests merge new findings that the baseline does not
    // have, and with every line checked, the first failing run would fail on all of them.
    const gate = section(rollout, 'Gate pull requests');
    expect(gate).toContain(
      "So in the pull request that removes `fail-on: none`, first run `npx onsystem check .` where CI runs it, and fix what is new or record it with `npx onsystem check . --update-baseline`, which the baseline's code owners review. The first required run then passes.",
    );
  });

  it('says why: a variant removed from the design system breaks a line the pull request did not change', async () => {
    // The demo with a page on Button's `link` variant, and a pull request that drops the variant.
    const root = fixture({});
    fs.cpSync(DEMO_ROOT, root, {
      recursive: true,
      filter: (src) => path.relative(DEMO_ROOT, src) !== 'node_modules',
    });
    const page = 'app/empty-state.tsx';
    fs.writeFileSync(
      path.join(root, page),
      'import { Button } from "@/components/ui/button"\n\nexport function EmptyState() {\n  return <Button variant="link">Learn more</Button>\n}\n',
    );
    git(root, 'init', '--quiet');
    git(root, 'add', '.');
    git(root, 'commit', '--quiet', '--no-verify', '-m', 'base');
    const button = path.join(root, 'components/ui/button.tsx');
    const source = fs.readFileSync(button, 'utf8');
    fs.writeFileSync(button, source.replace(/\n\s*link: "[^"]*",/, ''));
    expect(fs.readFileSync(button, 'utf8')).not.toBe(source);
    // The Action's own diff flags, as test/required-check.test.ts runs them.
    const diff = git(
      root,
      'diff',
      '--no-color',
      '--unified=0',
      '--src-prefix=a/',
      '--dst-prefix=b/',
      'HEAD',
      '--',
    );
    const ds = await load(root);
    const findings = ds
      .check(fs.readFileSync(path.join(root, page), 'utf8'), page)
      .diagnostics.filter((d) => d.ruleId === 'no-unknown-variant')
      .map((d) => ({ ...d, file: page }));
    expect(findings.map((d) => d.source)).toEqual(['"link"']);
    // On the changed lines, the default, the pull request passes; every line catches it.
    const { reported, outside } = onChangedLines(findings, parseDiff(diff));
    expect(reported).toEqual([]);
    expect(outside).toHaveLength(1);
    expect(section(rollout, 'Gate pull requests')).toContain(
      'a pull request that removes a variant from `packages/ui` passes while an app still uses it',
    );
  });

  it('keeps one baseline where the check runs, owned in CODEOWNERS', () => {
    const baseline = section(rollout, 'Record the baseline');
    expect(baseline).toContain('npx onsystem check . --update-baseline');
    expect(baseline).toContain('(configuration.md#monorepo-roots)');
    expect(titled(baseline, '.github/CODEOWNERS')).toMatch(/^\/onsystem\.baseline\.json @/m);
    // init in the package offers a baseline of its own, which CI at the root would not read; in a
    // single app, it records it where CI runs.
    const setup = section(rollout, 'Set up the design system');
    expect(setup).toContain('In a single app, run `npx onsystem init` in the app, and answer yes');
    expect(setup).toContain('In a package, answer no when it offers a baseline');
  });

  it('skips the CI section of the ONSYSTEM.md init writes in a package, which records a baseline per app', async () => {
    const root = fixture({
      'pnpm-workspace.yaml': 'packages:\n  - apps/*\n  - packages/*\n',
      'package.json': JSON.stringify({ name: 'acme', private: true }),
      'packages/ui/package.json': JSON.stringify({ name: '@acme/ui', private: true }),
      'packages/ui/src/button.tsx':
        'export function Button(props: { variant?: "default" | "outline"; children?: unknown }) { return <button /> }\n',
      'packages/ui/src/globals.css': ':root {\n  --primary: oklch(0.55 0.2 260);\n}\n',
    });
    const ui = path.join(root, 'packages/ui');
    const io: Io = { cwd: ui, color: false, stdout: () => {}, stderr: () => {} };
    const where = ['--components', 'src/button.tsx', '--tokens', 'src/globals.css'];
    expect(await main(['init', '--yes', '--no-cache', ...where], io)).toBe(0);
    const ci = section(fs.readFileSync(path.join(ui, 'ONSYSTEM.md'), 'utf8'), 'CI');
    expect(ci).toContain('In the app, record the findings it already has once');
    expect(ci).toContain('npx onsystem check . --update-baseline');
    expect(section(rollout, 'Set up the design system')).toContain(
      "Skip `ONSYSTEM.md`'s CI section too, which has each app record a baseline in its own folder: it is for apps outside this repository",
    );
  });

  it('names the check of each job in a matrix per app', () => {
    const perApp = section(rollout, 'A job per app');
    const block = /```yaml\n([\s\S]*?)```/.exec(perApp)?.[1] ?? '';
    const job = (parse(block) as Workflow).jobs.onsystem;
    const apps = job?.strategy?.matrix?.app ?? [];
    expect(apps.length).toBeGreaterThan(1);
    expect(job?.steps.at(-1)?.with?.['working-directory']).toBe('apps/${{ matrix.app }}');
    // Per app too, the check reports before it is required.
    expect(job?.steps.at(-1)?.with?.['fail-on']).toBe('none');
    expect(perApp).toContain(
      "with `npx onsystem check .` run in each app's folder before you remove `fail-on: none`",
    );
    for (const app of apps) expect(perApp).toContain(`\`onsystem (${app})\``);
  });

  it('upgrades through the dev dependency, which the action runs, and pins the action for the rest', () => {
    const upgrade = section(rollout, 'Upgrade');
    expect(upgrade).toContain('To upgrade, bump the dev dependency in a pull request of its own.');
    expect(upgrade).toContain(
      'git ls-remote https://github.com/dgesteves/onsystem refs/tags/onsystem@<version>',
    );
    expect(upgrade).toContain('uses: dgesteves/onsystem@<commit> # onsystem <version>');
    // The action runs the project's install, as the hook does; without one, the CLI of its own
    // release.
    const app = fixture({
      'node_modules/onsystem/package.json': JSON.stringify({
        name: 'onsystem',
        version: '0.0.1',
        bin: { onsystem: 'dist/cli.js' },
      }),
      'node_modules/onsystem/dist/cli.js': '',
    });
    expect(cli({}, root, { cwd: app, top: app }).installed?.version).toBe('0.0.1');
    const { version } = JSON.parse(read('package.json')) as { version: string };
    expect(cli({}, root).args).toEqual(['--yes', `onsystem@${version}`]);
  });
});
