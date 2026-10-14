// onsystem benchmark v2: coding agents from three providers write UI in five real repositories,
// with no help, the skill, the MCP server, the hook, or all three, scored by tsc, onsystem and
// a blind-labelled sample. Method and threats to validity: bench/v2/README.md.
//
//   node bench/v2/run.mjs plan    [--matrix standard] [--usage-from <out>]
//   node bench/v2/run.mjs prepare [--repos a,b] [--work <dir>] [--force]
//   node bench/v2/run.mjs run     --matrix <name> --out <dir> --max-cost <usd> [--concurrency 4]
//                                 [--work <dir>] [--seed 1] [--limit <n>] [--allow-partial] [--keep-workspaces]
//   node bench/v2/run.mjs report  --out <dir>
//   node bench/v2/run.mjs labels  --out <dir> [--per-cell 2] [--seed 1] [--force]
//
// `plan` and the mock matrix need no network and no key. Every other matrix calls paid APIs:
// it needs the key variables its providers name in config/models.json, and a --max-cost cap.
// Run `pnpm build` first: the MCP server, the hook and the scoring use this checkout's dist/cli.js.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { runAgent } from './lib/agent.mjs';
import { startOnsystemMcp } from './lib/mcp.mjs';
import { createMockProvider } from './lib/mock.ts';
import {
  armParts,
  calibration,
  createBudget,
  estimatePlan,
  expandMatrix,
  missingKeys,
  renderPlan,
} from './lib/plan.ts';
import {
  parseSkill,
  roughTokens,
  systemPrompt,
  taskPrompt,
  LOAD_SKILL_TOOL,
} from './lib/prompt.ts';
import { createProvider } from './lib/providers.ts';
import { createWorkspace, loadRepos, prepareRepo, repoDirs, scoreWorkspace } from './lib/repo.mjs';
import {
  aggregate,
  deltas,
  labelSample,
  labelSummary,
  parseCsv,
  renderLabelSummary,
  renderMarkdown,
  seedOf,
  shuffle,
  toCsv,
} from './lib/stats.ts';
import { FILE_TOOLS } from './lib/tools.ts';

const HERE = import.meta.dirname;
const ROOT = path.resolve(HERE, '../..');
const CLI = path.join(ROOT, 'dist', 'cli.js');
const HOOK = path.join(ROOT, 'plugins', 'onsystem', 'hooks', 'check-ui.mjs');
const SKILL_FILE = path.join(ROOT, 'plugins', 'onsystem', 'skills', 'onsystem', 'SKILL.md');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    matrix: { type: 'string' },
    out: { type: 'string' },
    work: { type: 'string' },
    repos: { type: 'string' },
    'max-cost': { type: 'string' },
    concurrency: { type: 'string', default: '4' },
    seed: { type: 'string', default: '1' },
    limit: { type: 'string' },
    'per-cell': { type: 'string', default: '2' },
    'usage-from': { type: 'string' },
    'allow-partial': { type: 'boolean', default: false },
    'keep-workspaces': { type: 'boolean', default: false },
    force: { type: 'boolean', default: false },
  },
});

const config = {
  models: readJson(path.join(HERE, 'config/models.json')),
  tasks: readJson(path.join(HERE, 'config/tasks.json')).tasks,
  matrices: readJson(path.join(HERE, 'config/matrices.json')).matrices,
  usage: readJson(path.join(HERE, 'config/usage-model.json')),
  repos: loadRepos(
    readJson(path.join(HERE, 'config/repos.json')),
    readJson(path.join(ROOT, 'corpus/repos.json')),
  ),
};
const work = path.resolve(
  values.work ?? process.env.BENCH_WORK_DIR ?? path.join(os.tmpdir(), 'onsystem-bench-v2'),
);
const [command = 'plan'] = positionals;

try {
  if (command === 'plan') plan();
  else if (command === 'prepare') await prepare();
  else if (command === 'run') process.exitCode = await run();
  else if (command === 'report') report(requireOut());
  else if (command === 'labels') labels(requireOut());
  else fail(`Unknown command "${command}": plan, prepare, run, report or labels.`);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

// ─── plan ─────────────────────────────────────────────────────────────────────

function matrixRuns(name) {
  const matrix = config.matrices[name];
  if (!matrix) fail(`No matrix "${name}". Matrices: ${Object.keys(config.matrices).join(', ')}.`);
  return { matrix, runs: expandMatrix(matrix, config.tasks, config.models.models) };
}

/** Per-request fixed prompt of this harness, from its own text, at 4 characters per token. */
function usageModel() {
  const skill = parseSkill(fs.readFileSync(SKILL_FILE, 'utf8'));
  const prompts = config.tasks.map((t) => taskPrompt(t.prompt).length);
  const meanPrompt = prompts.reduce((a, b) => a + b, 0) / prompts.length;
  const base = roughTokens(systemPrompt() + JSON.stringify(FILE_TOOLS)) + Math.ceil(meanPrompt / 4);
  return {
    profiles: config.usage.profiles,
    overhead: {
      base,
      skillListing:
        roughTokens(systemPrompt({ skill }) + JSON.stringify(LOAD_SKILL_TOOL)) -
        roughTokens(systemPrompt()),
      skillBody: roughTokens(skill.body),
      mcp: config.usage.mcpOverhead.tokens,
    },
    pessimistic: config.usage.pessimistic,
  };
}

function plan() {
  const names = values.matrix
    ? [values.matrix]
    : Object.keys(config.matrices).filter((n) => n !== 'mock');
  const measured = values['usage-from']
    ? calibration(readResults(path.resolve(values['usage-from'])))
    : new Map();
  const usage = usageModel();
  console.log(
    `Fixed prompt per request (this harness, 4 characters per token): ${usage.overhead.base} tokens; the skill adds ${usage.overhead.skillListing} (${usage.overhead.skillBody} more once loaded), the MCP server ${usage.overhead.mcp}.`,
  );
  console.log(
    `Prices verified ${config.models.verified} (config/models.json). Token use per run from v1's transcripts (config/usage-model.json).`,
  );
  if (measured.size)
    console.log(`Cost per run measured from ${values['usage-from']} where available.`);
  console.log('');
  for (const name of names) {
    const { matrix, runs } = matrixRuns(name);
    console.log(
      renderPlan(
        name,
        matrix,
        estimatePlan(runs, config.models.models, usage, measured),
        runs.length,
      ),
    );
  }
  console.log(
    'Expected: every request reads the earlier context from the prompt cache. Pessimistic: no cache hits, 50% more requests, context and output.',
  );
}

// ─── prepare ──────────────────────────────────────────────────────────────────

async function prepare(names) {
  requireBuild();
  assertIsolated(work);
  const wanted =
    names ?? (values.repos ? values.repos.split(',') : config.repos.map((r) => r.name));
  for (const name of wanted) {
    const repo = config.repos.find((r) => r.name === name);
    if (!repo) fail(`No repository "${name}" in config/repos.json.`);
    const started = Date.now();
    const meta = await prepareRepo(repo, {
      work,
      cli: CLI,
      log: (line) => console.error(line),
      force: values.force,
    });
    console.error(
      `${name}: ready in ${Math.round((Date.now() - started) / 1000)}s (TypeScript ${meta.typescript}; controls: valid ${meta.controls.valid.tscErrors} tsc / ${meta.controls.valid.onsystemErrors} onsystem errors, invented variant ${meta.controls.invalid.tscErrors} / ${meta.controls.invalid.onsystemErrors})`,
    );
  }
}

// ─── run ──────────────────────────────────────────────────────────────────────

async function run() {
  if (!values.matrix) fail('Pass --matrix (see config/matrices.json, or `plan`).');
  const out = requireOut();
  const { runs: all } = matrixRuns(values.matrix);
  const offline = all.every((r) => r.provider === 'mock');

  const missing = missingKeys(all, config.models.providers, process.env);
  if (missing.length) {
    fail(
      `${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} not set. This matrix calls ${[...new Set(all.map((r) => r.provider))].join(', ')}; export the key${missing.length === 1 ? '' : 's'} in this shell (they are read from the environment only, never from a file, and never printed).`,
    );
  }
  if (!offline) checkPrices(all);
  const cap =
    values['max-cost'] === undefined
      ? offline
        ? Infinity
        : undefined
      : Number(values['max-cost']);
  if (cap === undefined || Number.isNaN(cap))
    fail('Pass --max-cost <usd>: the run stops starting requests once the running cost passes it.');

  fs.mkdirSync(path.join(out, 'runs'), { recursive: true });
  const previous = readResults(out);
  // Runs stopped by the cap or by an error are run again; the rest are done.
  const done = new Set(
    previous.filter((r) => r.status !== 'aborted' && r.status !== 'error').map((r) => r.id),
  );
  // Every attempt's cost, aborted ones included, is in the ledger: a rerun overwrites an aborted
  // run's result, not what it spent.
  const ledger = path.join(out, 'ledger.jsonl');
  const spentBefore = fs.existsSync(ledger)
    ? fs
        .readFileSync(ledger, 'utf8')
        .split('\n')
        .filter(Boolean)
        .reduce((a, line) => a + JSON.parse(line).cost, 0)
    : previous.reduce((a, r) => a + r.cost, 0);
  let queue = shuffle(all, Number(values.seed)).filter((r) => !done.has(r.id));
  if (values.limit) queue = queue.slice(0, Number(values.limit));

  const estimate = estimatePlan(queue, config.models.models, usageModel(), calibration(previous));
  console.error(
    `${queue.length} runs to go (${done.size} already done, $${spentBefore.toFixed(2)} spent). Estimated cost: $${estimate.expectedCost.toFixed(2)} expected, $${estimate.pessimisticCost.toFixed(2)} pessimistic. Cap: ${Number.isFinite(cap) ? `$${cap}` : 'none (mock)'}.`,
  );
  if (spentBefore + estimate.expectedCost > cap && !values['allow-partial']) {
    fail(
      `The expected cost ($${(spentBefore + estimate.expectedCost).toFixed(2)} with what is already spent) is over the cap ($${cap}), so the matrix would stop part-way. Raise --max-cost, pick a smaller matrix, or pass --allow-partial.`,
    );
  }

  const repoNames = [...new Set(queue.map((r) => r.repo))];
  const unprepared = repoNames.filter((n) => !fs.existsSync(repoDirs(work, n).meta));
  if (unprepared.length) await prepare(unprepared);
  else requireBuild();

  fs.writeFileSync(
    path.join(out, 'run-info.json'),
    JSON.stringify(
      {
        matrix: values.matrix,
        seed: Number(values.seed),
        onsystem: readJson(path.join(ROOT, 'package.json')).version,
        node: process.version,
        // A resumed run keeps the time the matrix first started.
        startedAt: fs.existsSync(path.join(out, 'run-info.json'))
          ? readJson(path.join(out, 'run-info.json')).startedAt
          : new Date().toISOString(),
        lastStartedAt: new Date().toISOString(),
        cap: Number.isFinite(cap) ? cap : null,
        pricesVerified: config.models.verified,
        repos: Object.fromEntries(repoNames.map((n) => [n, readJson(repoDirs(work, n).meta)])),
      },
      null,
      2,
    ),
  );

  const budget = createBudget(Number.isFinite(cap) ? cap : Number.MAX_SAFE_INTEGER, spentBefore);
  const concurrency = Math.max(1, Number(values.concurrency));
  let finished = 0;
  const total = queue.length;
  // A model whose runs keep failing (a changed API, a model ID that no longer exists, no access)
  // is taken out of the queue after 3 errors in a row, instead of failing for the whole matrix.
  const errorsInARow = new Map();
  const dropped = [];
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (queue.length && !budget.exceeded()) {
        const planned = /** @type {import('./lib/plan.ts').PlannedRun} */ (queue.shift());
        const result = await runOne(planned, { out, budget });
        const streak = result.status === 'error' ? (errorsInARow.get(planned.model) ?? 0) + 1 : 0;
        errorsInARow.set(planned.model, streak);
        if (streak === 3) {
          const before = queue.length;
          queue = queue.filter((r) => r.model !== planned.model);
          dropped.push(
            `${planned.model} (${before - queue.length} runs not started; last error: ${result.detail.slice(0, 200)})`,
          );
        }
        fs.appendFileSync(
          ledger,
          `${JSON.stringify({ id: result.id, status: result.status, cost: result.cost, at: result.finishedAt })}\n`,
        );
        finished += 1;
        console.error(
          `[${finished}/${total}] ${planned.id}: ${result.status}${result.detail ? ` (${result.detail.slice(0, 120)})` : ''}, ${result.created ? 'created' : 'no file'}, tsc ${result.tscPass === null ? 'n/a' : result.tscPass ? 'pass' : `${result.tscErrors} error(s)`}, onsystem ${result.onsystemErrors} error(s), $${result.cost.toFixed(4)}, ${result.calls} calls, ${result.seconds}s (spent $${budget.spent().toFixed(2)})`,
        );
      }
    }),
  );
  report(out);
  if (dropped.length) {
    console.error(
      `Stopped scheduling after 3 errors in a row: ${dropped.join('; ')}. Fix the cause and run the same command again to continue.`,
    );
  }
  if (budget.exceeded()) {
    console.error(
      `Stopped: the spend cap ($${budget.cap}) was reached at $${budget.spent().toFixed(2)}. ${queue.length} runs were not started; run the same command with a higher --max-cost to continue where it stopped.`,
    );
    return 3;
  }
  return dropped.length ? 4 : 0;
}

/** One run: a fresh copy of the repository, the arm's parts, the agent, then the scores. */
async function runOne(planned, { out, budget }) {
  const repo = /** @type {any} */ (config.repos.find((r) => r.name === planned.repo));
  const task = config.tasks.find((t) => t.id === planned.task && t.repo === planned.repo);
  const model = config.models.models.find((m) => m.id === planned.model);
  const dirs = repoDirs(work, repo.name);
  const dest = path.join(work, 'runs', planned.id);
  const runDir = path.join(out, 'runs', planned.id);
  fs.rmSync(runDir, { recursive: true, force: true });
  fs.mkdirSync(runDir, { recursive: true });
  // Transcripts hold every tool output: kept apart from runs/, which is small enough to commit.
  fs.mkdirSync(path.join(out, 'transcripts'), { recursive: true });
  const transcript = fs.openSync(path.join(out, 'transcripts', `${planned.id}.jsonl`), 'w');
  // Paths in the workspace are written relative to it, so transcripts hold no local paths.
  const log = (event) =>
    fs.writeSync(
      transcript,
      `${JSON.stringify({ t: Date.now(), ...event })
        .split(`${dest}${path.sep}`)
        .join('')
        .split(dest)
        .join('.')}\n`,
    );
  const started = Date.now();
  const parts = armParts(planned.arm);
  let mcp;
  let agent = {
    status: 'error',
    detail: '',
    usage: { input: 0, cacheRead: 0, cacheWrite: 0, output: 0 },
    cost: 0,
    calls: 0,
    toolCalls: 0,
    hookBlocks: 0,
    hookNotes: 0,
    mcpCalls: 0,
    skillLoads: 0,
    toolErrors: 0,
  };
  let score;
  try {
    createWorkspace(dirs.src, dest);
    const skill = parts.skill ? parseSkill(fs.readFileSync(SKILL_FILE, 'utf8')) : undefined;
    if (parts.mcp) mcp = await startOnsystemMcp({ cli: CLI, cwd: dest });
    const system = systemPrompt({ skill, mcpInstructions: mcp?.instructions });
    const prompt = taskPrompt(task.prompt);
    log({
      type: 'start',
      run: planned,
      model: model.id,
      effort: model.effort,
      system,
      prompt,
      tools: mcp ? mcp.tools.map((t) => t.name) : [],
    });
    const provider =
      model.provider === 'mock'
        ? createMockProvider({ model: model.id, control: repo.control, seed: seedOf(planned.id) })
        : createProvider(model.provider, {
            model: model.id,
            effort: model.effort,
            keyEnv: config.models.providers[model.provider].keyEnv,
            endpoint: config.models.providers[model.provider].endpoint,
            env: process.env,
            fetch: globalThis.fetch,
          });
    agent = await runAgent({
      provider,
      price: model.price,
      budget,
      root: dest,
      system,
      prompt,
      skill,
      mcp,
      hook: parts.hook ? { script: HOOK, cli: CLI, sessionId: planned.id } : undefined,
      onEvent: log,
    });
    if (agent.status !== 'aborted') {
      score = await scoreWorkspace({
        repo,
        task,
        dest,
        before: readJson(dirs.manifest),
        cli: CLI,
        baseline: dirs.baseline,
      });
      for (const file of [...score.changes.added, ...score.changes.modified]) {
        const to = path.join(runDir, 'files', file);
        fs.mkdirSync(path.dirname(to), { recursive: true });
        fs.copyFileSync(path.join(dest, file), to);
      }
    }
  } catch (error) {
    agent.status = 'error';
    agent.detail = (error instanceof Error ? error.message : String(error)).split(dest).join('.');
  } finally {
    await mcp?.close();
    fs.closeSync(transcript);
    if (!values['keep-workspaces']) fs.rmSync(dest, { recursive: true, force: true });
  }
  const result = {
    id: planned.id,
    provider: planned.provider,
    model: planned.model,
    tier: model.tier,
    arm: planned.arm,
    repo: planned.repo,
    task: planned.task,
    repeat: planned.repeat,
    status: agent.status,
    detail: agent.detail,
    created: score?.created ?? false,
    file: task.file,
    tscPass: score ? (score.tsc.ran || score.created ? score.tsc.pass : null) : null,
    tscErrors: score ? score.tsc.errors.length : null,
    tscDiagnostics: score?.tsc.errors.slice(0, 20) ?? [],
    onsystemErrors: score?.onsystem.errors ?? 0,
    onsystemWarnings: score?.onsystem.warnings ?? 0,
    onsystemByRule: score?.onsystem.byRule ?? {},
    onsystemFindings: score?.onsystem.findings ?? [],
    outOfScope: score?.outOfScope ?? 0,
    changes: score?.changes ?? null,
    cost: agent.cost,
    calls: agent.calls,
    toolCalls: agent.toolCalls,
    toolErrors: agent.toolErrors,
    inputTokens: agent.usage.input + agent.usage.cacheRead + agent.usage.cacheWrite,
    cacheReadTokens: agent.usage.cacheRead,
    cacheWriteTokens: agent.usage.cacheWrite,
    outputTokens: agent.usage.output,
    seconds: Math.round((Date.now() - started) / 1000),
    hookBlocks: agent.hookBlocks,
    hookNotes: agent.hookNotes,
    mcpCalls: agent.mcpCalls,
    skillLoads: agent.skillLoads,
    effort: model.effort,
    finishedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify(result, null, 2));
  return result;
}

function checkPrices(runs) {
  const age = (Date.now() - Date.parse(config.models.verified)) / 86_400_000;
  if (age > 30) {
    fail(
      `The prices in config/models.json were verified on ${config.models.verified}, ${Math.floor(age)} days ago. Check them against the sources listed there, update them and the date, then run again.`,
    );
  }
  for (const id of new Set(runs.map((r) => r.model))) {
    const model = config.models.models.find((m) => m.id === id);
    if (model?.validUntil && Date.now() > Date.parse(`${model.validUntil}T23:59:59Z`)) {
      fail(
        `${id}'s price in config/models.json was valid until ${model.validUntil}. Update it from ${model.sources[0]} first.`,
      );
    }
  }
}

// ─── report and labels ────────────────────────────────────────────────────────

function readResults(out) {
  const dir = path.join(out, 'runs');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((id) => fs.existsSync(path.join(dir, id, 'result.json')))
    .map((id) => readJson(path.join(dir, id, 'result.json')));
}

function report(out) {
  const results = readResults(out);
  if (!results.length) fail(`No results in ${out}/runs.`);
  const rows = aggregate(results);
  const diffs = deltas(results);
  const info = fs.existsSync(path.join(out, 'run-info.json'))
    ? readJson(path.join(out, 'run-info.json'))
    : {};
  const statuses = results.reduce(
    (acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }),
    {},
  );
  const lines = [
    `# Results: ${info.matrix ?? 'benchmark v2'}`,
    '',
    `${results.length} runs (${Object.entries(statuses)
      .map(([s, n]) => `${n} ${s}`)
      .join(
        ', ',
      )}), onsystem ${info.onsystem ?? '?'}, started ${info.startedAt ?? '?'}. Rates with 95% Wilson intervals; errors per run and differences with 95% cluster-bootstrap intervals (tasks resampled, 10,000 draws, seed 1). Method: [README](../../README.md).`,
    '',
  ];
  // What the tables cannot show (the version's blind spots, how a number was reached) is kept
  // next to the run in <out>/notes.md, which report does not generate. It goes above the
  // tables, so rebuilding them keeps it.
  const notes = path.join(out, 'notes.md');
  if (fs.existsSync(notes)) lines.push(fs.readFileSync(notes, 'utf8').trim(), '');
  lines.push(renderMarkdown(rows, diffs));
  const labelFile = path.join(out, 'labels', 'labels.csv');
  const keyFile = path.join(out, 'labels', 'key.json');
  if (fs.existsSync(labelFile) && fs.existsSync(keyFile)) {
    const findingsFile = path.join(out, 'labels', 'findings.csv');
    const summary = labelSummary(
      parseCsv(fs.readFileSync(labelFile, 'utf8')),
      readJson(keyFile),
      fs.existsSync(findingsFile) ? parseCsv(fs.readFileSync(findingsFile, 'utf8')) : [],
      results,
    );
    // Who labelled (a person or an AI reviewer) is stated in labels/LABELLER.md, not assumed here.
    const labeller = fs.existsSync(path.join(out, 'labels', 'LABELLER.md'))
      ? 'Who labelled, and what they could see: [labels/LABELLER.md](labels/LABELLER.md).'
      : 'Who labelled is not recorded: add labels/LABELLER.md.';
    lines.push('', '## Blind labels', '', labeller, '', renderLabelSummary(summary));
  }
  fs.writeFileSync(path.join(out, 'results.md'), `${lines.join('\n').trimEnd()}\n`);
  fs.writeFileSync(
    path.join(out, 'results.json'),
    JSON.stringify({ info, rows, deltas: diffs }, null, 2),
  );
  fs.writeFileSync(
    path.join(out, 'runs.csv'),
    toCsv(
      results.map((r) => ({
        id: r.id,
        provider: r.provider,
        model: r.model,
        arm: r.arm,
        repo: r.repo,
        task: r.task,
        repeat: r.repeat,
        status: r.status,
        created: r.created,
        tsc_pass: r.tscPass,
        tsc_errors: r.tscErrors,
        onsystem_errors: r.onsystemErrors,
        onsystem_warnings: r.onsystemWarnings,
        out_of_scope: r.outOfScope,
        cost_usd: Number(r.cost.toFixed(6)),
        calls: r.calls,
        input_tokens: r.inputTokens,
        output_tokens: r.outputTokens,
        seconds: r.seconds,
        hook_blocks: r.hookBlocks,
        mcp_calls: r.mcpCalls,
        skill_loads: r.skillLoads,
      })),
    ),
  );
  console.log(`Wrote ${path.join(out, 'results.md')}, results.json and runs.csv.`);
}

function labels(out) {
  const results = readResults(out);
  const sample = labelSample(results, Number(values['per-cell']), Number(values.seed));
  if (!sample.length) fail('No scored runs with a created file to sample.');
  const dir = path.join(out, 'labels');
  if (fs.existsSync(path.join(dir, 'labels.csv')) && !values.force) {
    fail(
      `${path.join(dir, 'labels.csv')} exists and may hold labels: pass --force to draw a new sample over it.`,
    );
  }
  fs.mkdirSync(path.join(dir, 'files'), { recursive: true });
  const rows = [];
  const findings = [];
  const key = {};
  for (const { sampleId, run } of sample) {
    const task = config.tasks.find((t) => t.id === run.task && t.repo === run.repo);
    const repo = config.repos.find((r) => r.name === run.repo);
    const from = path.join(out, 'runs', run.id, 'files', run.file);
    const to = path.join(dir, 'files', sampleId, path.basename(run.file));
    fs.mkdirSync(path.dirname(to), { recursive: true });
    if (fs.existsSync(from)) fs.copyFileSync(from, to);
    key[sampleId] = { run: run.id, model: run.model, arm: run.arm };
    rows.push({
      sample_id: sampleId,
      repo: run.repo,
      repo_url: `${repo.url}/tree/${repo.sha}`,
      design_system: repo.designSystem,
      file: `files/${sampleId}/${path.basename(run.file)}`,
      task: task.prompt,
      uses_design_system: '',
      invented_api: '',
      hardcoded_values: '',
      native_elements: '',
      unnamed_controls: '',
      would_merge: '',
      notes: '',
    });
    run.onsystemFindings.forEach((f, i) =>
      findings.push({
        sample_id: sampleId,
        finding: i + 1,
        line: f.line,
        rule: f.ruleId,
        severity: f.severity,
        source: f.source ?? '',
        message: f.message,
        verdict: '',
        notes: '',
      }),
    );
  }
  fs.writeFileSync(path.join(dir, 'labels.csv'), toCsv(rows));
  fs.writeFileSync(
    path.join(dir, 'findings.csv'),
    findings.length
      ? toCsv(findings)
      : 'sample_id,finding,line,rule,severity,source,message,verdict,notes\n',
  );
  fs.writeFileSync(path.join(dir, 'key.json'), JSON.stringify(key, null, 2));
  fs.writeFileSync(path.join(dir, 'sample.json'), JSON.stringify(rows, null, 2));
  console.log(
    `Wrote ${sample.length} files to label in ${dir}: fill labels.csv first, then findings.csv, following bench/v2/LABELLING.md. key.json maps each sample to its model and arm; keep it closed until both sheets are done.`,
  );
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function requireOut() {
  if (!values.out) fail('Pass --out <dir>.');
  return path.resolve(values.out);
}

function requireBuild() {
  if (!fs.existsSync(CLI))
    fail(`${path.relative(process.cwd(), CLI)} is missing: run pnpm build first.`);
}

/** onsystem looks upwards for node_modules and workspace roots: the work folder must sit outside any project. */
function assertIsolated(folder) {
  for (let current = path.dirname(folder); ; current = path.dirname(current)) {
    for (const name of ['package.json', 'pnpm-workspace.yaml', 'node_modules', 'tsconfig.json']) {
      if (fs.existsSync(path.join(current, name))) {
        fail(
          `${folder} is inside ${current}, which has ${name}: checks would read it. Pass --work (or set BENCH_WORK_DIR) to a folder outside any project.`,
        );
      }
    }
    if (current === path.dirname(current)) return;
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
