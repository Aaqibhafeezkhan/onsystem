import fs from 'node:fs';
import path from 'node:path';

import { BASELINE_FILE, LEGACY_BASELINE_FILE } from './baseline.js';
import {
  CONFIG_FILES,
  DEFAULT_DOCS,
  LEGACY_CONFIG_FILES,
  type LoadConfigOptions,
  type ResolvedConfig,
} from './config.js';
import { componentFiles, tokenFiles } from './design-system.js';
import { declaredConfig, isDesignSystemName, PACKAGE_FIELD } from './detect.js';
import { matchesGlob, relativePath } from './util/paths.js';
import { NAME } from './version.js';
import { loadTarget } from './workspace.js';

/** What `init` needs from the CLI it runs in. */
export interface InitIo {
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
  /** Asks a question and resolves to the answer; undefined when there is no terminal to ask in. */
  prompt?: ((question: string) => Promise<string>) | undefined;
}

export interface InitOptions {
  yes: boolean;
  force: boolean;
  cache: boolean;
}

/** Runs `check` the way the CLI does, with its output captured. */
export type RunCheck = (
  args: string[],
  io: InitIo,
) => Promise<{ code: number; stdout: string; stderr: string }>;

const SCHEMA = 'https://unpkg.com/onsystem/schema.json';
/** More detected globs than this are files, not folders: zero config keeps them. */
const MAX_GLOBS = 6;

/** What a design-system package's apps are told about it, next to its config. */
export const GUIDE_FILE = 'ONSYSTEM.md';

/**
 * Writes `onsystem.config.json` in the root from what zero config finds there, or from
 * the answers to up to three questions when it finds nothing, then checks the project
 * once without failing and offers to record what it found as the baseline.
 *
 * In a design-system package (one zero config reads through its own `exports`, or named like
 * one, as apps look for it), it also declares the config in package.json
 * (`"onsystem": "./onsystem.config.json"`, and in `files` when the package lists them), so
 * every app that depends on the package reads it, and writes ONSYSTEM.md, which tells those
 * apps' teams how to add the agent tools and the CI check. In an app that takes on such a
 * package's config, it writes no config of its own unless --force says to.
 */
export async function init(
  configOptions: LoadConfigOptions,
  options: InitOptions,
  io: InitIo,
  runCheck: RunCheck,
): Promise<number> {
  const target = await loadTarget({ ...configOptions, config: undefined });
  const { config, workspace } = target;
  const root = config.root;
  const declared = declaredConfig(root);
  const existing =
    [...CONFIG_FILES, ...LEGACY_CONFIG_FILES]
      .map((name) => path.join(root, name))
      .find((file) => fs.existsSync(file)) ??
    (declared && 'file' in declared ? declared.file : undefined);
  const manifest = readManifest(root);
  const name = typeof manifest?.json.name === 'string' ? manifest.json.name : undefined;
  // A package apps depend on for its components: what zero config reads in it through its
  // exports, or a name like the ones apps' zero config looks for.
  const designSystem =
    !workspace &&
    !config.designSystemPackage &&
    name !== undefined &&
    (config.detected?.startsWith('package.json exports of') === true || isDesignSystemName(name));
  if (existing && !options.force) {
    // --force would replace a design-system package's config; declaring it keeps it.
    const share =
      designSystem && !declared && existing.endsWith('.json')
        ? ` To share it with the apps that depend on ${name}, add "${PACKAGE_FIELD}": "./${path.basename(existing)}" to package.json, and to "files" when it lists them (https://onsystem.vercel.app/docs/design-system-packages).`
        : '';
    io.stderr(
      `init: ${relativePath(io.cwd, existing) || existing} already exists. Run \`${NAME} inspect --explain\` to see what it resolves to, or pass --force to write a new onsystem.config.json.${share}`,
    );
    return 2;
  }
  const ask = options.yes ? undefined : io.prompt;

  const file: Record<string, unknown> = { $schema: SCHEMA };
  const notes: string[] = [];
  const relative = (abs: string) => relativePath(root, abs);
  // An app on a design-system package that declares its config needs none of its own.
  const inherited = options.force ? undefined : config.designSystemPackage;
  if (inherited) {
    notes.push(
      `This project takes on the config ${inherited.name} declares in its package.json (${relativePath(io.cwd, inherited.config) || inherited.config}), so it needs none of its own; nothing was written. Pass --force to write one, which is read instead.`,
    );
  } else if (configOptions.components?.length) {
    file.components = configOptions.components;
    if (configOptions.tokens?.length) file.tokens = configOptions.tokens;
    if (configOptions.docs?.length) file.docs = configOptions.docs;
  } else if (workspace) {
    // At a monorepo root, each project keeps zero config; the file holds what they share.
    notes.push(
      `This is a monorepo root: ${workspace.projects.length} of ${workspace.projects.length + workspace.others.length} workspace packages have a design system (${workspace.projects.map((p) => p.dir).join(', ') || 'none'}). Each keeps zero config; rules and overrides you add here apply to every project without a config of its own.`,
    );
  } else if (config.detected) {
    notes.push(`Found the design system through ${config.detected}.`);
    const specifiers = new Set((config.imports ?? []).map((m) => m.specifier));
    const tokens = (await tokenFiles(config)).map(relative);
    if (specifiers.size > 1) {
      notes.push(
        `"components" is left to zero config: apps import them by ${specifiers.size} specifiers from the package's exports (${[...specifiers].slice(0, 2).join(', ')}, …), which a config cannot spell.`,
      );
    } else if (config.components.length > MAX_GLOBS) {
      notes.push(
        `"components" is left to zero config: it found ${config.components.length} files through the package's exports, which it keeps following as the package changes.`,
      );
    } else {
      // The detected globs, spelled out; a package imported by one name keeps it.
      file.components = config.components;
      if ([...specifiers][0]) file.importPath = [...specifiers][0];
      // Docs found next to the detected components stay found.
      const docs = config.docs.filter((d) => !DEFAULT_DOCS.includes(d));
      if (docs.length) file.docs = [...DEFAULT_DOCS, ...docs];
    }
    if (tokens.length) file.tokens = tokens;
  } else if ((await componentFiles(config)).length) {
    // Nothing detected, but the default folders hold components (`components/ui` without a
    // components.json), as `check` and `inspect` find them: spell out the ones that match.
    const matching: string[] = [];
    for (const glob of config.components) {
      if ((await componentFiles({ ...config, components: [glob] })).length) matching.push(glob);
    }
    notes.push(`Found the design system in the default folders: ${matching.join(', ')}.`);
    file.components = matching;
    const tokens = (await tokenFiles(config)).map(relative);
    if (tokens.length) file.tokens = tokens;
  } else {
    if (!ask) {
      io.stderr(
        `init: zero config found no design system in ${root}. Pass --components (and --tokens) to say where it is, or run init in a terminal to answer a few questions. \`${NAME} inspect --explain\` shows what it looked at.`,
      );
      return 2;
    }
    io.stdout(`Zero config found no design system in ${root}.`);
    let components = '';
    for (let attempt = 0; attempt < 3 && !components; attempt++) {
      const answer = (
        await ask(
          'Where are the components? A glob from the root, e.g. src/components/ui/**/*.tsx: ',
        )
      ).trim();
      if (!answer) continue;
      const matches = await componentFiles({ ...config, components: [answer] });
      if (matches.length) components = answer;
      else io.stdout(`No file matches ${answer}.`);
    }
    if (!components) {
      io.stderr('init: no components given; nothing written.');
      return 2;
    }
    file.components = [components];
    const tokens = (
      await ask('Where are the tokens? A CSS or DTCG .json file, or leave it empty: ')
    ).trim();
    if (tokens) {
      if (!fs.existsSync(path.resolve(root, tokens)) && !/[*?{]/.test(tokens)) {
        io.stdout(`${tokens} does not exist; it is left out.`);
      } else file.tokens = [tokens];
    }
    const importPath = (
      await ask(
        'How do apps import them? A package name such as @acme/ui, or leave it empty for tsconfig paths: ',
      )
    ).trim();
    if (importPath) file.importPath = importPath;
  }

  const written: string[] = [];
  if (!inherited) {
    const out = path.join(root, CONFIG_FILE);
    fs.writeFileSync(out, `${JSON.stringify(file, null, 2)}\n`);
    written.push(CONFIG_FILE);
  }
  if (designSystem && manifest && name) {
    written.push(...declarePackage(root, manifest, name, options.force, notes));
    const shipped = await unshipped(config, manifest.json);
    if (shipped) notes.push(shipped);
  }
  for (const note of notes) io.stdout(note);
  if (written.length) {
    io.stdout(
      `Wrote ${written.map((f) => relativePath(io.cwd, path.join(root, f)) || f).join(', ')}.`,
    );
  }

  // A dry run: what `check .` reports with this config, by rule, without failing.
  const checkIo = { ...io, cwd: root };
  const dry = await runCheck(
    ['check', '.', '--format', 'json', ...(options.cache ? [] : ['--no-cache'])],
    checkIo,
  );
  let results: { diagnostics: { ruleId: string; severity: string }[] }[] = [];
  try {
    results = JSON.parse(dry.stdout || '[]') as typeof results;
  } catch {
    io.stderr(`init: the dry run did not finish: ${dry.stderr.split('\n')[0] ?? ''}`);
    return 1;
  }
  const byRule = new Map<string, number>();
  let errors = 0;
  let warnings = 0;
  for (const result of results) {
    for (const d of result.diagnostics) {
      byRule.set(d.ruleId, (byRule.get(d.ruleId) ?? 0) + 1);
      if (d.severity === 'error') errors++;
      else warnings++;
    }
  }
  const flagged = results.filter((r) => r.diagnostics.length).length;
  const total = errors + warnings;
  io.stdout(
    total
      ? `Dry run of \`${NAME} check .\`: ${count(errors, 'error')} and ${count(warnings, 'warning')} in ${flagged} of ${count(results.length, 'file')}. By rule: ${[
          ...byRule,
        ]
          .sort((a, b) => b[1] - a[1])
          .map(([rule, n]) => `${rule} ${n.toLocaleString('en-US')}`)
          .join(', ')}.`
      : `Dry run of \`${NAME} check .\`: no problems in ${count(results.length, 'file')}.`,
  );
  for (const line of dry.stderr.split('\n').filter(Boolean)) io.stdout(line);

  // An existing codebase starts with findings: record them, so CI fails only on new ones.
  const hasBaseline = [BASELINE_FILE, LEGACY_BASELINE_FILE].some((name) =>
    fs.existsSync(path.join(root, name)),
  );
  let baselineWritten = false;
  if (total && !hasBaseline) {
    const answer = options.yes
      ? 'y'
      : ask
        ? (
            await ask(
              `Record these ${total.toLocaleString('en-US')} findings in ${BASELINE_FILE}, so check fails only on new ones? [Y/n] `,
            )
          )
            .trim()
            .toLowerCase()
        : undefined;
    if (answer === undefined) {
      io.stdout(
        `No terminal to ask in, so the baseline question was skipped and no baseline was written; \`${NAME} check . --update-baseline\` records one.`,
      );
    } else if (answer === '' || answer.startsWith('y')) {
      const recorded = await runCheck(
        ['check', '.', '--update-baseline', ...(options.cache ? [] : ['--no-cache'])],
        checkIo,
      );
      if (recorded.stdout) io.stdout(recorded.stdout);
      baselineWritten = fs.existsSync(path.join(root, BASELINE_FILE));
    } else {
      io.stdout(`No baseline written; \`${NAME} check . --update-baseline\` records one later.`);
    }
  }
  const commit = [...written, ...(baselineWritten ? [BASELINE_FILE] : [])];
  const files =
    commit.length > 1 ? `${commit.slice(0, -1).join(', ')} and ${commit.at(-1) ?? ''}` : commit[0];
  io.stdout(
    designSystem && name
      ? `Next: commit ${files}. An app that depends on ${name} now finds it with no config of its own: run \`npx ${NAME} inspect\` in one to see it, and give its team ${GUIDE_FILE}.`
      : `Next: ${files ? `commit ${files}, and ` : ''}run \`npx ${NAME} check . --format github --require-design-system\` in CI.`,
  );
  return 0;
}

const CONFIG_FILE = 'onsystem.config.json';

/** A package.json as read, with the indentation to write it back in. */
interface Manifest {
  file: string;
  json: Record<string, unknown>;
  indent: string;
  newline: boolean;
}

function readManifest(root: string): Manifest | undefined {
  const file = path.join(root, 'package.json');
  try {
    const text = fs.readFileSync(file, 'utf8');
    const json = JSON.parse(text) as unknown;
    if (!json || typeof json !== 'object' || Array.isArray(json)) return undefined;
    return {
      file,
      json: json as Record<string, unknown>,
      indent: /^([ \t]+)"/m.exec(text)?.[1] ?? '  ',
      newline: text.endsWith('\n'),
    };
  } catch {
    return undefined;
  }
}

/**
 * Declares the config in the package's package.json, `"onsystem": "./onsystem.config.json"`,
 * and adds it to `files` when the package lists the files it publishes, so apps that install it
 * get it too. Writes ONSYSTEM.md for the apps' teams unless one exists. Returns what it wrote.
 */
function declarePackage(
  root: string,
  manifest: Manifest,
  name: string,
  force: boolean,
  notes: string[],
): string[] {
  const written: string[] = [];
  const { json } = manifest;
  const value = `./${CONFIG_FILE}`;
  let changed = false;
  if (json[PACKAGE_FIELD] !== value) {
    json[PACKAGE_FIELD] = value;
    changed = true;
  }
  const files = Array.isArray(json.files) ? (json.files as unknown[]) : undefined;
  if (files && !ships(files, CONFIG_FILE)) {
    files.push(CONFIG_FILE);
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(
      manifest.file,
      `${JSON.stringify(json, null, manifest.indent)}${manifest.newline ? '\n' : ''}`,
    );
    written.push('package.json');
  }
  notes.push(
    `This is a design-system package: package.json declares its config ("${PACKAGE_FIELD}": "${value}"${files ? ', also added to "files"' : ''}), which every app that depends on ${name} reads when it has no config of its own.`,
  );
  const guide = path.join(root, GUIDE_FILE);
  if (force || !fs.existsSync(guide)) {
    fs.writeFileSync(guide, consumerGuide(name));
    written.push(GUIDE_FILE);
  } else {
    notes.push(`${GUIDE_FILE} already exists; it was left as it is (--force replaces it).`);
  }
  return written;
}

/**
 * What apps that install the package from a registry will not find: the component and token
 * files its `files` list leaves out of the published package. Undefined for a private package,
 * one without a `files` list (npm then ships everything), or when nothing is left out.
 */
async function unshipped(
  config: ResolvedConfig,
  json: Record<string, unknown>,
): Promise<string | undefined> {
  if (json.private === true || !Array.isArray(json.files)) return undefined;
  const files = json.files as unknown[];
  const relative = [...(await componentFiles(config)), ...(await tokenFiles(config))]
    .map((f) => relativePath(config.root, f))
    .filter((f) => !f.startsWith('../'));
  const missing = relative.filter((f) => !ships(files, f));
  if (!missing.length) return undefined;
  const folders = [
    ...new Set(missing.map((f) => (f.includes('/') ? `${f.slice(0, f.indexOf('/'))}/` : f))),
  ];
  return `Apps that install ${typeof json.name === 'string' ? json.name : 'the package'} from a registry get only what "files" in package.json publishes, which leaves out ${folders.join(', ')} (${count(missing.length, 'component or token file')}): they will not find those. Add ${folders.length === 1 ? 'it' : 'them'} to "files" for them; workspace apps read the sources either way.`;
}

/** Whether npm's `files` list publishes `file`, a path relative to the package. */
function ships(files: readonly unknown[], file: string): boolean {
  return files.some((entry) => {
    if (typeof entry !== 'string') return false;
    const pattern = entry.replace(/^\.?\//, '').replace(/\/+$/, '');
    if (!pattern || pattern.startsWith('!')) return false;
    return (
      file === pattern ||
      file.startsWith(`${pattern}/`) ||
      matchesGlob(file, pattern) ||
      matchesGlob(file, `${pattern}/**`)
    );
  });
}

/** ONSYSTEM.md: how an app that uses the package gets the design system to its agents and CI. */
function consumerGuide(name: string): string {
  return `${[
    `# onsystem in apps that use ${name}`,
    '',
    `${name} declares its [onsystem](https://onsystem.vercel.app) config in its package.json: \`"${PACKAGE_FIELD}": "./${CONFIG_FILE}"\`. An app that depends on ${name}, as a workspace package or installed from npm, reads that config when it has none of its own, and its UI is checked against ${name}'s components, props, variants and tokens. To see what an app finds, run this in its folder:`,
    '',
    '```sh',
    `npx -y ${NAME} inspect`,
    '```',
    '',
    `An app with an ${CONFIG_FILE} of its own reads that instead.`,
    '',
    '## Coding agents',
    '',
    'Claude Code: the plugin checks every UI file the agent writes and hands the errors back to fix, and adds the MCP server and a skill.',
    '',
    '```text',
    '/plugin marketplace add dgesteves/onsystem',
    '/plugin install onsystem@dgesteves',
    '```',
    '',
    `Other agents: \`npx skills add dgesteves/onsystem\` adds the skill, and \`npx -y ${NAME}\` started in the app is the MCP server. [Set up your agent](https://onsystem.vercel.app/docs/clients) has the config for each client.`,
    '',
    '## CI',
    '',
    'In the app, record the findings it already has once, and commit the baseline, so pull requests fail only on new ones:',
    '',
    '```sh',
    `npm install --save-dev ${NAME}`,
    `npx ${NAME} check . --update-baseline`,
    '```',
    '',
    '```yaml',
    `- run: npx ${NAME} check . --format github --require-design-system`,
    '```',
    '',
    '[CI and baselines](https://onsystem.vercel.app/docs/ci) has the GitHub Action and the rest.',
    '',
    '## Changing the config',
    '',
    `${CONFIG_FILE} in ${name} sets what every app gets: where the components, tokens and docs are, and the rules' severities. Its \`tsconfig\`, \`overrides\` and \`includeDesignSystem\` apply to ${name}'s own files only. [Design-system packages](https://onsystem.vercel.app/docs/design-system-packages) has the details.`,
  ].join('\n')}\n`;
}

function count(n: number, word: string): string {
  return `${n.toLocaleString('en-US')} ${n === 1 ? word : `${word}s`}`;
}
