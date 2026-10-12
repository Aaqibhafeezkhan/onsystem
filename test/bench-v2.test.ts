// bench/v2: statistics, scoring, the plan and cost model, the API adapters (on recorded response
// shapes, no network), the file tools, the mock model, the agent loop and the configuration.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { createMockProvider, mockTurn, type MockControl } from '../bench/v2/lib/mock.js';
import {
  armParts,
  calibration,
  costOf,
  createBudget,
  estimatePlan,
  estimateRun,
  expandMatrix,
  missingKeys,
  renderPlan,
  type MatrixSpec,
  type ModelSpec,
  type Task,
  type UsageModel,
} from '../bench/v2/lib/plan.js';
import { parseSkill, systemPrompt, taskPrompt, TASK_SUFFIX } from '../bench/v2/lib/prompt.js';
import {
  anthropicBody,
  anthropicTurn,
  createProvider,
  geminiBody,
  geminiTurn,
  openaiBody,
  openaiTurn,
  readKey,
  toGeminiSchema,
  type Fetch,
  type Message,
  type Provider,
  type TurnRequest,
} from '../bench/v2/lib/providers.js';
import {
  classify,
  configErrors,
  diagnosticsIn,
  diffManifests,
  parseTscOutput,
  scopeTsconfig,
  summarizeCheck,
} from '../bench/v2/lib/score.js';
import {
  aggregate,
  bootstrapMean,
  deltas,
  labelSample,
  labelSummary,
  pairedDifference,
  parseCsv,
  renderMarkdown,
  shuffle,
  toCsv,
  wilson,
  type RunResult,
} from '../bench/v2/lib/stats.js';
import { createFileTools, FILE_TOOLS, globToRegex, resolveInside } from '../bench/v2/lib/tools.js';

const root = path.resolve(import.meta.dirname, '..');
const bench = path.join(root, 'bench/v2');
const readJson = (file: string): unknown => JSON.parse(fs.readFileSync(file, 'utf8'));

// ─── Statistics ───────────────────────────────────────────────────────────────

describe('wilson', () => {
  it('matches published 95% intervals', () => {
    const half = wilson(5, 10);
    expect(half.value).toBe(0.5);
    expect(half.low).toBeCloseTo(0.2366, 3);
    expect(half.high).toBeCloseTo(0.7634, 3);
    const none = wilson(0, 10);
    expect(none.low).toBe(0);
    expect(none.high).toBeCloseTo(0.2775, 3);
    const all = wilson(10, 10);
    expect(all.high).toBe(1);
    expect(all.low).toBeCloseTo(0.7225, 3);
  });

  it('has no interval without runs', () => {
    expect(Number.isNaN(wilson(0, 0).value)).toBe(true);
  });
});

describe('bootstrap', () => {
  const values = [1, 2, 3, 4, 5, 6, 7, 8].map((value, i) => ({ cluster: `t${i % 4}`, value }));

  it('is deterministic for a seed and brackets the mean', () => {
    const a = bootstrapMean(values, { seed: 7, iterations: 2000 });
    const b = bootstrapMean(values, { seed: 7, iterations: 2000 });
    expect(a).toEqual(b);
    expect(a.value).toBe(4.5);
    expect(a.low).toBeLessThan(4.5);
    expect(a.high).toBeGreaterThan(4.5);
  });

  it('resamples clusters, not values: one cluster has no spread', () => {
    const single = bootstrapMean([1, 5, 9].map((value) => ({ cluster: 'only', value })));
    expect(single).toEqual({ value: 5, low: 5, high: 5 });
  });

  it('pairs differences', () => {
    const pairs = ['a', 'b', 'c'].map((cluster) => ({ cluster, base: 0, treated: 1 }));
    expect(pairedDifference(pairs)).toEqual({ value: 1, low: 1, high: 1 });
  });

  it('shuffles the same way for the same seed', () => {
    const items = Array.from({ length: 20 }, (_, i) => i);
    expect(shuffle(items, 3)).toEqual(shuffle(items, 3));
    expect(shuffle(items, 3)).not.toEqual(items);
    expect([...shuffle(items, 3)].sort((x, y) => x - y)).toEqual(items);
  });
});

function result(overrides: Partial<RunResult>): RunResult {
  return {
    id: 'x',
    provider: 'p',
    model: 'm',
    arm: 'none',
    repo: 'r',
    task: 't',
    repeat: 1,
    status: 'done',
    created: true,
    tscPass: true,
    tscErrors: 0,
    onsystemErrors: 0,
    onsystemWarnings: 0,
    outOfScope: 0,
    cost: 0.01,
    calls: 5,
    inputTokens: 1000,
    outputTokens: 100,
    seconds: 10,
    hookBlocks: 0,
    mcpCalls: 0,
    skillLoads: 0,
    ...overrides,
  };
}

describe('aggregate and deltas', () => {
  const results: RunResult[] = [];
  for (const task of ['t1', 't2', 't3', 't4']) {
    results.push(
      result({ id: `none-${task}`, task, arm: 'none', onsystemErrors: task === 't1' ? 0 : 2 }),
    );
    results.push(result({ id: `all-${task}`, task, arm: 'all', onsystemErrors: 0 }));
  }
  results.push(
    result({
      id: 'aborted',
      task: 't9',
      arm: 'all',
      status: 'aborted',
      created: false,
      tscPass: null,
    }),
  );

  it('counts rates per model and arm, and leaves unscored runs out', () => {
    const rows = aggregate(results, { iterations: 500 });
    const none = rows.find((r) => r.model === 'm' && r.arm === 'none');
    const all = rows.find((r) => r.model === 'm' && r.arm === 'all');
    expect(none?.onsystemClean).toMatchObject({ successes: 1, n: 4 });
    expect(all?.onsystemClean).toMatchObject({ successes: 4, n: 4 });
    expect(all?.runs).toBe(5);
    expect(all?.scored).toBe(4);
    // One model: no pooled rows that would repeat it.
    expect(rows.map((r) => r.model)).toEqual(['m', 'm']);
  });

  it('pairs each arm with none on the same task and repeat', () => {
    const [d] = deltas(results, 'none', { iterations: 500 });
    expect(d).toMatchObject({ model: 'm', arm: 'all', pairs: 4 });
    expect(d?.onsystemClean.value).toBeCloseTo(0.75);
    expect(d?.onsystemErrors.value).toBeCloseTo(-1.5);
  });

  it('renders both tables', () => {
    const md = renderMarkdown(
      aggregate(results, { iterations: 200 }),
      deltas(results, 'none', { iterations: 200 }),
    );
    expect(md).toContain('| m | none | 4 | 100% |');
    expect(md).toContain('1/4 25% [5%, 70%]');
    expect(md).toContain('| m | all | 4 | 0 [0, 0] | +75 [');
    expect(md).toContain('| -1.50 [');
  });

  it('pools the models of each tier', () => {
    const tiered = ['a', 'b'].flatMap((m) =>
      ['none', 'all'].map((arm) => result({ id: `${m}-${arm}`, model: m, tier: 'small', arm })),
    );
    const rows = aggregate(tiered, { iterations: 100 });
    expect(rows.map((r) => `${r.model}/${r.arm}`)).toEqual([
      'a/none',
      'a/all',
      'b/none',
      'b/all',
      'small models/none',
      'small models/all',
      'all models/none',
      'all models/all',
    ]);
    expect(rows.find((r) => r.model === 'small models' && r.arm === 'all')?.scored).toBe(2);
    expect(deltas(tiered, 'none', { iterations: 100 }).map((d) => d.model)).toEqual([
      'a',
      'b',
      'small models',
      'all models',
    ]);
  });

  it('counts an accepted run only when created, type-checked and clean', () => {
    const rows = aggregate([
      result({ id: 'a', tscPass: false }),
      result({ id: 'b', onsystemErrors: 1 }),
      result({ id: 'c', created: false, tscPass: false }),
      result({ id: 'd' }),
    ]);
    expect(rows[0]?.accepted).toMatchObject({ successes: 1, n: 4 });
  });
});

describe('blind labels', () => {
  const results = ['none', 'skill', 'mcp', 'hook', 'all'].flatMap((arm) =>
    ['t1', 't2', 't3'].map((task) =>
      result({ id: `${arm}-${task}`, arm, task, onsystemErrors: arm === 'none' ? 1 : 0 }),
    ),
  );

  it('samples per model and arm, blind and reproducible', () => {
    const sample = labelSample(results, 2, 5);
    expect(sample).toHaveLength(10);
    expect(labelSample(results, 2, 5)).toEqual(sample);
    expect(new Set(sample.map((s) => s.sampleId)).size).toBe(10);
    expect(sample.every((s) => /^S\d{3}$/.test(s.sampleId))).toBe(true);
    for (const arm of ['none', 'all'])
      expect(sample.filter((s) => s.run.arm === arm)).toHaveLength(2);
  });

  it('round-trips CSV with commas, quotes and line breaks', () => {
    const rows = [{ a: 'x, y', b: 'say "hi"', c: 'one\ntwo', d: 3, e: null }];
    expect(parseCsv(toCsv(rows))).toEqual([
      { a: 'x, y', b: 'say "hi"', c: 'one\ntwo', d: '3', e: '' },
    ]);
  });

  it('summarizes filled sheets against the key', () => {
    const key = {
      S001: { run: 'none-t1', model: 'm', arm: 'none' },
      S002: { run: 'all-t1', model: 'm', arm: 'all' },
      S003: { run: 'all-t2', model: 'm', arm: 'all' },
    };
    const labels: Record<string, string>[] = [
      { sample_id: 'S001', invented_api: '1', hardcoded_values: '', would_merge: 'no' },
      { sample_id: 'S002', invented_api: '0', hardcoded_values: '0', would_merge: 'Yes' },
      { sample_id: 'S003', would_merge: '' },
    ];
    const findings = [{ verdict: 'TP' }, { verdict: 'fp' }, { verdict: 'unsure' }, { verdict: '' }];
    const s = labelSummary(labels, key, findings, results, { iterations: 200 });
    expect(s.arms.map((a) => [a.arm, a.labelled])).toEqual([
      ['none', 1],
      ['all', 1],
    ]);
    expect(s.agreement).toEqual({ both: 1, onsystemOnly: 0, humanOnly: 0, neither: 1 });
    expect(s.precision).toMatchObject({ successes: 1, n: 2, unsure: 1 });
  });
});

// ─── Scoring ──────────────────────────────────────────────────────────────────

describe('tsc output', () => {
  const output = [
    'components/x.tsx(3,10): error TS2322: Type \'"warning"\' is not assignable to type \'"default" | "outline"\'.',
    "  Type 'string' is not assignable.",
    "../../packages/ui/src/a.tsx(1,1): error TS2307: Cannot find module 'react'.",
    'error TS5083: Cannot read file tsconfig.base.json.',
    'tsconfig.onsystem-bench.json(2,3): error TS5024: Compiler option needs a value.',
    '',
  ].join('\n');

  it('parses located and global errors, with elaborations', () => {
    const d = parseTscOutput(output);
    expect(d).toHaveLength(4);
    expect(d[0]).toMatchObject({ file: 'components/x.tsx', line: 3, column: 10, code: 'TS2322' });
    expect(d[0]?.message).toContain("Type 'string' is not assignable.");
    expect(d[2]).toMatchObject({ file: '', code: 'TS5083' });
  });

  it('keeps only the changed files, and spots config errors', () => {
    const d = parseTscOutput(output);
    expect(diagnosticsIn(d, ['./components/x.tsx'])).toHaveLength(1);
    expect(configErrors(d).map((e) => e.code)).toEqual(['TS5083', 'TS5024']);
    expect(
      configErrors(parseTscOutput("a.tsx(1,1): error TS6133: 'x' is declared but never used.")),
    ).toEqual([]);
  });

  it('scopes tsc to the files, with path overrides merged over the project paths', () => {
    expect(scopeTsconfig({ extends: './tsconfig.json', files: ['a.tsx'] })).toEqual({
      extends: './tsconfig.json',
      compilerOptions: { noEmit: true, incremental: false, composite: false },
      include: ['**/*.d.ts'],
      exclude: ['node_modules', '**/node_modules', '.next', 'dist', 'build'],
      files: ['a.tsx'],
    });
    const scoped = scopeTsconfig({
      extends: './tsconfig.json',
      files: ['a.tsx'],
      basePaths: { '@/*': ['./*'] },
      extraPaths: { '@x/ui': ['../ui/src'] },
    });
    expect(scoped.compilerOptions).toMatchObject({
      paths: { '@/*': ['./*'], '@x/ui': ['../ui/src'] },
    });
  });
});

describe('onsystem and change scoring', () => {
  it('summarizes check output', () => {
    const s = summarizeCheck([
      {
        file: 'a.tsx',
        diagnostics: [
          { ruleId: 'no-hardcoded-color', severity: 'error', message: 'm', line: 1, column: 1 },
        ],
      },
      {
        file: 'b.tsx',
        diagnostics: [
          { ruleId: 'no-hardcoded-spacing', severity: 'warning', message: 'm', line: 2, column: 1 },
        ],
      },
    ]);
    expect(s).toMatchObject({
      errors: 1,
      warnings: 1,
      byRule: { 'no-hardcoded-color': 1, 'no-hardcoded-spacing': 1 },
    });
    expect(s.findings[0]?.file).toBe('a.tsx');
    expect(() => summarizeCheck({})).toThrow(/JSON array/);
  });

  it('diffs manifests by content', () => {
    const stamp = (hash: string) => ({ size: 1, mtimeMs: 1, hash });
    expect(
      diffManifests(
        { a: stamp('1'), b: stamp('2'), c: stamp('3') },
        { a: stamp('1'), b: stamp('9'), d: stamp('4') },
      ),
    ).toEqual({
      added: ['d'],
      modified: ['b'],
      deleted: ['c'],
    });
  });

  it('sorts files for each scorer', () => {
    expect(classify(['a.tsx', 'b.ts', 'c.d.ts', 'd.jsx', 'e.css'])).toEqual({
      ui: ['a.tsx', 'd.jsx'],
      typescript: ['a.tsx', 'b.ts'],
    });
  });
});

// ─── Plan, cost and keys ──────────────────────────────────────────────────────

const models = (readJson(path.join(bench, 'config/models.json')) as { models: ModelSpec[] }).models;
const tasks = (readJson(path.join(bench, 'config/tasks.json')) as { tasks: Task[] }).tasks;
const matrices = (
  readJson(path.join(bench, 'config/matrices.json')) as { matrices: Record<string, MatrixSpec> }
).matrices;
const usageConfig = readJson(path.join(bench, 'config/usage-model.json')) as {
  profiles: UsageModel['profiles'];
  pessimistic: UsageModel['pessimistic'];
};
const usage: UsageModel = {
  profiles: usageConfig.profiles,
  overhead: { base: 700, skillListing: 170, skillBody: 570, mcp: 1569 },
  pessimistic: usageConfig.pessimistic,
};
const model = (id: string) => {
  const m = models.find((x) => x.id === id);
  if (!m) throw new Error(id);
  return m;
};

describe('plan', () => {
  it('knows the five arms', () => {
    expect(armParts('all')).toEqual({ skill: true, mcp: true, hook: true });
    expect(armParts('hook')).toEqual({ skill: false, mcp: false, hook: true });
    expect(() => armParts('plugin')).toThrow(/Unknown arm/);
  });

  it('expands every matrix into unique runs', () => {
    for (const matrix of Object.values(matrices)) {
      const runs = expandMatrix(matrix, tasks, models);
      expect(new Set(runs.map((r) => r.id)).size).toBe(runs.length);
    }
    expect(expandMatrix(matrices.standard as MatrixSpec, tasks, models)).toHaveLength(1200);
    expect(expandMatrix(matrices.canary as MatrixSpec, tasks, models)).toHaveLength(12);
    expect(() =>
      expandMatrix(
        {
          description: '',
          groups: [{ models: ['gpt-0'], arms: ['none'], tasksPerRepo: 1, repeats: 1 }],
        },
        tasks,
        models,
      ),
    ).toThrow(/gpt-0/);
    expect(() =>
      expandMatrix(
        {
          description: '',
          groups: [{ models: ['mock'], arms: ['none'], tasksPerRepo: 9, repeats: 1 }],
        },
        tasks,
        models,
      ),
    ).toThrow(/asks for 9/);
  });

  it('prices a request, with tiers and without a cache-write premium', () => {
    const haiku = model('claude-haiku-5-5');
    expect(
      costOf({ input: 1_000_000, cacheRead: 0, cacheWrite: 0, output: 0 }, haiku.price),
    ).toBeCloseTo(0.5);
    expect(
      costOf({ input: 10_000, cacheRead: 0, cacheWrite: 0, output: 1000 }, haiku.price),
    ).toBeCloseTo(0.0015);
    const flash = model('gemini-3.8-flash');
    expect(
      costOf({ input: 0, cacheRead: 0, cacheWrite: 1_000_000, output: 0 }, flash.price),
    ).toBeCloseTo(0.75);
  });

  it('reproduces v1 within its stated error when given v1’s own setup', () => {
    // v1: Claude Code's fixed prompt (34,261 tokens per request), Claude Haiku 4.5 at $1 input,
    // $2 for 1-hour cache writes, $0.10 cache reads, $5 output. Measured mean: $0.1309 per run.
    const haiku45: ModelSpec = {
      ...model('claude-haiku-5-5'),
      price: { input: 1, cacheWrite: 2, cacheRead: 0.1, output: 5 },
    };
    const v1 = { ...usage, overhead: { base: 34_261, skillListing: 0, skillBody: 0, mcp: 0 } };
    const { expected } = estimateRun(haiku45, 'none', v1);
    expect(expected.cost).toBeCloseTo(0.168, 2);
    expect(expected.cost / 0.1309).toBeGreaterThan(1);
    expect(expected.cost / 0.1309).toBeLessThan(1.35);
  });

  it('estimates more for treated arms and the pessimistic case', () => {
    const sonnet = model('claude-sonnet-5-5');
    const none = estimateRun(sonnet, 'none', usage);
    const all = estimateRun(sonnet, 'all', usage);
    expect(all.expected.cost).toBeGreaterThan(none.expected.cost);
    expect(none.pessimistic.cost).toBeGreaterThan(none.expected.cost * 2);
  });

  it('sums a plan, using measured costs where there are some', () => {
    const runs = expandMatrix(matrices.canary as MatrixSpec, tasks, models);
    const plan = estimatePlan(runs, models, usage);
    expect(plan.lines).toHaveLength(6);
    expect(plan.expectedCost).toBeGreaterThan(0);
    const measured = calibration([{ model: 'gpt-6-luna', arm: 'none', cost: 0.5, status: 'done' }]);
    const recalibrated = estimatePlan(runs, models, usage, measured);
    expect(recalibrated.lines.find((l) => l.model === 'gpt-6-luna')?.measuredRuns).toBe(1);
    expect(renderPlan('canary', matrices.canary as MatrixSpec, plan, runs.length)).toMatch(
      /total\s+12/,
    );
  });

  it('stops at the cap', () => {
    const budget = createBudget(1, 0.5);
    expect(budget.add(0.4)).toBe(false);
    expect(budget.exceeded()).toBe(false);
    expect(budget.add(0.2)).toBe(true);
    expect(budget.exceeded()).toBe(true);
    expect(() => createBudget(Number.NaN)).toThrow(/spend cap/);
  });

  it('names missing keys, never values', () => {
    const providers = (
      readJson(path.join(bench, 'config/models.json')) as {
        providers: Parameters<typeof missingKeys>[1];
      }
    ).providers;
    const runs = expandMatrix(matrices.canary as MatrixSpec, tasks, models);
    expect(missingKeys(runs, providers, {})).toEqual([
      'ANTHROPIC_API_KEY',
      'GEMINI_API_KEY',
      'OPENAI_API_KEY',
    ]);
    expect(
      missingKeys(runs, providers, {
        ANTHROPIC_API_KEY: 'k',
        OPENAI_API_KEY: ' ',
        GEMINI_API_KEY: 'k',
      }),
    ).toEqual(['OPENAI_API_KEY']);
    expect(
      missingKeys(expandMatrix(matrices.mock as MatrixSpec, tasks, models), providers, {}),
    ).toEqual([]);
  });
});

// ─── API adapters ─────────────────────────────────────────────────────────────

const request: TurnRequest = {
  system: 'SYSTEM',
  tools: [
    {
      name: 'read_file',
      description: 'Read',
      schema: {
        type: 'object',
        properties: { path: { type: 'string' } },
        required: ['path'],
        additionalProperties: false,
        $schema: 'x',
      },
    },
  ],
  messages: [
    { role: 'user', text: 'Do it' },
    {
      role: 'assistant',
      text: '',
      toolCalls: [{ id: 'c1', name: 'read_file', input: { path: 'a' } }],
      raw: 'RAW',
    },
    { role: 'tool', results: [{ id: 'c1', name: 'read_file', output: 'nope', isError: true }] },
  ],
  maxOutputTokens: 1000,
};

describe('Anthropic', () => {
  it('caches the system prompt and the conversation, and echoes the model’s content', () => {
    const body = anthropicBody('claude-haiku-5-5', 'medium', request);
    expect(body).toMatchObject({
      model: 'claude-haiku-5-5',
      max_tokens: 1000,
      system: [{ type: 'text', text: 'SYSTEM', cache_control: { type: 'ephemeral' } }],
      cache_control: { type: 'ephemeral' },
      output_config: { effort: 'medium' },
    });
    expect(body.messages).toEqual([
      { role: 'user', content: [{ type: 'text', text: 'Do it' }] },
      { role: 'assistant', content: 'RAW' },
      {
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: 'c1', content: 'nope', is_error: true }],
      },
    ]);
    expect(anthropicBody('m', null, request)).not.toHaveProperty('output_config');
  });

  it('reads tool calls, usage and the stop reason', () => {
    const turn = anthropicTurn({
      content: [
        { type: 'thinking', thinking: '', signature: 's' },
        { type: 'text', text: 'Reading.' },
        { type: 'tool_use', id: 't1', name: 'read_file', input: { path: 'x' } },
      ],
      stop_reason: 'tool_use',
      usage: {
        input_tokens: 10,
        cache_creation_input_tokens: 200,
        cache_read_input_tokens: 3000,
        output_tokens: 50,
      },
    });
    expect(turn).toMatchObject({
      text: 'Reading.',
      stop: 'tool_use',
      usage: { input: 10, cacheWrite: 200, cacheRead: 3000, output: 50 },
    });
    expect(turn.toolCalls).toEqual([{ id: 't1', name: 'read_file', input: { path: 'x' } }]);
    expect(Array.isArray(turn.raw) && turn.raw.length).toBe(3);
    expect(anthropicTurn({ content: [], stop_reason: 'refusal' }).stop).toBe('refusal');
  });
});

describe('OpenAI', () => {
  it('sends a stateless Responses request', () => {
    const body = openaiBody('gpt-6-luna', 'medium', {
      ...request,
      messages: [
        request.messages[0] as Message,
        {
          ...(request.messages[1] as Message),
          raw: [{ type: 'reasoning', encrypted_content: 'e' }],
        } as Message,
        request.messages[2] as Message,
      ],
    });
    expect(body).toMatchObject({
      model: 'gpt-6-luna',
      instructions: 'SYSTEM',
      store: false,
      include: ['reasoning.encrypted_content'],
      reasoning: { effort: 'medium' },
      max_output_tokens: 1000,
    });
    expect(body.input).toEqual([
      { role: 'user', content: [{ type: 'input_text', text: 'Do it' }] },
      { type: 'reasoning', encrypted_content: 'e' },
      { type: 'function_call_output', call_id: 'c1', output: 'nope' },
    ]);
    expect(body.tools).toEqual([
      {
        type: 'function',
        name: 'read_file',
        description: 'Read',
        parameters: request.tools[0]?.schema,
        strict: false,
      },
    ]);
  });

  it('separates cached and written input, and reads function calls', () => {
    const turn = openaiTurn({
      status: 'completed',
      output: [
        { type: 'reasoning', id: 'rs_1', encrypted_content: 'e' },
        { type: 'function_call', call_id: 'call_1', name: 'read_file', arguments: '{"path":"a"}' },
        { type: 'function_call', call_id: 'call_2', name: 'read_file', arguments: '{not json' },
      ],
      usage: {
        input_tokens: 5000,
        input_tokens_details: { cached_tokens: 4000, cache_write_tokens: 600 },
        output_tokens: 300,
      },
    });
    expect(turn.usage).toEqual({ input: 400, cacheRead: 4000, cacheWrite: 600, output: 300 });
    expect(turn.stop).toBe('tool_use');
    expect(turn.toolCalls[0]).toEqual({ id: 'call_1', name: 'read_file', input: { path: 'a' } });
    expect(turn.toolCalls[1]?.input).toHaveProperty('__invalid');
    expect(
      openaiTurn({
        status: 'incomplete',
        incomplete_details: { reason: 'max_output_tokens' },
        output: [],
      }).stop,
    ).toBe('max_tokens');
  });
});

describe('Gemini', () => {
  it('converts JSON Schema to Gemini’s subset', () => {
    expect(
      toGeminiSchema({
        type: 'object',
        $schema: 'x',
        additionalProperties: false,
        properties: {
          a: { type: ['string', 'null'], maxLength: 3 },
          b: { type: 'array', items: { type: 'integer', default: 5 } },
        },
        required: ['a'],
      }),
    ).toEqual({
      type: 'object',
      properties: {
        a: { type: 'string', nullable: true, maxLength: 3 },
        b: { type: 'array', items: { type: 'integer', default: 5 } },
      },
      required: ['a'],
    });
  });

  it('sends function responses with their ids and the model’s parts unchanged', () => {
    const raw = {
      role: 'model',
      parts: [
        {
          functionCall: { id: 'c1', name: 'read_file', args: { path: 'a' } },
          thoughtSignature: 'sig',
        },
      ],
    };
    const body = geminiBody('medium', {
      ...request,
      messages: [
        request.messages[0] as Message,
        { ...(request.messages[1] as Message), raw } as Message,
        request.messages[2] as Message,
      ],
    });
    expect(body).toMatchObject({
      systemInstruction: { parts: [{ text: 'SYSTEM' }] },
      generationConfig: { maxOutputTokens: 1000, thinkingConfig: { thinkingLevel: 'medium' } },
    });
    expect(body.contents).toEqual([
      { role: 'user', parts: [{ text: 'Do it' }] },
      raw,
      {
        role: 'user',
        parts: [{ functionResponse: { name: 'read_file', id: 'c1', response: { error: 'nope' } } }],
      },
    ]);
    expect(JSON.stringify(body.tools)).not.toContain('$schema');
  });

  it('reads calls, leaves thoughts out of the text, and counts thinking as output', () => {
    let n = 0;
    const turn = geminiTurn(
      {
        candidates: [
          {
            finishReason: 'STOP',
            content: {
              role: 'model',
              parts: [
                { text: 'thinking...', thought: true },
                { text: 'Done' },
                { functionCall: { name: 'read_file', args: { path: 'b' } } },
              ],
            },
          },
        ],
        usageMetadata: {
          promptTokenCount: 1000,
          cachedContentTokenCount: 800,
          candidatesTokenCount: 40,
          thoughtsTokenCount: 60,
        },
      },
      () => ++n,
    );
    expect(turn.text).toBe('Done');
    expect(turn.toolCalls).toEqual([
      { id: 'gemini-call-1', name: 'read_file', input: { path: 'b' } },
    ]);
    expect(turn.usage).toEqual({ input: 200, cacheRead: 800, cacheWrite: 0, output: 100 });
    expect(geminiTurn({ candidates: [{ finishReason: 'SAFETY' }] }, () => 1).stop).toBe('refusal');
  });
});

describe('HTTP and keys', () => {
  const secret = 'test-key-not-real-0123';
  const options = (fetch: Fetch) => ({
    model: 'claude-haiku-5-5',
    effort: null,
    keyEnv: 'ANTHROPIC_API_KEY',
    endpoint: 'https://api.anthropic.com/v1/messages',
    env: { ANTHROPIC_API_KEY: secret },
    fetch,
    sleep: () => Promise.resolve(),
  });
  const ok = {
    content: [{ type: 'text', text: 'hi' }],
    stop_reason: 'end_turn',
    usage: { input_tokens: 1, output_tokens: 1 },
  };

  it('reads the key by name and says which one is missing', () => {
    expect(readKey({ X_KEY: ' v ' }, 'X_KEY')).toBe('v');
    expect(() => readKey({}, 'X_KEY')).toThrow(/X_KEY is not set/);
  });

  it('retries rate limits and overload, then succeeds', async () => {
    let calls = 0;
    const provider = createProvider(
      'anthropic',
      options(() => {
        calls++;
        return Promise.resolve(
          calls < 3 ? new Response('busy', { status: calls === 1 ? 429 : 529 }) : Response.json(ok),
        );
      }),
    );
    const turn = await provider.turn(request);
    expect(turn.text).toBe('hi');
    expect(calls).toBe(3);
  });

  it('sends the key only in its header, and never puts it in an error', async () => {
    let seen: RequestInit | undefined;
    const provider = createProvider(
      'anthropic',
      options((_url, init) => {
        seen = init;
        return Promise.resolve(new Response(`invalid x-api-key ${secret}`, { status: 401 }));
      }),
    );
    const error = await provider.turn(request).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('HTTP 401');
    expect((error as Error).message).not.toContain(secret);
    expect(seen?.body).toEqual(expect.not.stringContaining(secret));
    expect((seen?.headers as Record<string, string>)['x-api-key']).toBe(secret);
  });

  it('refuses an unknown provider', () => {
    expect(() =>
      createProvider(
        'acme',
        options(() => Promise.resolve(Response.json(ok))),
      ),
    ).toThrow(/No adapter/);
  });
});

// ─── Tools, mock model and the loop ───────────────────────────────────────────

const temps: string[] = [];
afterEach(() => {
  for (const dir of temps.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});
function tempProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bench-v2-'));
  temps.push(dir);
  fs.mkdirSync(path.join(dir, 'components/ui'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'components/ui/button.tsx'),
    'export function Button() {\n  return null;\n}\n',
  );
  fs.mkdirSync(path.join(dir, 'node_modules/react'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'node_modules/react/index.js'), 'export function Button() {}\n');
  return dir;
}

describe('file tools', () => {
  it('stays inside the project', () => {
    expect(resolveInside('/p', 'a/b.tsx').relative).toBe('a/b.tsx');
    expect(() => resolveInside('/p', '../x')).toThrow(/outside/);
    expect(() => resolveInside('/p', '/etc/passwd')).toThrow(/outside/);
  });

  it('lists, reads, searches, writes and edits', () => {
    const dir = tempProject();
    const run = createFileTools(dir);
    expect(run('list_files', {})?.output).toBe('components/\ncomponents/ui/');
    expect(run('list_files', { depth: 3 })?.output).toContain('components/ui/button.tsx');
    expect(run('read_file', { path: 'components/ui/button.tsx' })?.output).toContain(
      '    1\texport function Button()',
    );
    expect(run('search_files', { pattern: 'function Button', glob: '*.tsx' })?.output).toBe(
      'components/ui/button.tsx:1: export function Button() {',
    );
    const write = run('write_file', { path: 'app/x.tsx', content: 'a\nb\n' });
    expect(write).toMatchObject({ isError: false, write: { kind: 'Write' } });
    expect(
      run('edit_file', { path: 'app/x.tsx', old_string: 'b', new_string: 'c' })?.write?.kind,
    ).toBe('Edit');
    expect(fs.readFileSync(path.join(dir, 'app/x.tsx'), 'utf8')).toBe('a\nc\n');
    expect(
      run('edit_file', { path: 'app/x.tsx', old_string: 'zzz', new_string: 'c' }),
    ).toMatchObject({ isError: true });
    expect(run('write_file', { path: 'node_modules/react/index.js', content: '' })).toMatchObject({
      isError: true,
    });
    expect(run('read_file', { path: '../outside' })).toMatchObject({ isError: true });
    expect(run('search_files', { pattern: '(' })).toMatchObject({ isError: true });
    expect(run('unknown', {})).toBeUndefined();
    expect(FILE_TOOLS.map((t) => t.name)).toEqual([
      'list_files',
      'read_file',
      'search_files',
      'write_file',
      'edit_file',
    ]);
  });

  it('matches file name globs', () => {
    expect(globToRegex('*.tsx').test('button.tsx')).toBe(true);
    expect(globToRegex('*.{ts,tsx}').test('a.ts')).toBe(true);
    expect(globToRegex('*.{ts,tsx}').test('a.css')).toBe(false);
  });
});

const control: MockControl = {
  import: "import { Button } from '@/components/ui/button';",
  component: 'Button',
  valid: '<Button variant="outline">Retry</Button>',
  invalid: '<Button variant="warning">Retry</Button>',
};

describe('mock model', () => {
  it('explores, writes the task’s file, and stops', () => {
    const messages: Message[] = [
      { role: 'user', text: 'Create components/x.tsx exporting X: a thing.' },
    ];
    const names: string[] = [];
    for (let i = 0; i < 6; i++) {
      const turn = mockTurn(
        { system: '', tools: FILE_TOOLS, messages, maxOutputTokens: 100 },
        { model: 'mock', control, seed: 1 },
      );
      if (!turn.toolCalls.length) break;
      names.push(...turn.toolCalls.map((c) => c.name));
      messages.push({
        role: 'assistant',
        text: turn.text,
        toolCalls: turn.toolCalls,
        raw: turn.raw,
      });
      messages.push({
        role: 'tool',
        results: turn.toolCalls.map((c) => ({
          id: c.id,
          name: c.name,
          output: 'ok',
          isError: false,
        })),
      });
      expect(turn.usage.output).toBeGreaterThan(0);
    }
    expect(names).toEqual(['list_files', 'search_files', 'write_file']);
  });
});

interface AgentResult {
  status: string;
  calls: number;
  cost: number;
  skillLoads: number;
}
type RunAgent = (options: Record<string, unknown>) => Promise<AgentResult>;

describe('agent loop', async () => {
  const { runAgent } = (await import('../bench/v2/lib/agent.mjs')) as unknown as {
    runAgent: RunAgent;
  };
  const price = model('mock').price;

  it('runs the mock to the end and creates the file', async () => {
    const dir = tempProject();
    const skill = parseSkill(
      fs.readFileSync(path.join(root, 'plugins/onsystem/skills/onsystem/SKILL.md'), 'utf8'),
    );
    const result = await runAgent({
      provider: createMockProvider({ model: 'mock', control, seed: 3 }),
      price,
      budget: createBudget(10),
      root: dir,
      system: systemPrompt({ skill }),
      prompt: taskPrompt('Create components/x.tsx exporting X: a thing.'),
      skill,
    });
    expect(result).toMatchObject({ status: 'done', skillLoads: 1 });
    expect(result.cost).toBeGreaterThan(0);
    expect(fs.readFileSync(path.join(dir, 'components/x.tsx'), 'utf8')).toContain(
      'export function X()',
    );
  });

  it('stops at the spend cap', async () => {
    const result = await runAgent({
      provider: createMockProvider({ model: 'mock', control, seed: 3 }),
      price,
      budget: createBudget(0),
      root: tempProject(),
      system: systemPrompt(),
      prompt: 'Create components/x.tsx exporting X: a thing.',
    });
    expect(result).toMatchObject({ status: 'aborted', calls: 1 });
  });

  it('records a provider failure as an error', async () => {
    const failing: Provider = {
      name: 'x',
      model: 'x',
      turn: () => Promise.reject(new Error('HTTP 500')),
    };
    const result = await runAgent({
      provider: failing,
      price,
      budget: createBudget(10),
      root: tempProject(),
      system: '',
      prompt: 'p',
    });
    expect(result.status).toBe('error');
  });
});

describe('run workspaces', async () => {
  const { createWorkspace } = (await import('../bench/v2/lib/repo.mjs')) as unknown as {
    createWorkspace: (src: string, dest: string) => void;
  };

  // Windows junctions store absolute targets; the harness runs on macOS and Linux.
  it.skipIf(process.platform === 'win32')(
    'copies sources and mirrors node_modules, keeping workspace packages inside the copy',
    () => {
      const base = fs.mkdtempSync(path.join(os.tmpdir(), 'bench-v2-ws-'));
      temps.push(base);
      const src = path.join(base, 'src');
      const dest = path.join(base, 'dest');
      fs.mkdirSync(path.join(src, 'packages/ui/src'), { recursive: true });
      fs.writeFileSync(path.join(src, 'packages/ui/src/button.tsx'), 'export {};\n');
      fs.mkdirSync(path.join(src, 'node_modules/.pnpm/react@19/node_modules/react'), {
        recursive: true,
      });
      fs.mkdirSync(path.join(src, 'apps/web/node_modules/@acme'), { recursive: true });
      fs.symlinkSync(
        '../../../../packages/ui',
        path.join(src, 'apps/web/node_modules/@acme/ui'),
        'junction',
      );
      fs.symlinkSync(
        '../../../node_modules/.pnpm/react@19/node_modules/react',
        path.join(src, 'apps/web/node_modules/react'),
        'junction',
      );
      fs.writeFileSync(path.join(src, 'apps/web/page.tsx'), 'export {};\n');

      createWorkspace(src, dest);
      expect(fs.readFileSync(path.join(dest, 'apps/web/page.tsx'), 'utf8')).toBe('export {};\n');
      expect(fs.lstatSync(path.join(dest, 'apps/web/node_modules')).isSymbolicLink()).toBe(false);
      expect(fs.realpathSync(path.join(dest, 'apps/web/node_modules/@acme/ui'))).toBe(
        fs.realpathSync(path.join(dest, 'packages/ui')),
      );
      expect(fs.realpathSync(path.join(dest, 'apps/web/node_modules/react'))).toBe(
        fs.realpathSync(path.join(src, 'node_modules/.pnpm/react@19/node_modules/react')),
      );
      expect(fs.realpathSync(path.join(dest, 'node_modules/.pnpm'))).toBe(
        fs.realpathSync(path.join(src, 'node_modules/.pnpm')),
      );
    },
  );
});

// ─── Prompt and configuration ─────────────────────────────────────────────────

describe('prompt', () => {
  it('ends every task with v1’s instruction, word for word', () => {
    const v1 = fs.readFileSync(path.join(root, 'bench/agents/run.mjs'), 'utf8');
    expect(v1).toContain(JSON.stringify(TASK_SUFFIX));
  });

  it('adds the skill listing and the MCP instructions only in their arms', () => {
    const skill = parseSkill(
      fs.readFileSync(path.join(root, 'plugins/onsystem/skills/onsystem/SKILL.md'), 'utf8'),
    );
    expect(skill.name).toBe('onsystem');
    expect(systemPrompt()).not.toContain('load_skill');
    expect(systemPrompt({ skill })).toContain(`- onsystem: ${skill.description}`);
    expect(systemPrompt({ mcpInstructions: 'USE TOOLS' })).toContain('USE TOOLS');
  });
});

describe('configuration', () => {
  const repos = (
    readJson(path.join(bench, 'config/repos.json')) as {
      repos: { name: string; corpus: string; project: string }[];
    }
  ).repos;
  const corpus = (readJson(path.join(root, 'corpus/repos.json')) as { repos: { name: string }[] })
    .repos;

  it('runs five or more corpus repositories with four tasks each', () => {
    expect(repos.length).toBeGreaterThanOrEqual(5);
    for (const repo of repos) {
      expect(corpus.some((c) => c.name === repo.corpus)).toBe(true);
      const own = tasks.filter((t) => t.repo === repo.name);
      expect(own).toHaveLength(4);
      for (const t of own) {
        expect(t.prompt.startsWith(`Create ${t.file} exporting `)).toBe(true);
        expect(repo.project === '.' || t.file.startsWith(`${repo.project}/`)).toBe(true);
      }
    }
  });

  it('keeps v1’s chatbot prompts unchanged', () => {
    const v1 = readJson(path.join(root, 'bench/agents/tasks.json')) as {
      id: string;
      prompt: string;
    }[];
    for (const t of tasks.filter((x) => x.repo === 'chatbot')) {
      expect(v1.find((v) => v.id === t.id)?.prompt).toBe(t.prompt);
    }
  });

  it('cites a source for every paid model’s price', () => {
    for (const m of models.filter((x) => x.provider !== 'mock')) {
      expect(m.sources.length).toBeGreaterThan(0);
      for (const n of [m.price.input, m.price.cacheRead, m.price.output])
        expect(n).toBeGreaterThan(0);
    }
  });
});
