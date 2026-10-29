/**
 * The FAQ: questions and answers in inline Markdown, rendered on /docs/faq, served as Markdown,
 * included in llms-full.txt and indexed for Ask. scripts/generate.mjs loads this file as it is, so
 * it imports nothing; the corpus numbers come in from generated/corpus.json.
 */

interface FaqRate {
  value: number;
  low: number;
  high: number;
}

/** What the FAQ quotes from generated/corpus.json (`corpus` in lib/data.ts). */
export interface FaqCorpus {
  repos: number;
  runs: number;
  findings: number;
  sample: {
    draw: string;
    labeller: string;
    n: number;
    truePositives: number;
    debatable: number;
    falsePositives: number;
    rate: FaqRate;
    weightedRate: number;
    top: { rule: string; falsePositives: number; sampled: number };
    strict: { falsePositives: number; rate: FaqRate };
  };
}

const pct = (x: number) => `${x.toFixed(1)}%`;

export const faqEntries = (corpus: FaqCorpus): [question: string, answer: string][] => [
  [
    'Does my code leave my machine?',
    'No. The hook, the CLI and the server run where you run them: they read your files with the TypeScript compiler and apply the rules, with no model calls, no API key and no network requests. Your agent sends its context to its own model, as it does with any tool. The [playground](/playground) is the one exception: it sends what you type to this site, which checks it and does not store it.',
  ],
  [
    'Is there a model behind it?',
    'No. The agent is already the model; what it lacks is ground truth. Everything here is deterministic static analysis, which checks a file in milliseconds once it has read the design system ([measured](/docs/how-it-works#performance-and-footprint)) and can be tested rule by rule. The trade-off: it cannot judge intent, such as whether a `Dialog` was the right call. That stays with the agent and the reviewer.',
  ],
  [
    'Does it work with agents other than Claude Code?',
    'Yes. Any MCP client gets the tools, including `check_ui`, which the agent runs on its own output, and `onsystem check` in CI gates the pull request whichever agent wrote it. The hook that checks each edit as it happens runs in Claude Code and Codex CLI, which installs the same plugin and runs its hook once you trust it in `/hooks`. [Set up your agent](/docs/clients) has a config for each client.',
  ],
  [
    'How often is it wrong?',
    // The blind sample's rate while it can give one: test/claims.test.ts checks, as for the home page.
    `It is measured: every pull request that touches the rules runs them on ${String(corpus.repos)} public repositories pinned by commit (${String(corpus.runs)} runs, ${corpus.findings.toLocaleString('en-US')} distinct findings), without their dependencies installed (the two MUI apps get MUI). A seeded random sample of ${String(corpus.sample.n)} of those findings, stratified by rule, was labelled from the code alone: blind labels by an AI reviewer (${corpus.sample.labeller}), not by a person. ${String(corpus.sample.truePositives)} are right, ${String(corpus.sample.debatable)} debatable and ${String(corpus.sample.falsePositives)} false positives: ${pct(corpus.sample.rate.value)} (95% Wilson interval ${corpus.sample.rate.low.toFixed(1)}-${pct(corpus.sample.rate.high)}), about the same when weighted by each rule's share of all findings (${pct(corpus.sample.weightedRate)}). Most come from \`${corpus.sample.top.rule}\` (${String(corpus.sample.top.falsePositives)} of ${String(corpus.sample.top.sampled)} sampled). Counting values a project's own design system already uses as debatable, ${String(corpus.sample.strict.falsePositives)} of ${String(corpus.sample.n)} are false positives (${pct(corpus.sample.strict.rate.value)}, ${corpus.sample.strict.rate.low.toFixed(1)}-${pct(corpus.sample.strict.rate.high)}). The [sample](https://github.com/dgesteves/onsystem/tree/main/corpus/${corpus.sample.draw}) has each label with its reason. When it flags something that is fine, [suppress it](/rules#suppressing-findings) with a comment, turn the rule down in the [config](/rules#configure), and please open an issue with the snippet and the output of \`inspect\`: those are the reports I most want.`,
  ],
  [
    'How is it different from @shadcn/lint?',
    '@shadcn/lint checks the Tailwind classes written against a component and the theme (restyling a component, raw colors, arbitrary and unknown classes), in React, Svelte and Vue, on Tailwind v4. onsystem checks that the components, props and variant values exist, that native elements the design system wraps are not used, and that icon buttons have a name, on Tailwind v3 or v4, and gives the agent the design system before it writes. They overlap on raw colors and arbitrary values; run both.',
  ],
  [
    'Why not Storybook MCP?',
    'It is a good fit if you run Storybook: it serves stories and a component manifest from a running instance, and can run component tests. onsystem reads the source, so it works in projects without Storybook, in a hook, and in CI.',
  ],
  [
    'Why not describe the design system in CLAUDE.md or AGENTS.md?',
    'A static list goes stale, and agents still guess prop values and colors. Here the agent is checked on what it actually wrote. One line in `CLAUDE.md`, `AGENTS.md` or `.cursor/rules` still helps clients that ignore the server\'s instructions: _"Before writing UI, use the onsystem tools. Run check_ui on every file you change and fix all errors."_',
  ],
  [
    'My components are not in components/ui. Do I need a config?',
    'Not if the app has a shadcn/ui `components.json`, imports a workspace package named like a design system (`@acme/ui`), is the design-system package itself, or keeps components that wrap React Aria, Radix or another primitives library in a flat `src/`, `src/components/`, `components/` or `app/components/`: [zero config](/docs/configuration#zero-config) finds those. Otherwise a config file with a `components` glob is enough. `npx -y onsystem inspect` prints what was found, and [troubleshooting](/docs/troubleshooting) covers what to do when it finds nothing.',
  ],
  [
    "Will check fail on my design system's own components?",
    'No. `check` skips the files `components` matches: they implement the scale and the primitives the rules enforce. `--include-design-system` lints them too.',
  ],
  [
    'Is the Claude Code plugin safe to install everywhere?',
    'Yes. The hook stays quiet in projects without a design system, only reports on what Claude just changed, honours a baseline, and never blocks an edit because it could not run. Code installed from other shadcn registries is different: the hook checks it as your own code until you list its folder in `components`, and then leaves it alone, as it does `components/ui` ([Code from shadcn registries](/docs/configuration#code-from-shadcn-registries)).',
  ],
  [
    'Can I add our own rules?',
    "Not to onsystem itself. Its rules are a fixed set: the config sets each one to `error`, `warn` or `off` and rejects a rule id it does not know, and the hook, `check_ui`, `onsystem check` and the GitHub Action run only these. Two things cover most requests. A native element your design system wraps is already a finding: with a `Link` component, a raw `<a>` is reported by `prefer-design-system-component`, and the config's `elements` maps an element to the component that replaces it. For a rule only your team needs, write an ESLint rule: it runs next to onsystem's [ESLint plugin](/docs/eslint) in the editor and in CI, though not in the hook or `check_ui`. A rule most design systems would want is welcome as a pull request: [Adding a lint rule](https://github.com/dgesteves/onsystem/blob/main/CONTRIBUTING.md#adding-a-lint-rule) lists the steps.",
  ],
  [
    'Does it work with Vue, Svelte or Angular?',
    'Not yet: React only (`.tsx` and `.jsx`). The other [limits](/docs/how-it-works#limits) are listed with how it works.',
  ],
  [
    'What does it need to run?',
    'Node.js 20.19 or later (22.18 or later for a TypeScript config file). On native Windows, wrap the command as `cmd /c npx ...`.',
  ],
];

/** The FAQ as one Markdown document, a `##` heading per question. */
export function faqMarkdown(corpus: FaqCorpus): string {
  return faqEntries(corpus)
    .map(([question, answer]) => `## ${question}\n\n${answer}`)
    .join('\n\n');
}
