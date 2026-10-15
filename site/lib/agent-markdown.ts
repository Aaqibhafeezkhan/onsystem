import type * as BenchmarkFormat from '@/lib/benchmark';
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
 * them. It imports only types, which Node strips, so generate.mjs loads it as it is. For the same
 * reason the formatters /benchmark prints with come in as an argument, the lib/benchmark.ts
 * module itself: Node cannot resolve the `@/` alias, so generate.mjs loads that file by its path.
 * Headings carry the ids the pages give their sections (`{#labels}`), so a citation lands on its
 * section; test/llms.test.ts checks that the caveats the page prints are here word for word.
 */

const RESULTS = 'bench/v2/results/standard';
/** The change that reads dub's color tokens, which the benchmarked release could not. */
const PR_107 = 'https://github.com/dgesteves/onsystem/pull/107';
/** Files with an anchor, linked whole: a relative link to one would resolve as a folder. */
const BLOB = 'https://github.com/dgesteves/onsystem/blob/main';

const labelRate = (r: LabelRate) =>
  `${String(r.successes)}/${String(r.n)} ${String(r.percent)}% [${String(r.low)}%, ${String(r.high)}%]`;
const table = (header: string[], rows: string[][]) =>
  [header, header.map(() => '---'), ...rows].map((cells) => `| ${cells.join(' | ')} |`).join('\n');
const list = (items: string[]) =>
  items.length < 2
    ? items.join('')
    : `${items.slice(0, -1).join(', ')} and ${String(items.at(-1))}`;
const capitalized = (text: string) => text.replace(/^./, (c) => c.toUpperCase());

/**
 * /benchmark: the headline, the pooled results, the independent scorer's count, the blind labels,
 * the method and the threats to validity, from generated/benchmark.json, formatted by `format`
 * (lib/benchmark.ts) as the page is.
 */
export function benchmarkMarkdown(benchmark: Benchmark, format: typeof BenchmarkFormat): string {
  const { labels, shadcnLint: lint } = benchmark;
  const { count, perRun, perRunInterval, percent, rateInterval, words } = format;
  /** A rate as results.md prints it: `221/240 92% [88%, 95%]`. */
  const rate = (r: BenchRate) =>
    `${String(r.successes)}/${String(r.n)} ${percent(r.value)} ${rateInterval(r)}`;
  /** Errors per run or violations per file, with the interval: `0.85 [0.40, 1.38]`. */
  const mean = (m: BenchInterval) => `${perRun(m.value)} ${perRunInterval(m)}`;
  const family = format.labellerFamily(benchmark);
  /** "Two of the six models (…)", as the page says it. */
  const familyOf = `${capitalized(words(family.length))} of the ${words(benchmark.models.length)} models (${family.join(' and ')})`;
  const perArm = labels.arms[0]?.labelled ?? 0;
  const wrong = labels.precision.n - labels.precision.successes;
  const tiers = [...new Set(benchmark.models.map((m) => m.tier))];
  const stopped = Object.entries(benchmark.statuses).filter(([status]) => status !== 'done');
  const labeller = `[LABELLER.md](${RESULTS}/labels/LABELLER.md)`;
  const lintSection = (file: string) => `${BLOB}/${file}#${format.SHADCN_LINT_ANCHOR}`;
  return [
    '# Benchmark',
    `Coding agents with and without onsystem. In the run of ${benchmark.date}, ${format.headlineText(benchmark)}. Every table is on [the benchmark page](/benchmark).`,
    `Each model wrote the same ${String(benchmark.tasks.length)} UI components in ${String(benchmark.repos.length)} open-source repositories (${list(benchmark.repos.map((r) => r.url.replace('https://github.com/', '')))}), once with no onsystem and once with each of its parts: the skill, the MCP server, the hook, and all three. A rule violation is an error from \`onsystem check\` that the run added to the repository, counted by onsystem ${benchmark.onsystem}, the release the benchmark ran: the tool under test scores the headline. \`tsc\` type-checks each file in its project's own setup, and a sample was labelled blind by an AI reviewer.`,
    '## Results {#results}',
    `Every arm, pooled over the ${String(benchmark.models.length)} models. Rates have 95% Wilson intervals; errors per run have 95% intervals from a bootstrap that resamples tasks.`,
    table(
      ['Arm', 'Runs', '`tsc` passes', 'onsystem-clean', 'onsystem errors per run'],
      benchmark.arms.map((arm) => {
        const row = format.row(benchmark, 'all models', arm);
        return [
          `\`${arm}\``,
          String(row.runs),
          rate(row.tscPass),
          rate(row.onsystemClean),
          mean(row.onsystemErrors),
        ];
      }),
    ),
    '## Independent scorer: @shadcn/lint {#independent-scorer}',
    `The same ${count(benchmark.runs)} runs, scored by a linter that is not part of onsystem: [@shadcn/lint](${format.SHADCN_LINT}) ${lint.version}, with all ${words(lint.rules.length)} of its rules, on the file each run created, at its path in the repository. No arm showed the agent its messages, and a run that created no file counts 0. It was added after the standard run, so it is not one of the outcomes fixed before any run. \`${lint.rerun}\` runs it again, as [bench/v2/README.md](${lintSection('bench/v2/README.md')}) describes.`,
    table(
      [
        'Arm',
        'Runs',
        'Files linted',
        'Findings per run',
        'Δ against `none`, paired',
        '`no-raw-colors` per run',
        '`no-restyle` per run',
      ],
      benchmark.arms.map((arm) => {
        const row = format.shadcnLintRow(benchmark, arm);
        const d = format.shadcnLintDelta(benchmark, arm);
        return [
          `\`${arm}\``,
          count(row.runs),
          count(row.linted),
          mean(row.findings),
          d
            ? `${format.signedPerRun(d.findings.value)} ${format.signedPerRunInterval(d.findings)}`
            : '—',
          perRun(row.byRule['no-raw-colors'] ?? 0),
          perRun(row.byRule['no-restyle'] ?? 0),
        ];
      }),
    ),
    `On colors it flags the same kind of error the MCP server and the hook show the agent, so \`no-raw-colors\` agrees with onsystem rather than confirming it. Most of what is left is \`no-restyle\`, a class that changes a design-system component's color, typography or spacing, which onsystem does not report. It is strict, and whether an override is wrong depends on the design system. What it does and does not measure, and where it reads less: [bench/v2/README.md](${lintSection('bench/v2/README.md')}). By model and by rule: [results.md](${lintSection(`${RESULTS}/results.md`)}).`,
    '## Blind labels {#labels}',
    `A stratified random sample of ${String(labels.files)} files (${String(perArm)} per arm) was labelled blind by an AI reviewer (${labels.labeller.model}), not by people. It saw the task, the design system and the file, not the model, the arm or onsystem's verdict, and counted invented APIs, hardcoded values, native elements and unnamed controls. ${familyOf} are from the same family as the labeller, so they may share its blind spots. With ${String(perArm)} files per arm, the intervals are wide. Who labelled, what it could see and the rules it applied are in ${labeller}.`,
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
    // Right after the table, so a search that finds the hook and all rows finds this with them.
    `These labels are too few to confirm the headline either way. Every violation the labeller counted in the hook and all arms is a Tailwind palette color in dub, where onsystem ${benchmark.onsystem} found no color tokens to check it against; [#107](${PR_107}), merged after the 0.6.0 release, makes onsystem read dub's tokens from its shared Tailwind config. Outside dub, the labeller counted violations only in files written without onsystem.`,
    `Per file, onsystem and the labeller both found a problem in ${String(labels.agreement.both)}, only onsystem in ${String(labels.agreement.onsystemOnly)}, only the labeller in ${String(labels.agreement.labellerOnly)} and neither in ${String(labels.agreement.neither)}. Of onsystem's ${String(labels.findings)} findings on these files, the labeller judged ${String(labels.precision.successes)} correct, ${String(wrong)} wrong and ${String(labels.precision.debatable)} debatable.`,
    '## Method {#method}',
    `${String(benchmark.models.length)} models from ${String(benchmark.providers.length)} providers (${list(benchmark.providers.map((p) => p.name))}), in ${String(tiers.length)} tiers: ${tiers.map((tier) => `${tier}, ${list(benchmark.models.filter((m) => m.tier === tier).map((m) => m.name))}`).join('; ')}. Every model runs in the same agent loop, with the same file tools and no shell, at the same nominal reasoning level. ${count(benchmark.runs)} runs: ${count(benchmark.statuses.done ?? 0)} finished${stopped.map(([status, n]) => `, ${count(n)} stopped at a limit (${status})`).join('')}; a run that stops at a limit counts, with what it wrote. API cost $${benchmark.cost.total.toFixed(2)}, under a cap of $${String(benchmark.cost.cap)}.`,
    `### The arms\n\n${benchmark.method.arms}`,
    `### Scoring\n\n${benchmark.method.scoring}`,
    `### Statistics\n\n${benchmark.method.statistics}`,
    '## Threats to validity {#threats}',
    [
      `- **The labels are an AI reviewer's.** The sample was labelled blind by an AI reviewer (${labels.labeller.model}), not by people. ${labeller} records what it could see and how it decided.`,
      `- **The labeller's family is under test.** ${familyOf} are from the same family as the labeller, so they may share blind spots.`,
      `- **onsystem is one of the scorers.** The headline counts the errors of onsystem ${benchmark.onsystem}, the release under test. \`tsc\`, @shadcn/lint and the blind labels are the independent checks: \`tsc\` does not see hardcoded values, @shadcn/lint's \`no-raw-colors\` flags the same kind of error the MCP server and the hook show the agent (see [Independent scorer](#independent-scorer)), and the labels cover ${String(labels.files)} files.`,
      '- **A chart token passes for a status color.** Two tasks ask for a small green status label in saas-starter and chatbot, whose themes have no success token. Every run of those tasks with all three parts used a `chart-*` token for the green, and no run without onsystem did; onsystem counts that as clean, although those tokens are meant for charts.',
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
