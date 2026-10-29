/**
 * The ESLint plugin's loader, in a worker thread. ESLint rules run synchronously, and finding a
 * project's design system does not (config files written in code, globs, the extraction
 * cache), so the plugin asks this worker and waits for the answer (see `bridge.ts`).
 *
 * The worker keeps what it loaded and answers from it at once. Once that is two seconds old, the
 * next lint starts a look at the project again (its config, then its design system's files) in
 * the background, and the lints after the look get what it found. Waiting for the look instead
 * held up every lint after a pause in an editor for as long as the look took, which grows with
 * the design system.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { parentPort, type MessagePort } from 'node:worker_threads';

import { excludedBy, type ResolvedConfig } from '../config.js';
import { buildModel, componentFiles, fingerprint } from '../design-system.js';
import type { DesignSystemModel } from '../types.js';
import { relativePath } from '../util/paths.js';
import { loadTarget } from '../workspace.js';

type Target = Awaited<ReturnType<typeof loadTarget>>;

export interface LoadRequest {
  /** ESLint's working directory: where `check` would run from. */
  cwd: string;
  /** The file being linted, absolute. */
  file: string;
  /** `settings.onsystem` in the ESLint config: `--root` and `--config`, relative to `cwd`. */
  root?: string | undefined;
  config?: string | undefined;
  /** The version of each design system the plugin already holds, by project root. */
  known: Record<string, string>;
}

export type LoadResponse =
  | {
      /** Why the file is not checked, as `check .` would leave it out. */
      skip: string;
    }
  | {
      root: string;
      version: string;
      /** Left out when the plugin already holds this version. */
      data?: { config: ResolvedConfig; model: DesignSystemModel };
    }
  | { error: string };

export interface Call {
  request: LoadRequest;
  /** Set to 1, and notified, once the response is on `port`. */
  signal: Int32Array;
  port: MessagePort;
}

/** What the configs said (a design-system package's skipped, or its paths ignored), each said once. */
const warned = new Set<string>();

/** How long what a look found is used before a lint starts the next look. */
const FRESH_MS = 2000;

/** The project and config found from where ESLint runs and `settings.onsystem`, and when. */
interface KeptTarget {
  at: number;
  /** A load that failed is kept too: the lints until the next look say why. */
  target: Promise<Target>;
  /** A look at it, then at the project of the file whose lint started the look, under way. */
  looking?: Promise<void> | undefined;
}

/** A project's design system, as built for `config`. */
interface Project {
  at: number;
  /** The fingerprint of what the model is built from: the files, and the config but its rules. */
  key: string;
  /** Files beyond the tracked ones that the model depends on, for the next fingerprint. */
  dependencies: string[];
  /** The fingerprint and the whole config, rules too: what the plugin holds when it has it. */
  version: string;
  config: ResolvedConfig;
  model: DesignSystemModel;
  /** The design system's own component files, by real path. */
  own: Set<string>;
  looking?: Promise<void> | undefined;
}

/** By where ESLint runs and its settings. */
const targets = new Map<string, KeptTarget>();
/**
 * By target and project root: two targets can reach the same project with configs of their own
 * (runs from two folders, two ESLint configs), and neither may be answered with the other's.
 */
const projects = new Map<string, Project>();
const looks = new Set<Promise<void>>();

function realPath(file: string): string {
  try {
    return fs.realpathSync.native(file);
  } catch {
    return file;
  }
}

function loadTargetFor({ cwd, root, config }: LoadRequest): Promise<Target> {
  return loadTarget({
    cwd,
    root: root === undefined ? undefined : path.resolve(cwd, root),
    config: config === undefined ? undefined : path.resolve(cwd, config),
  });
}

function keep(target: Promise<Target>): KeptTarget {
  // Awaited by later lints, which say why it failed: not an unhandled rejection meanwhile.
  target.catch(() => undefined);
  return { at: Date.now(), target };
}

/** The config a file is checked with: its own project's, from a monorepo root. */
async function configFor(target: Target, file: string): Promise<ResolvedConfig> {
  return target.workspace ? (await target.workspace.projectFor(file)).config : target.config;
}

function versionOf(key: string, config: ResolvedConfig): string {
  return createHash('sha256').update(key).update(JSON.stringify(config)).digest('hex');
}

async function build(config: ResolvedConfig): Promise<Project> {
  const {
    model,
    key = String(Date.now()),
    dependencies = [],
  } = await buildModel(config, { cache: true });
  const own = new Set((await componentFiles(config)).map(realPath));
  return { at: Date.now(), key, dependencies, version: versionOf(key, config), config, model, own };
}

/**
 * `project` for `config` as the files are now: the same model when nothing it is built from has
 * changed (a config edit that only changes rules, or no change at all), else a new build.
 */
async function rebuild(project: Project, config: ResolvedConfig): Promise<Project> {
  if ((await fingerprint(config, project.dependencies)) !== project.key) return build(config);
  const { key, dependencies, model, own } = project;
  return { at: Date.now(), key, dependencies, version: versionOf(key, config), config, model, own };
}

/** Runs a look in the background, held in `looks` until it ends. */
function background(look: () => Promise<void>): Promise<void> {
  const running: Promise<void> = look()
    .catch(() => undefined)
    .finally(() => looks.delete(running));
  looks.add(running);
  return running;
}

function projectKey(key: string, config: ResolvedConfig): string {
  return JSON.stringify([key, config.root]);
}

/** A build that fails drops the project, so that the next lint builds it again and says why. */
function lookAtProject(slot: string, project: Project, config: ResolvedConfig): Promise<void> {
  project.looking = background(async () => {
    try {
      projects.set(slot, await rebuild(project, config));
    } catch (error) {
      if (projects.get(slot) === project) projects.delete(slot);
      throw error;
    }
  });
  return project.looking;
}

function lookAtTarget(key: string, kept: KeptTarget, request: LoadRequest): Promise<void> {
  kept.looking = background(async () => {
    const loading = loadTargetFor(request);
    await loading.catch(() => undefined);
    targets.set(key, keep(loading));
    // The config may have changed: the file's project is looked at with the new one.
    const config = await configFor(await loading, request.file);
    const slot = projectKey(key, config);
    const project = projects.get(slot);
    if (project && !project.looking) await lookAtProject(slot, project, config);
  });
  return kept.looking;
}

/** Resolves when the looks under way have ended. Nothing waits on them but tests. */
export function looking(): Promise<unknown> {
  return Promise.all(looks);
}

export async function load(request: LoadRequest): Promise<LoadResponse> {
  const key = JSON.stringify([request.cwd, request.root, request.config]);
  let kept = targets.get(key);
  if (!kept) {
    kept = keep(loadTargetFor(request));
    targets.set(key, kept);
  } else if (!kept.looking && Date.now() - kept.at >= FRESH_MS) {
    void lookAtTarget(key, kept, request);
  }
  const config = await configFor(await kept.target, request.file);

  // On stderr, once per process: ESLint has no place for a warning that is about no one file.
  for (const text of config.warnings ?? []) {
    if (warned.has(text)) continue;
    warned.add(text);
    process.stderr.write(`onsystem: ${text}\n`);
  }

  const slot = projectKey(key, config);
  let project = projects.get(slot);
  if (!project) {
    project = await build(config);
    projects.set(slot, project);
  } else if (
    !kept.looking &&
    !project.looking &&
    (project.config !== config || Date.now() - project.at >= FRESH_MS)
  ) {
    // Another project of a monorepo root, whose config a look at the root found again, or whose
    // design system's files are due a look.
    void lookAtProject(slot, project, config);
  }

  // What `check .` leaves out of a folder: the config's `exclude`, by the same test, and the
  // design system's own component files. The default test and story patterns are left to the
  // ESLint config (the recommended one ignores those files), as `--include-tests` lifts them
  // for `check`.
  const relative = relativePath(config.root, request.file);
  const excluded = excludedBy(config, relative, { includeTests: true });
  if (excluded) return { skip: `excluded by "${excluded}"` };
  if (!config.includeDesignSystem && project.own.has(realPath(request.file))) {
    return { skip: 'one of the design system’s own component files' };
  }
  const { version } = project;
  return {
    root: config.root,
    version,
    ...(request.known[config.root] === version
      ? {}
      : { data: { config: project.config, model: project.model } }),
  };
}

parentPort?.on('message', ({ request, signal, port }: Call) => {
  const reply = (response: LoadResponse) => {
    port.postMessage(response);
    Atomics.store(signal, 0, 1);
    Atomics.notify(signal, 0);
  };
  load({ ...request, file: path.resolve(request.cwd, request.file) }).then(
    reply,
    (error: unknown) => {
      reply({ error: (error as Error).message });
    },
  );
});
