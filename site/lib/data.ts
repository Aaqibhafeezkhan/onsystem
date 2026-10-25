/**
 * Typed access to generated/*.json, which scripts/generate.mjs writes at build time from the
 * library, the demo design system, the benchmark results, docs/*.md and the README.
 */
import benchmarkJson from '@/generated/benchmark.json';
import corpusJson from '@/generated/corpus.json';
import demoJson from '@/generated/demo.json';
import designSystemJson from '@/generated/design-system.json';
import docsJson from '@/generated/docs.json';
import readmeJson from '@/generated/readme.json';
import rulesJson from '@/generated/rules.json';
import socialJson from '@/generated/social.json';
import toolsJson from '@/generated/tools.json';

export interface Finding {
  ruleId: string;
  severity: 'error' | 'warning';
  message: string;
  line: number;
  column: number;
  /** 0-based offsets into the draft. */
  start: number;
  end: number;
  source: string;
  suggestion: string | null;
  fixable: boolean;
  /** Short forms for the transcript: `border-[#ef4444]` → `border-destructive`. */
  found: string;
  fix: string;
}

export interface Demo {
  prompt: string;
  file: string;
  draft: string;
  fixed: string;
  findings: Finding[];
  errorCount: number;
  warningCount: number;
  /** Spans of `fixed` that the agent changed. */
  changes: { start: number; end: number }[];
  /** Median time of one check of the draft, measured at build time. */
  checkMs: number;
}

/** A rate with its 95% Wilson interval, as bench/v2's results.json has it (fractions). */
export interface BenchRate {
  successes: number;
  n: number;
  value: number;
  low: number;
  high: number;
}

/** A mean or a difference with its 95% cluster-bootstrap interval. */
export interface BenchInterval {
  value: number;
  low: number;
  high: number;
}

/** One model (or a pool of models) and arm, from bench/v2's results.json. */
export interface BenchRow {
  model: string;
  provider: string;
  arm: string;
  runs: number;
  scored: number;
  created: BenchRate;
  tscPass: BenchRate;
  onsystemClean: BenchRate;
  accepted: BenchRate;
  onsystemErrors: BenchInterval;
  cost: BenchInterval;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  hookBlocks: number;
  mcpCalls: number;
  skillLoads: number;
}

/** An arm against `none`, paired on model, task and repeat. */
export interface BenchDelta {
  model: string;
  arm: string;
  pairs: number;
  tscPass: BenchInterval;
  onsystemClean: BenchInterval;
  accepted: BenchInterval;
  onsystemErrors: BenchInterval;
}

/** @shadcn/lint's findings per run for one pool of models and arm, from results.json. */
export interface ShadcnLintRow {
  model: string;
  arm: string;
  runs: number;
  /** Runs whose file existed to lint: a run that created none counts 0 findings. */
  linted: number;
  findings: BenchInterval;
  /** Findings per run, by @shadcn/lint rule. */
  byRule: Record<string, number>;
}

/** An arm against `none` in @shadcn/lint's findings per run, paired on model, task and repeat. */
export interface ShadcnLintDelta {
  model: string;
  arm: string;
  pairs: number;
  findings: BenchInterval;
}

/** A rate as results.md prints it: whole percents. */
export interface LabelRate {
  successes: number;
  n: number;
  percent: number;
  low: number;
  high: number;
}

/** bench/v2's standard run: results.json, the blind labels, and the method from the README. */
export interface Benchmark {
  matrix: string;
  date: string;
  onsystem: string;
  runs: number;
  statuses: Record<string, number>;
  models: { id: string; name: string; provider: string; tier: string; runs: number }[];
  providers: { id: string; name: string }[];
  arms: string[];
  repos: {
    name: string;
    url: string;
    sha: string;
    project: string;
    typescript: string;
    designSystem: string;
  }[];
  tasks: { id: string; repo: string; prompt: string }[];
  rows: BenchRow[];
  deltas: BenchDelta[];
  /** The independent scorer, pooled over all models: results.json's `shadcnLint`. */
  shadcnLint: {
    /** @shadcn/lint's version, as config/shadcn-lint.json pins it. */
    version: string;
    rules: string[];
    /** The command bench/v2/README.md gives to score the run again. */
    rerun: string;
    rows: ShadcnLintRow[];
    deltas: ShadcnLintDelta[];
  };
  cost: { total: number; cap: number; pricesVerified: string };
  time: { wallMinutes: number; medianSeconds: number; minSeconds: number; maxSeconds: number };
  labels: {
    files: number;
    findings: number;
    labeller: { kind: string; model: string; provider: string; sameFamily: string[] };
    arms: {
      arm: string;
      labelled: number;
      wouldMerge: LabelRate;
      clean: LabelRate;
      violations: BenchInterval;
    }[];
    agreement: { both: number; onsystemOnly: number; labellerOnly: number; neither: number };
    precision: LabelRate & { debatable: number };
  };
  /** Sections of bench/v2/README.md, as Markdown with links relative to the repository root. */
  method: {
    arms: string;
    scoring: string;
    statistics: string;
    threats: string;
    running: string;
  };
  release: { url: string; tag: string };
}

export interface Tools {
  version: string;
  tools: { name: string; title: string; description: string }[];
  prompts: { name: string; title: string; description: string }[];
  resources: string[];
  samples: {
    tool: string;
    args: Record<string, unknown>;
    output: string;
    /** The response's `structuredContent`. */
    structured: unknown;
  }[];
}

export interface Rule {
  id: string;
  description: string;
  severity: 'error' | 'warn' | 'off';
}

export interface RuleEntry extends Rule {
  /** The Rules table in docs/rules.md, as Markdown. */
  catches: string;
  suggests: string;
  why: string;
  allow: string | null;
  /** An example the rule trips on, and the same code after the fix (verified clean). */
  bad: string;
  good: string;
  fixedBy: 'rule' | 'hand';
  changes: { start: number; end: number }[];
  /** Rules to read next, from scripts/rule-docs.mjs. */
  related: string[];
  /** The example with a comment that suppresses the finding on `line`, checked when built. */
  suppressed: { code: string; line: number };
  findings: {
    severity: 'error' | 'warning';
    message: string;
    line: number;
    column: number;
    start: number;
    end: number;
    suggestion: string | null;
    fixable: boolean;
  }[];
}

export interface RuleCatalog {
  version: string;
  rules: RuleEntry[];
  /** What the rules do not check yet, as Markdown from docs/rules.md. */
  limits: string;
  /** How colour, spacing and radius fixes are chosen, from docs/rules.md. */
  details: string;
  /** Suppression comments and overrides, as Markdown from docs/rules.md. */
  suppression: string;
  /** Its last paragraph: what each suppression comment covers. */
  suppressionScope: string;
}

/** The docs/*.md pages, each without its `# title`. */
export interface Docs {
  quickstart: string;
  plugin: string;
  rollout: string;
  ci: string;
  requiredCheck: string;
  clients: string;
  configuration: string;
  designSystemPackages: string;
  tokens: string;
  eslint: string;
  rules: string;
  tools: string;
  troubleshooting: string;
  howItWorks: string;
  migrating: string;
  /** The Limits section of how-it-works.md. */
  limits: string;
  /** The plugin's SKILL.md, without its front matter. */
  skill: string;
}

/** A share as a percentage to one decimal, with its 95% Wilson interval. */
export interface CorpusRate {
  value: number;
  low: number;
  high: number;
}

/** The real-world corpus: pinned repositories, their findings and the blind sample. */
export interface Corpus {
  repos: number;
  runs: number;
  /** Distinct findings across the runs. */
  findings: number;
  /** A seeded random sample of the findings, stratified by rule, with blind labels (corpus/<draw>). */
  sample: {
    draw: string;
    /** The AI reviewer's model. */
    labeller: string;
    n: number;
    truePositives: number;
    debatable: number;
    falsePositives: number;
    rate: CorpusRate;
    /** Weighted by each rule's share of the findings, in percent. */
    weightedRate: number;
    /** The rule most false positives come from. */
    top: { rule: string; falsePositives: number; sampled: number };
    /** Counting values the project's own design system already uses as debatable. */
    strict: { falsePositives: number; rate: CorpusRate };
  };
  /** midday's dashboard, the baseline example: its findings, the files they are in, and the files checked. */
  baseline: { findings: number; flagged: number; files: number };
}

export interface MarkdownTable {
  header: string[];
  rows: string[][];
}

export interface Readme {
  install: { cursor: string; vscode: string; plugin: string };
  realCodebases: MarkdownTable & { intro: string };
  engines: { node: string };
}

export interface DesignSystemSummary {
  components: {
    name: string;
    description: string | null;
    element: string | null;
    variants: Record<string, string[]>;
    parts: string[];
  }[];
  tokens: Record<string, number>;
}

/** Fetched at build time; null when the request failed. */
export interface Social {
  stars: number | null;
  weeklyDownloads: number | null;
}

/** The generated files are checked by scripts/generate.mjs; here they get their types. */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- the point: a typed view of JSON
function typed<T>(json: unknown): T {
  return json as T;
}

export const demo = typed<Demo>(demoJson);
export const benchmark = typed<Benchmark>(benchmarkJson);
export const corpus = typed<Corpus>(corpusJson);
export const tools = typed<Tools>(toolsJson);
export const ruleCatalog = typed<RuleCatalog>(rulesJson);
export const rules: Rule[] = ruleCatalog.rules;
export const docs = typed<Docs>(docsJson);
export const readme = typed<Readme>(readmeJson);
export const designSystem = typed<DesignSystemSummary>(designSystemJson);
export const social = typed<Social>(socialJson);
