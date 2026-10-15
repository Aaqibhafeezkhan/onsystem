import type {
  BenchInterval,
  BenchRate,
  Benchmark,
  DesignSystemSummary,
  LabelRate,
} from '@/lib/data';
import type { Preset } from '@/lib/playground';

/**
 * The two pages without a docs/ file, /benchmark and /playground, as Markdown for agents:
 * scripts/generate.mjs indexes them for Ask and the docs MCP server, and llms-full.txt includes
 * them. It imports only types, which Node strips, so generate.mjs loads it as it is; for the same
 * reason the benchmark's headline comes in from headlineText() in lib/benchmark.ts. Headings carry
 * the ids the pages give their sections (`{#labels}`), so a citation lands on its section.
 */

const RESULTS = 'bench/v2/results/standard';

/** A fraction as a whole percent, as lib/benchmark.ts and results.md round it. */
const percent = (value: number) => `${String(Math.round(value * 100))}%`;
/** A rate as results.md prints it: `221/240 92% [88%, 95%]`. */
const rate = (r: BenchRate) =>
  `${String(r.successes)}/${String(r.n)} ${percent(r.value)} [${percent(r.low)}, ${percent(r.high)}]`;
const labelRate = (r: LabelRate) =>
  `${String(r.successes)}/${String(r.n)} ${String(r.percent)}% [${String(r.low)}%, ${String(r.high)}%]`;
/** A mean per run or per file, never negative here, with its interval: `0.85 [0.40, 1.38]`. */
const mean = (m: BenchInterval) =>
  `${m.value.toFixed(2)} [${m.low.toFixed(2)}, ${m.high.toFixed(2)}]`;
const table = (header: string[], rows: string[][]) =>
  [header, header.map(() => '---'), ...rows].map((cells) => `| ${cells.join(' | ')} |`).join('\n');
const list = (items: string[]) =>
  items.length < 2
    ? items.join('')
    : `${items.slice(0, -1).join(', ')} and ${String(items.at(-1))}`;

/**
 * /benchmark: the headline, the pooled results, the blind labels, the method and the threats to
 * validity, from generated/benchmark.json. `headline` is headlineText(benchmark).
 */
export function benchmarkMarkdown(benchmark: Benchmark, headline: string): string {
  const { labels } = benchmark;
  const pooled = (arm: string) => {
    const row = benchmark.rows.find((r) => r.model === 'all models' && r.arm === arm);
    if (!row) throw new Error(`No benchmark row for all models, ${arm}`);
    return row;
  };
  const name = (id: string) => benchmark.models.find((m) => m.id === id)?.name ?? id;
  const family = labels.labeller.sameFamily.map(name);
  const perArm = labels.arms[0]?.labelled ?? 0;
  const wrong = labels.precision.n - labels.precision.successes;
  const tiers = [...new Set(benchmark.models.map((m) => m.tier))];
  const stopped = Object.entries(benchmark.statuses).filter(([status]) => status !== 'done');
  const labeller = `[LABELLER.md](${RESULTS}/labels/LABELLER.md)`;
  return [
    '# Benchmark',
    `Coding agents with and without onsystem. In the run of ${benchmark.date}, ${headline}. Every table is on [the benchmark page](/benchmark).`,
    `Each model wrote the same ${String(benchmark.tasks.length)} UI components in ${String(benchmark.repos.length)} open-source repositories (${list(benchmark.repos.map((r) => r.url.replace('https://github.com/', '')))}), once with no onsystem and once with each of its parts: the skill, the MCP server, the hook, and all three. A rule violation is an error from \`onsystem check\` that the run added to the repository, counted by onsystem ${benchmark.onsystem}, the release the benchmark ran: the tool under test scores the headline. \`tsc\` type-checks each file in its project's own setup, and a sample was labelled blind by an AI reviewer.`,
    '## Results {#results}',
    `Every arm, pooled over the ${String(benchmark.models.length)} models. Rates have 95% Wilson intervals; errors per run have 95% intervals from a bootstrap that resamples tasks.`,
    table(
      ['Arm', 'Runs', '`tsc` passes', 'onsystem-clean', 'onsystem errors per run'],
      benchmark.arms.map((arm) => {
        const row = pooled(arm);
        return [
          `\`${arm}\``,
          String(row.runs),
          rate(row.tscPass),
          rate(row.onsystemClean),
          mean(row.onsystemErrors),
        ];
      }),
    ),
    '## Blind labels {#labels}',
    `A stratified random sample of ${String(labels.files)} files (${String(perArm)} per arm) was labelled blind by an AI reviewer (${labels.labeller.model}), not by people. It saw the task, the design system and the file, not the model, the arm or onsystem's verdict, and counted invented APIs, hardcoded values, native elements and unnamed controls. ${String(family.length)} of the ${String(benchmark.models.length)} models (${list(family)}) are from the same family as the labeller, so they may share its blind spots. With ${String(perArm)} files per arm, the intervals are wide. Who labelled, what it could see and the rules it applied are in ${labeller}.`,
    table(
      ['Arm', 'Files labelled', 'Would merge', 'No violations', 'Violations per file'],
      labels.arms.map((a) => [
        `\`${a.arm}\``,
        String(a.labelled),
        labelRate(a.wouldMerge),
        labelRate(a.clean),
        mean(a.violations),
      ]),
    ),
    `Per file, onsystem and the labeller both found a problem in ${String(labels.agreement.both)}, only onsystem in ${String(labels.agreement.onsystemOnly)}, only the labeller in ${String(labels.agreement.labellerOnly)} and neither in ${String(labels.agreement.neither)}. Of onsystem's ${String(labels.findings)} findings on these files, the labeller judged ${String(labels.precision.successes)} correct, ${String(wrong)} wrong and ${String(labels.precision.debatable)} debatable.`,
    '## Method {#method}',
    `${String(benchmark.models.length)} models from ${String(benchmark.providers.length)} providers (${list(benchmark.providers.map((p) => p.name))}), in ${String(tiers.length)} tiers: ${tiers.map((tier) => `${tier}, ${list(benchmark.models.filter((m) => m.tier === tier).map((m) => m.name))}`).join('; ')}. Every model runs in the same agent loop, with the same file tools and no shell, at the same nominal reasoning level. ${benchmark.runs.toLocaleString('en-US')} runs: ${(benchmark.statuses.done ?? 0).toLocaleString('en-US')} finished${stopped.map(([status, n]) => `, ${n.toLocaleString('en-US')} stopped at a limit (${status})`).join('')}; a run that stops at a limit counts, with what it wrote. API cost $${benchmark.cost.total.toFixed(2)}, under a cap of $${String(benchmark.cost.cap)}.`,
    `### The arms\n\n${benchmark.method.arms}`,
    `### Scoring\n\n${benchmark.method.scoring}`,
    `### Statistics\n\n${benchmark.method.statistics}`,
    '## Threats to validity {#threats}',
    [
      `- **The labels are an AI reviewer's.** The sample was labelled blind by an AI reviewer (${labels.labeller.model}), not by people. ${labeller} records what it could see and how it decided.`,
      `- **The labeller's family is under test.** ${String(family.length)} of the ${String(benchmark.models.length)} models (${list(family)}) are from the same family as the labeller, so they may share blind spots.`,
      `- **onsystem is one of the scorers.** The headline counts the errors of onsystem ${benchmark.onsystem}, the release under test. \`tsc\` and the blind labels are the independent checks: \`tsc\` does not see hardcoded values, and the labels cover ${String(labels.files)} files.`,
      benchmark.method.threats,
    ].join('\n'),
    '## Reproduce it {#reproduce}',
    `The method, the per-run data and every file the runs wrote are in [${RESULTS}](${RESULTS}) and [bench/v2/README.md](bench/v2/README.md); every request's usage and every tool call are on the [${benchmark.release.tag} release](${benchmark.release.url}).`,
  ].join('\n\n');
}

/** /playground: what it does, its drafts, and the demo design system it checks against. */
export function playgroundMarkdown(
  presets: Pick<Preset, 'label' | 'description'>[],
  designSystem: DesignSystemSummary,
): string {
  const component = (c: DesignSystemSummary['components'][number]) =>
    [
      `- \`${c.name}\`${c.element ? ` (renders \`<${c.element}>\`)` : ''}`,
      ...Object.entries(c.variants).map(([prop, values]) => `${prop}: ${values.join(', ')}`),
      ...(c.parts.length ? [`parts: ${c.parts.join(', ')}`] : []),
    ].join('; ');
  return [
    '# Playground',
    `Run \`check_ui\` in the browser, on [the playground](/playground): edit the code or pick a draft, and see the findings and their fixes. It is checked against the [demo design system](examples/shadcn-demo) by the same rules the MCP server and the CLI run, on a server that parses the code and never runs it, and does not store it.`,
    presets.map((p) => `- **${p.label}**: ${p.description}`).join('\n'),
    '## What the demo design system has {#demo-ds-title}',
    `${String(designSystem.components.length)} shadcn/ui-style components built with \`cva\` and Radix, and Tailwind v4 tokens: ${String(designSystem.tokens.color ?? 0)} colors and ${String(designSystem.tokens.radius ?? 0)} radius steps on Tailwind's spacing scale. Anything else is unknown to the checker, as it would be in your project. Import from \`@/components/ui/…\`, or leave imports out: names resolve either way.`,
    designSystem.components.map(component).join('\n'),
  ].join('\n\n');
}
