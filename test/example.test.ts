import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { main, type Io } from '../src/cli.js';
import { RULE_IDS } from '../src/config.js';
import type { CheckResult } from '../src/types.js';
import { DEMO_ROOT, fixture } from './helpers.js';
import { blocks } from './markdown.js';

// The website links examples/shadcn-demo as the demo design system, so people open it from
// GitHub, and some copy the folder out (`npx degit`) to try it; the other examples are tried the
// same way. A copy has only the folder: the steps its README gives first, its scripts and the
// draft page's comment must work there, without a clone or a build of this repository, and with
// no onsystem config, as in the projects they stand for.

const EXAMPLES_ROOT = path.dirname(DEMO_ROOT);

/** Each example: its draft page (findings), its clean page (none) and what zero config finds. */
const EXAMPLES: Record<string, { draft: string; clean: string; detected: string }> = {
  'shadcn-demo': {
    draft: 'app/settings/danger-zone.tsx',
    clean: 'app/settings/members.tsx',
    detected: 'components.json (ui: @/components/ui → components/ui)',
  },
  'tailwind-v3': {
    draft: 'app/account/delete-account.tsx',
    clean: 'app/account/profile.tsx',
    detected: 'components.json (ui: @/components/ui → components/ui)',
  },
  'react-aria': {
    draft: 'src/InviteForm.tsx',
    clean: 'src/App.tsx',
    detected: 'src/components/ (7 components wrapping react-aria-components)',
  },
};

interface Manifest {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

function example(name: string) {
  const root = path.join(EXAMPLES_ROOT, name);
  const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
  const readme = read('README.md');
  const manifest = JSON.parse(read('package.json')) as Manifest;
  return {
    root,
    read,
    readme,
    manifest,
    scripts: manifest.scripts ?? {},
    /** What the README says before its section for people working on onsystem itself. */
    forVisitors: readme.split('\n## Working on onsystem\n')[0] ?? '',
  };
}

/** The `npm run` scripts a block of commands runs, in order. */
const npmRuns = (commands: string) =>
  [...commands.matchAll(/npm run ([\w:-]+)/g)].map((m) => m[1] ?? '');

/**
 * The folder copied outside the repository, with its dependencies installed: its
 * `node_modules` links each package the example has installed.
 */
function copyOf(root: string): string {
  const copy = fixture({});
  fs.cpSync(root, copy, {
    recursive: true,
    filter: (src) => path.relative(root, src).split(path.sep)[0] !== 'node_modules',
  });
  const installed = path.join(root, 'node_modules');
  fs.mkdirSync(path.join(copy, 'node_modules'));
  // Each package is linked to where it really is, as fixture() links the demo's.
  const link = (name: string) => {
    fs.symlinkSync(
      fs.realpathSync(path.join(installed, name)),
      path.join(copy, 'node_modules', name),
      'junction',
    );
  };
  for (const name of fs.readdirSync(installed)) {
    if (name.startsWith('.')) continue;
    if (!name.startsWith('@')) {
      link(name);
      continue;
    }
    fs.mkdirSync(path.join(copy, 'node_modules', name));
    for (const scoped of fs.readdirSync(path.join(installed, name))) link(`${name}/${scoped}`);
  }
  return copy;
}

/** Runs an `npm run` script of a copy, with this checkout's CLI in place of the npm release. */
async function runScript(scripts: Record<string, string>, name: string, cwd: string) {
  const script = scripts[name] ?? '';
  const npx = 'npx -y onsystem ';
  expect(script.startsWith(npx), `npm run ${name}: ${script}`).toBe(true);
  return run([...script.slice(npx.length).split(/\s+/)], cwd);
}

async function run(args: string[], cwd: string) {
  const out: string[] = [];
  const io: Io = { cwd, color: false, stdout: (t) => out.push(t), stderr: (t) => out.push(t) };
  const code = await main([...args, '--no-cache'], io);
  return { code, output: out.join('\n') };
}

/** The findings `check --format json` gives for the copy. */
async function findings(cwd: string) {
  const { output } = await run(['check', '.', '--format', 'json'], cwd);
  return (JSON.parse(output) as CheckResult[]).flatMap((r) => r.diagnostics);
}

it('tests every example', () => {
  const folders = fs
    .readdirSync(EXAMPLES_ROOT, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  expect(folders).toEqual(Object.keys(EXAMPLES).sort());
});

describe.each(Object.entries(EXAMPLES))('examples/%s outside the repository', (name, pages) => {
  const { root, read, readme, manifest, scripts, forVisitors } = example(name);
  const draft = path.basename(pages.draft);

  it('starts its README with steps that work in a copy of the folder', () => {
    const [first = ''] = blocks(readme, 'sh');
    expect(first).toContain(`npx degit dgesteves/onsystem/examples/${name} `);
    expect(first).toContain('npm install');
    expect(npmRuns(first)).toEqual(['inspect', 'check']);
    expect(first).toContain(`exits 1: ${draft} has errors`);
    // Nothing a visitor reads first needs a clone or a build of this repository.
    expect(forVisitors).not.toMatch(/\bpnpm\b|dist\/cli\.js|repository root/);
  });

  it('has the scripts the README runs, with onsystem from npm', () => {
    for (const script of npmRuns(forVisitors)) expect(scripts).toHaveProperty(script);
    // npx, not a dependency: pnpm would install the npm release in this workspace and hoist it to
    // node_modules/.pnpm/node_modules, which the NODE_PATH of pnpm's bins (vitest's among them)
    // puts in reach of every process the tests start, such as the hook's "own install" lookup.
    expect(manifest.dependencies).not.toHaveProperty('onsystem');
    expect(manifest.devDependencies).not.toHaveProperty('onsystem');
  });

  it('needs no onsystem config: zero config finds the design system', async () => {
    expect(fs.readdirSync(root).filter((f) => /^onsystem\.config\./.test(f))).toEqual([]);
    const inspect = await runScript(scripts, 'inspect', copyOf(root));
    expect(inspect.code).toBe(0);
    expect(inspect.output).toMatch(/^config\s+\(defaults\)$/m);
    expect(inspect.output.split('\n')).toContain(`detected ${pages.detected}`);
  });

  it('runs check in the copy with the results its README describes', async () => {
    const copy = copyOf(root);
    const check = await runScript(scripts, 'check', copy);
    expect(check.code).toBe(1);
    expect(check.output).toContain(pages.draft);
    expect(check.output).not.toContain(pages.clean);
    expect(check.output).toMatch(/\d+ errors?, \d+ warnings? in 1 of \d+ files checked/);
    // The README's table says what check reports on the draft, and that the clean page passes.
    const count = (await findings(copy)).length;
    const row = (page: string) =>
      readme.split('\n').find((line) => line.startsWith(`| \`${page}\``)) ?? '';
    expect(row(pages.draft)).toContain(`\`check\` reports ${String(count)} problems`);
    expect(row(pages.clean)).toContain('`check` reports nothing.');
  });

  it('names a script the copy has in the draft page', () => {
    const comment = read(pages.draft).split('\n').slice(0, 2).join('\n');
    const [named] = npmRuns(comment);
    expect(named, comment).toBeDefined();
    expect(scripts).toHaveProperty(named ?? '');
  });

  it('keeps node_modules out of git in a copy', () => {
    expect(read('.gitignore').split('\n')).toContain('node_modules');
  });

  it('is typechecked in CI', () => {
    expect(scripts.typecheck).toBe('tsc --noEmit');
    const ci = parse(
      fs.readFileSync(path.join(root, '../../.github/workflows/ci.yml'), 'utf8'),
    ) as {
      jobs: Record<string, { steps: { run?: string }[] }>;
    };
    const runs = Object.values(ci.jobs).flatMap((job) => job.steps.map((s) => s.run ?? ''));
    expect(runs).toContain('pnpm --filter "./examples/*" typecheck');
  });
});

describe('examples/shadcn-demo', () => {
  const { root, readme, forVisitors } = example('shadcn-demo');

  it('reports at least one problem for each rule on the draft page, as its README says', async () => {
    const rules = new Set((await findings(copyOf(root))).map((d) => d.ruleId));
    expect([...rules].sort()).toEqual([...RULE_IDS].sort());
    expect(readme).toContain(
      `at least one for each of onsystem's ${String(RULE_IDS.length)} rules`,
    );
  });

  it('reads the docs from docs/components, where zero config looks', async () => {
    const inspect = await run(['inspect'], copyOf(root));
    expect(inspect.output).toMatch(/^files\s+5 component files, 1 token file, 5 docs$/m);
    // The README says to install first: Dialog's props come from Radix's types.
    expect(inspect.output).toMatch(/^\s+Dialog\s+[1-9]\d* props/m);
    expect(forVisitors).toContain("`Dialog`'s come from Radix");
  });
});

describe('examples adapted from shadcn/ui', () => {
  it.each(['shadcn-demo', 'tailwind-v3'])('%s keeps shadcn/ui’s MIT notice', (name) => {
    const { read, readme } = example(name);
    expect(readme).toContain('[MIT](LICENSE-shadcn)');
    const license = read('LICENSE-shadcn');
    expect(license).toContain('Copyright (c) 2023 shadcn');
    expect(license).toContain('The above copyright notice and this permission notice');
  });
});

describe("examples adapted from React Aria's Tailwind starter", () => {
  it('react-aria says so and keeps its Apache-2.0 license', () => {
    const { read, readme } = example('react-aria');
    expect(readme).toContain(
      'adapted from the [React Aria Tailwind starter](https://github.com/adobe/react-spectrum/tree/main/starters/tailwind) by Adobe ([Apache-2.0](LICENSE-react-aria)), changed for this example',
    );
    expect(readme).not.toContain('written for this example');
    // The license as react-spectrum publishes it, with Adobe's copyright line.
    const license = read('LICENSE-react-aria');
    expect(license).toMatch(/^\s+Apache License\n\s+Version 2\.0, January 2004\n/);
    expect(license).toContain('Copyright 2019 Adobe');
    expect(license).toContain('4. Redistribution.');
  });
});

describe('examples/tailwind-v3', () => {
  const { root } = example('tailwind-v3');

  it('reads the v3 tokens: HSL channels, named by tailwind.config.ts', async () => {
    const { output } = await run(['check', '.'], copyOf(root));
    expect(output).toContain(
      'Hardcoded color `text-[#71717a]`. Matches token muted-foreground (exact match) → `text-muted-foreground`.',
    );
    expect(output).toContain(
      'Matches token muted (ΔE 0.001, same value as secondary, accent) → `bg-muted`.',
    );
  });
});

describe('examples/react-aria', () => {
  const { root, forVisitors } = example('react-aria');

  it("suggests React Aria's prop names, from its types", async () => {
    const { output } = await run(['check', '.'], copyOf(root));
    expect(output).toContain('<Checkbox> has no prop "checked". Did you mean "isSelected"?');
    expect(output).toContain('<Switch> has no prop "disabled". Did you mean "isDisabled"?');
    expect(forVisitors).toContain('`check` cannot tell that `checked` should be `isSelected`');
  });
});
