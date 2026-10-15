# Agent benchmark v2

Does onsystem make coding agents write UI that fits a project's design system, and which part does the work: the skill, the MCP server or the hook? v2 asks this across models from three providers, in five real repositories, and scores the output with tools other than onsystem as well.

**Results (2026-10-12, onsystem 0.5.0):** 1,200 runs, 6 models from 3 providers, 5 real repositories. With onsystem's skill, MCP server and hook together, design-system errors per run, as onsystem 0.5.0 counts them, fell from 0.85 to 0.00, with no measurable change in `tsc` pass rate (93% → 92%, Δ 0 [−4, +3]) and the same cost per run. The MCP server and the hook each do most of the work on their own; the gain is largest for small models. That count is onsystem's own, of the errors its MCP server and hook show the agent; [Threats to validity](#threats-to-validity) says what it cannot show: dub's colors in 0.5.0, chart tokens used for status colors, and a blind sample too small to confirm it. Full tables with confidence intervals: [results/standard/results.md](results/standard/results.md); per-run data in `results/standard/runs/` and `runs.csv`; transcripts on the [bench-v2-2026-10-12 release](https://github.com/dgesteves/onsystem/releases/tag/bench-v2-2026-10-12). A stratified 60-file sample was labelled blind by an independent AI reviewer ([LABELLER.md](results/standard/labels/LABELLER.md)).

## What changes from v1

[v1](../agents) was one repository, Claude only, 40 runs, and onsystem scored its own output. It showed a direction, not a result.

|              | v1 (2026-10-08)                                           | v2                                                                                                                                        |
| ------------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Agent        | Claude Code headless, with the user's own settings loaded | One neutral agent loop over each provider's API, nothing else loaded                                                                      |
| Models       | Claude Haiku 4.5, Claude Opus 5                           | Small and mid tiers from Anthropic, OpenAI and Google; frontier tier optional                                                             |
| Repositories | 1 (vercel/chatbot)                                        | 5 from `corpus/`, pinned, installed with scripts off                                                                                      |
| Tasks        | 10                                                        | 20 (4 per repository), fixed prompts                                                                                                      |
| Conditions   | base, plugin                                              | none, skill, mcp, hook, all                                                                                                               |
| Repeats      | 1                                                         | 1 to 3 per cell                                                                                                                           |
| Scoring      | `onsystem check`                                          | `tsc` in each project's own setup, `onsystem check`, blind labels on a stratified sample, and @shadcn/lint (added after the standard run) |
| Statistics   | counts                                                    | Wilson intervals for rates, cluster bootstrap for means and paired differences                                                            |

## Method

### The agent

Every model runs in the same loop (`lib/agent.mjs`): a short system prompt (`lib/prompt.ts`), five file tools (`lib/tools.ts`: list, read, search, write, edit), and the task. There is no shell, so no arm can run the project's code, and the v1 prompt already told agents not to run commands. The loop sends the whole conversation each request and keeps each model's own turns verbatim, which the APIs require for thinking blocks, reasoning items and thought signatures. It ends when the model answers without a tool call, after 40 requests, or after 15 minutes.

Each provider is called over its own HTTP API (`lib/providers.ts`): Anthropic Messages, OpenAI Responses (stateless, `store: false`, encrypted reasoning passed back), and Gemini `generateContent`. Plain `fetch` keeps the three adapters symmetric and adds no dependency. Every request sets the same nominal reasoning level, `medium`: Anthropic `output_config.effort`, OpenAI `reasoning.effort`, Gemini `thinkingLevel`. Sampling parameters are left at the providers' defaults (several of these models reject other values). Anthropic requests cache the system prompt and the conversation; OpenAI and Gemini cache implicitly. A refusal ends the run and is recorded; Anthropic's server-side fallback is not enabled, because it would switch models mid-run.

**Why not each vendor's CLI.** Claude Code, Codex CLI and Gemini CLI all have a headless mode, MCP, skills and a post-edit hook today. They are not comparable harnesses, though:

- Each brings its own system prompt, tools and context handling, so a difference between providers would mix the model with the client.
- onsystem ships its hook only for Claude Code (`plugins/onsystem/hooks/check-ui.mjs`). Its Agent Plugins package for other clients has none ([plugins/onsystem-agent](../../plugins/onsystem-agent/README.md)). Codex reports file edits to hooks as `apply_patch`, with the edit in `tool_input.command` rather than a file path, and Gemini CLI names them `write_file` and `replace`, so a "hook only" arm on those clients would need a hook that does not exist. Writing one for the benchmark would test something no user has.
- v1 started Claude Code with the machine's user-level settings, so other plugins, skills and MCP servers were loaded too. v2 must not repeat that.

A neutral loop gives every provider every arm, built from the same shipped files. The cost is realism: it measures the models and onsystem, not Claude Code, Codex or Gemini CLI as products. Sources, read on 2026-10-12: [Claude Code hooks](https://code.claude.com/docs/en/hooks), [plugins reference](https://code.claude.com/docs/en/plugins-reference), [headless](https://code.claude.com/docs/en/headless); [Codex hooks](https://learn.chatgpt.com/docs/hooks), [non-interactive mode](https://learn.chatgpt.com/docs/non-interactive-mode), [skills](https://learn.chatgpt.com/docs/build-skills); [Gemini CLI hooks](https://geminicli.com/docs/hooks/), [skills](https://geminicli.com/docs/cli/skills/), [headless](https://geminicli.com/docs/cli/headless/). Google is moving consumer users from Gemini CLI to Antigravity CLI ([announcement](https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/)), one more reason not to tie the result to a client.

### Arms

Each arm adds shipped onsystem files to the same loop, unchanged:

| Arm     | What the agent gets on top of the file tools                                                                                                                                                                                                                                                                           |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `none`  | Nothing. The prompt still asks it to use the project's components and tokens, as v1's did.                                                                                                                                                                                                                             |
| `skill` | The Claude Code plugin's `SKILL.md`, the way Agent Skills work: its name and description in the system prompt and a `load_skill` tool that returns the whole file. The skill names the MCP tools, which this arm does not have; its other instructions (tokens, variants, native elements, icon buttons) still apply.  |
| `mcp`   | The onsystem MCP server (this checkout's `dist/cli.js`), started over stdio in the run's copy of the repository. Its five tools, with their own descriptions and schemas, as `mcp__onsystem__<tool>`, and its instructions in the system prompt, as MCP clients do.                                                    |
| `hook`  | The plugin's hook script run after every write or edit, with the PostToolUse input Claude Code gives it. On exit 2 its stderr goes back to the model with the tool result; on exit 0 its `additionalContext` is added as a note. Its message points at `get_component` and `get_tokens`, which this arm does not have. |
| `all`   | All three: the Claude Code plugin's setup.                                                                                                                                                                                                                                                                             |

`skill` and `hook` each mention tools only the MCP arm has. That is how the files ship; the arms measure what each part does on its own, not a redesigned part.

### Models

Prices in USD per million tokens, standard tier, read from each provider's own pages on **2026-10-12** ([config/models.json](config/models.json)). `run` refuses to start once that date is 30 days old.

| Tier     | Model ID                 | Input | Cache read | Cache write | Output | Source                                                                                                                             |
| -------- | ------------------------ | ----: | ---------: | ----------: | -----: | ---------------------------------------------------------------------------------------------------------------------------------- |
| small    | `claude-haiku-5-5`       |  0.10 |       0.01 |       0.125 |   0.50 | [model page](https://platform.claude.com/docs/en/models/haiku-5-5/overview) (prompts over 100K tokens: 0.50 / 0.05 / 0.625 / 2.50) |
| small    | `gpt-6-luna`             |  0.10 |       0.01 |       0.125 |   0.50 | [pricing](https://developers.openai.com/api/docs/pricing)                                                                          |
| small    | `gemini-3.5-flash-lite`  |  0.30 |       0.03 |        none |   2.50 | [pricing](https://ai.google.dev/gemini-api/docs/pricing)                                                                           |
| mid      | `claude-sonnet-5-5`      |     2 |       0.10 |        2.50 |     10 | [model page](https://platform.claude.com/docs/en/models/sonnet-5-5/overview)                                                       |
| mid      | `gpt-6.1-sol`            |     2 |       0.10 |        2.50 |     10 | [pricing](https://developers.openai.com/api/docs/pricing)                                                                          |
| mid      | `gemini-3.8-flash`       |  0.75 |      0.075 |        none |   3.75 | [pricing](https://ai.google.dev/gemini-api/docs/pricing) (introductory until 2026-12-31, then double)                              |
| frontier | `claude-opus-5-5`        |     4 |       0.20 |           5 |     20 | [model page](https://platform.claude.com/docs/en/models/opus-5-5/overview)                                                         |
| frontier | `gpt-6-astra`            |    10 |          1 |       12.50 |     50 | [pricing](https://developers.openai.com/api/docs/pricing)                                                                          |
| frontier | `gemini-3.1-pro-preview` |     2 |       0.20 |        none |     12 | [pricing](https://ai.google.dev/gemini-api/docs/pricing) (preview; prompts over 200K: 4 / 0.40 / 18)                               |

"none": Google charges no premium for writing to its implicit cache; new tokens cost the input price. Thinking and reasoning tokens are billed as output by all three. The tiers pair models by price and by each provider's own description: small and mid are price-matched between Anthropic and OpenAI; Google's Flash models cost less, and its only Pro model is a preview. OpenAI describes `gpt-6.1-sol` as "near-Astra performance at a lower cost for complex coding" ([model page](https://developers.openai.com/api/docs/models/gpt-6.1-sol)); Google describes Gemini 3.8 Flash as its "most intelligent Flash model, engineered for long-horizon software engineering" ([models](https://ai.google.dev/gemini-api/docs/models)). Supported reasoning levels: [Gemini thinking](https://ai.google.dev/gemini-api/docs/generate-content/thinking); `gpt-6.1-sol` takes `low` to `max`.

### Repositories

Five repositories from [corpus/repos.json](../../corpus/repos.json), at the commits it pins, fetched sparse (sources, styles, manifests, docs) and installed once with `--frozen-lockfile --ignore-scripts` ([config/repos.json](config/repos.json)). They cover three shapes of design system: shadcn/ui in the app, a shadcn-based workspace package, and a custom workspace package.

| Repository                                                            | Commit    | App              | Design system                                                                        | TypeScript |
| --------------------------------------------------------------------- | --------- | ---------------- | ------------------------------------------------------------------------------------ | ---------- |
| [nextjs/saas-starter](https://github.com/nextjs/saas-starter)         | `6e33e58` | `.`              | shadcn/ui, 7 components, 40 color tokens                                             | 5.8.3      |
| [vercel/chatbot](https://github.com/vercel/chatbot)                   | `c2f8235` | `.`              | shadcn/ui, 23 components, 31 color tokens (v1's repository)                          | 5.8.2      |
| [shadcn-ui/ui](https://github.com/shadcn-ui/ui)                       | `0132174` | `apps/v4`        | the shadcn/ui registry, 68 components, 40 color tokens                               | 5.9.2      |
| [openstatusHQ/openstatus](https://github.com/openstatusHQ/openstatus) | `e36446d` | `apps/dashboard` | workspace package `@openstatus/ui`, 132 components, 51 color tokens                  | 7.0.2      |
| [dubinc/dub](https://github.com/dubinc/dub)                           | `70c96f9` | `apps/web`       | custom workspace package `@dub/ui`, 430 components and icons, 0.5.0: no color tokens | 5.4.4      |

Left out: midday (installs with bun), cal.com and twenty (yarn 4 monorepos; in twenty, none of onsystem's labelled findings is a true positive, see [corpus/labels.json](../../corpus/labels.json)), documenso (its UI package imports `@prisma/client` 39 times, and that client is generated by an install script, which `--ignore-scripts` skips), and the react-aria starter (outside its repository's workspaces and without a lockfile of its own, so its install is not reproducible). The five kept all install with pnpm from their lockfiles. In dub, onsystem 0.5.0 found no color tokens to compare with, so the color rules stayed quiet and dub tested components, props and variants only; see [Threats to validity](#threats-to-validity) for what has changed since.

### Tasks

Four tasks per repository ([config/tasks.json](config/tasks.json)), each a new component file a product team would write, and each naming something the design system has to answer: a status color ("a small green 'Connected' label"), a destructive action, an icon-only button, a dialog or modal, a form control. The chatbot tasks are four of v1's ten, word for word. Every prompt ends with v1's sentence: "Use this project's existing UI components and design tokens. Only create that file: do not modify other files, run commands or install packages." Matrices with fewer tasks per repository take them in file order.

### A run

1. Copy the prepared repository: sources only. Each `node_modules` folder is mirrored one level deep, with links to workspace packages kept relative (so they resolve to the run's own copy) and everything else linked to the prepared install.
2. Set up the arm: the skill listing, the MCP server, the hook.
3. Run the loop with the task prompt.
4. Score what changed against the prepared copy, copy the changed files to the results, delete the copy.

Runs go in a seeded random order, so arms, models and repositories interleave over time. A run that stops on an API error is recorded as such, left out of the tables and run again on resume; a run that ends at a limit (requests, time, refusal) counts, with what it wrote. After three errors in a row from one model, its remaining runs are not started (exit code 4), so a changed API or a retired model ID does not fail the whole matrix.

### Scoring

Four measures, three of them independent of onsystem. The first three were fixed before any run; @shadcn/lint was added after the standard run:

1. **`tsc` (independent).** Each changed TypeScript file is type-checked in its project's own setup: a temporary tsconfig extends the project's, lists only the changed files (plus the project's ambient `.d.ts` files), and runs with the repository's own TypeScript. Only diagnostics in the changed files count. Invented components, props and variant values are type errors when the design system is typed, which all five are; hardcoded colors and spacing are not. A run passes when its file exists and has no type error. dub's `@dub/ui` and `@dub/utils` export a build output that an install without scripts lacks, so their imports are mapped to their sources for `tsc`.
2. **`onsystem check` (the tool's own).** The changed UI files, against a baseline of the untouched repository, so only findings the run added count. A run is clean when its file exists and has no error.
3. **Blind labels (independent of onsystem).** A stratified random sample of files (2 per model and arm by default), blinded: the labeller, a person or an AI reviewer, recorded in `labels/LABELLER.md`, sees the task, the design system and the file, not the model, the arm or onsystem's verdict. They count invented APIs, hardcoded values, native elements and unnamed controls, and say whether they would merge it. Then, separately, they judge each onsystem finding on those files as correct, wrong or debatable. [LABELLING.md](LABELLING.md) is the guide.
4. **@shadcn/lint (independent, added after the standard run).** `score --with shadcn-lint` runs [@shadcn/lint](https://github.com/shadcn-ui/lint) on the file each run created, at its path in the prepared repository, so its six rules read that project's components, variants and Tailwind theme. It counts findings per run; no arm showed the agent its messages. Its own section, Independent scorer: @shadcn/lint, has the versions, the results and where it reads less.

`prepare` checks that the scorers can be trusted in each repository before anything runs: a correct use of the design system's `Button` must pass both `tsc` and onsystem, the same component with an invented variant (`variant="warning"`) must fail both, and two or three existing files must type-check. All five pass (`tsc`: 0 errors on the correct use, 1 on the invented one; onsystem: 0 and 1, `no-unknown-variant`).

Also recorded per run: whether it changed files other than its own, requests, tokens, cost, time, hook blocks, MCP calls and skill loads.

### Statistics

Outcomes, fixed before any run:

- **Primary, independent:** `tsc` pass rate per model and arm.
- **Primary, onsystem's own:** onsystem-clean rate per model and arm.
- **Composite:** accepted = file created, type-checks and onsystem-clean.
- **Blind labels:** would-merge rate, files without violations, violations per file, and the share of onsystem's findings the labeller judges correct.
- **Secondary:** onsystem errors per run, cost, requests, tokens, hook blocks, MCP calls, skill loads.

Rates get 95% [Wilson score intervals](https://en.wikipedia.org/wiki/Binomial_proportion_confidence_interval#Wilson_score_interval). Means and every difference between arms get 95% percentile intervals from a cluster bootstrap that resamples tasks (10,000 draws, seed 1): runs of the same task are not independent, since a hard task is hard in every arm. Each arm is compared with `none` on the same model, task and repeat. There are no p-values. The tables pool the models of each tier, and all models together. The headline is the comparison pooled over a tier's models for each arm (4 per tier and outcome); per-model comparisons (up to 36) are reported too, and about 1 in 20 of those intervals would exclude zero by chance alone. The tables are computed by `lib/stats.ts`, which `test/bench-v2.test.ts` covers.

### Threats to validity

- **Not a product test.** The loop is not Claude Code, Codex or Gemini CLI. Real clients add their own prompts and tools, which can change how much onsystem helps.
- **One reasoning level.** `medium` means different things to different providers; other levels may change the picture.
- **The prompt asks for the design system.** Every arm is told to use the project's components and tokens. A prompt that does not ask would likely show larger effects; this one is the conservative case, and the same as v1.
- **The scorers' blind spots.** `tsc` sees invented APIs, not hardcoded values. onsystem sees both but is the tool under test; its precision on the corpus is in `corpus/labels.json`. @shadcn/lint, added after the standard run, sees hardcoded values and restyled components, not invented APIs, and reads less in some repositories ([its section](#independent-scorer-shadcnlint) says where). No tool judges whether the UI does what was asked; only the blind labels do, and only on a sample.
- **onsystem counts what it feeds back.** The MCP server's `check_ui` and the hook give the agent the same errors that `onsystem check` counts afterwards, so the arms with either end close to zero partly by construction. No run added a suppression comment or changed a file other than its own.
- **dub, as of onsystem 0.5.0.** 0.5.0 found no color tokens in dub, so the color rules stayed quiet there in every arm. dub keeps its tokens in a shared Tailwind config package, which onsystem reads since [#107](https://github.com/dgesteves/onsystem/pull/107), merged after 0.6.0, and re-scoring these outputs with it raises dub's count in every arm. A rerun on the released version is planned.
- **Chart tokens for status colors.** `settings-card` (chatbot) and `plan-summary-card` (saas-starter) ask for a small green status label in a design system with no success token. With onsystem, agents often used a `chart-*` token for the green (24 of 24 runs with all three, 0 of 24 without onsystem), which onsystem counts as clean. Those two tasks hold 91 of the 203 errors without onsystem. `release-badges` (shadcn-website) asks for status labels in green, blue and amber, and its design system has no success token either; fewer runs used a `chart-*` token there (2 of 12 with all three, 5 of 12 with the MCP server alone, 0 of 12 without onsystem).
- **A small blind sample.** 12 files per arm are too few to confirm or contradict onsystem's count. Every violation the labeller found with the hook or with all three is a palette color in a dub file where dub has a token, which 0.5.0 did not read.
- **Repositories and tasks.** Five open-source React and Tailwind projects and twenty single-file tasks. Editing existing screens, other frameworks and multi-file work are not covered. The repositories and their tasks may be in some models' training data.
- **The skill and hook arms mention the MCP tools** they do not include, as shipped.
- **Prices and models change.** The cost table is for 2026-10-12. Gemini 3.8 Flash's price doubles on 2027-01-01, and Gemini 3.1 Pro is a preview.
- **Run-to-run variance** is measured only where a matrix has repeats.

## Independent scorer: @shadcn/lint

`tsc` sees invented APIs but not hardcoded values, and onsystem counts the same errors its MCP server and hook show the agent. To score the same files with a linter that is not onsystem, `score` runs [@shadcn/lint](https://github.com/shadcn-ui/lint) 0.2.1, with ESLint 9.39.5 and @typescript-eslint/parser 8.71.2, on the file each run created, at its path in the prepared repository, so its rules read that project's components, variants and Tailwind theme. All six rules are on, each an error at its defaults. No arm showed the agent its messages. It was added after the standard run, so it is not one of the outcomes fixed before any run.

```sh
node bench/v2/run.mjs prepare                    # once, if the repositories are not prepared yet
node bench/v2/run.mjs score --with shadcn-lint --out bench/v2/results/standard
```

`score` installs the three packages into the work folder with scripts off, at the versions [config/shadcn-lint.json](config/shadcn-lint.json) pins, writes each run's findings and messages to `shadcn-lint.json`, and runs `report`, which adds the tables to [results.md](results/standard/results.md#independent-scorer-shadcnlint). It calls no model; a rerun on the same prepared repositories writes the same file.

**On the standard run (onsystem 0.5.0):** @shadcn/lint findings per run, all models, went from 4.97 [3.30, 6.69] without onsystem to 2.64 [1.76, 3.58] with all three parts, a paired difference of −2.33 [−3.28, −1.38]. With the skill alone 3.47, the MCP server 2.86, the hook 4.06. Read it with these:

- **On colors it agrees with onsystem rather than confirming it.** `no-raw-colors` (1.84 → 0.60 per run) flags palette classes, the same kind of error the MCP server and the hook show the agent.
- **Most of what is left is `no-restyle`** (2.98 → 1.97 per run): a class that changes a design-system component's color, typography or spacing, which onsystem does not report. It is strict, and whether an override is wrong depends on the design system.
- **The hook alone lowers colors, not restyles:** −0.90 [−1.80, −0.06] in all, −0.88 [−1.52, −0.32] in `no-raw-colors`, +0.03 [−0.50, +0.60] in `no-restyle`. The MCP server alone: −2.10 [−3.09, −1.17], with −0.87 [−1.65, −0.29] in `no-restyle`.
- **Chart tokens.** Neither tool counts a `chart-*` token used for a status color as wrong. `no-restyle` reports one only on a design-system component, as a restyle.
- **Classes looked up at runtime.** Palette classes kept in an object or a variable and passed to `className` can get one `require-static-classes` finding, not a `no-raw-colors` finding per color, and onsystem does not report them either. In shadcn-website, 41 of the 47 output files with palette classes went this way: each got one `require-static-classes` finding, no `no-raw-colors` and no onsystem color error.
- **Where it reads less.** @shadcn/lint finds components through `components.json`. openstatus's points at the app's own folder, not `@openstatus/ui`, so `no-restyle` reports nothing there. dub has no `components.json` and uses Tailwind v3, so only `no-raw-colors` and `no-arbitrary-values` report there. shadcn-website's theme imports `shadcn/tailwind.css`, which the install without scripts lacks, so `no-unknown-classes` uses @shadcn/lint's bundled grammar there. `score` prints these warnings.
- **It loads code from the installs.** To know which classes exist, @shadcn/lint loads the Tailwind each repository installed, and the plugins its CSS names, in a child process without the API keys. `tsc` already runs from the same installs.

## Sizes and cost

`node bench/v2/run.mjs plan` prints this table from the configuration. Nothing is called.

| Matrix         |      Runs | Design                                                           | Expected | Pessimistic | Anthropic / OpenAI / Google (expected) |
| -------------- | --------: | ---------------------------------------------------------------- | -------: | ----------: | -------------------------------------- |
| `canary`       |        12 | small and mid models, `none` and `all`, 1 chatbot task           |    $0.79 |       $3.60 | $0.32 / $0.32 / $0.15                  |
| `small`        |       900 | small models, 5 arms, 20 tasks, 3 repeats                        |    $8.28 |         $34 | $1.54 / $1.54 / $5.19                  |
| **`standard`** | **1,200** | `small` plus mid models, 5 arms, 20 tasks, 1 repeat              |  **$45** |    **$214** | $17 / $17 / $11                        |
| `large`        |     2,100 | small and mid models with 3 repeats, plus frontier models with 1 |     $256 |      $1,178 | $79 / $136 / $41                       |

**How the estimate is made.** Per run, the number of requests, the context a run adds by reading and writing, and the output tokens come from v1's 40 transcripts ([config/usage-model.json](config/usage-model.json)): Claude Haiku 4.5's runs for small models, Claude Opus 5's for mid and frontier models, v1's base condition for `none` and the larger of its two conditions for the other arms. v1's own fixed prompt (Claude Code's, about 34,000 tokens per request) is replaced by this harness's (about 700 tokens, computed from its text; the skill adds about 170, plus 570 once loaded; the MCP server about 1,570). _Expected_ assumes each request reads the earlier context from the prompt cache and writes only what is new. _Pessimistic_ assumes no cache hits at all, 50% more requests and context, and 50% more output. As a check, the same formula given v1's setup gives $0.17 per Haiku 4.5 run where v1 measured $0.13: it errs high. Token counts use 4 characters per token, and other providers' tokenizers differ by tens of percent. The canary measures real cost per run, and `plan --usage-from <canary output>` re-estimates from it.

**What each size can conclude.** Half-widths of the 95% Wilson interval for one cell (one model, one arm): ±17 to ±20 points with 20 runs, ±10 to ±12 with 60, ±6 to ±7 with 180 (for rates between 80% and 50%). For differences between an arm and `none`, a simulation with this harness's own interval code (20 tasks whose difficulty varies a lot, as v1's did; the arm removes a share of each task's failures; 300 simulated benchmarks per point) gives the smallest effect found 80% of the time:

| Comparison                                | Baseline 60% pass                    | Baseline 80% pass        |
| ----------------------------------------- | ------------------------------------ | ------------------------ |
| small models pooled (`small`, `standard`) | removes 40% of failures (+16 points) | removes 50% (+10 points) |
| one small model (`small`, `standard`)     | 60% (+24 points)                     | 80% (+16 points)         |
| mid models pooled (`standard`)            | 60% (+24 points)                     | 80% (+16 points)         |
| one mid model (`standard`)                | 90% (+36 points)                     | not found reliably       |
| mid models pooled (`large`)               | 40% (+16 points)                     | 50% (+10 points)         |

- **`small`** answers, for small models and per provider, whether each part helps and how much, with intervals near ±10 points per cell. It says nothing about mid or frontier models.
- **`standard`** adds the mid tier at one run per cell: enough to see a large average effect across mid models (v1's plugin removed every failure on both models it ran), not enough to rank arms within one mid model or to see a small effect. No frontier models.
- **`large`** brings the mid tier to the small tier's precision and adds one run of each frontier model, which supports pooled frontier comparisons only for large effects.

**Recommendation:** run `canary` first ($0.79 expected, $3.60 pessimistic) to check every adapter against the live APIs and measure real cost; then `standard` with `--max-cost 60`. If the canary's costs are near the pessimistic estimate, run `small` instead: $34 even at its pessimistic estimate.

The cap is enforced while running: the harness adds up each request's cost from the usage the API returns and the prices above, and starts no request once the total passes `--max-cost`. Requests already in flight finish, so the total can end above the cap by at most one request per worker. Runs go in random order, so a run stopped by the cap is a random part of the matrix, and rerunning the same command with a higher cap continues it. `run` also refuses to start when the expected cost is over the cap, unless `--allow-partial`.

## Running it

Requirements: macOS or Linux, Node.js 22.18 or later (the harness's TypeScript runs through Node's type stripping; 24 is what CI uses), pnpm 10 or later and git on the path, about 8 GB of disk for the prepared repositories, and `pnpm build` in this checkout (the MCP server, the hook and the scoring all use `dist/cli.js`).

```sh
pnpm install && pnpm build
node bench/v2/run.mjs plan                       # matrices, runs and cost; no network, no key
node bench/v2/run.mjs prepare                    # fetch, install (scripts off), baseline, scorer controls
node bench/v2/run.mjs run --matrix mock --out /tmp/bench-mock   # offline, scripted model, no key
```

The work folder (`$TMPDIR/onsystem-bench-v2`, or `--work`, or `BENCH_WORK_DIR`) must sit outside any project, since onsystem looks upwards for `node_modules` and workspace roots.

Once the spend is approved, with `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` and `GEMINI_API_KEY` exported in the shell:

```sh
node bench/v2/run.mjs run --matrix canary   --out bench/v2/results/canary   --max-cost 5
node bench/v2/run.mjs plan --matrix standard --usage-from bench/v2/results/canary
node bench/v2/run.mjs run --matrix standard --out bench/v2/results/standard --max-cost 60 --concurrency 8
node bench/v2/run.mjs labels --out bench/v2/results/standard   # then label, see LABELLING.md
node bench/v2/run.mjs report --out bench/v2/results/standard   # rebuilds the tables, labels included
```

Keys are read from those environment variables only, by name, and never printed or written; a missing one stops the run before anything starts, naming the variable. Child processes (the MCP server, the hook, `tsc`, installs) never receive them. A matrix needs only its providers' keys; `mock` needs none.

`run` resumes: finished runs are skipped, and spending so far (`ledger.jsonl`) counts against the cap. v1's runs took 22 seconds to 6 minutes each; `--concurrency` sets how many run at once.

### Output

```
<out>/
  results.md, results.json, runs.csv   tables and one row per run
  notes.md                             caveats kept next to the run; report puts them above the tables
  run-info.json                        matrix, seed, onsystem and Node versions, prepared repositories
  runs/<run>/result.json               scores, findings, tsc diagnostics, usage, cost
  runs/<run>/files/...                 every file the run created or changed
  transcripts/<run>.jsonl              every request's usage and every tool call and result
  ledger.jsonl                         cost of every attempt
  labels/                              the blinded sample, once `labels` has run
  shadcn-lint.json                     @shadcn/lint's findings per run, once `score --with shadcn-lint` has run
```

Commit everything but `transcripts/` (whole tool outputs, too large for the repository), and attach that folder to a release instead.

## Verified for this pull request

- `plan` for every matrix, as in the table above.
- `prepare` on all five repositories: fetch at the pinned commit, install with scripts off, baseline, and the scorer controls described under Scoring, all passing.
- `run --matrix mock`: 50 runs (5 repositories × 2 tasks × 5 arms) with the scripted mock model (`lib/mock.ts`) through the whole pipeline: workspace copies, the real MCP server and hook, `tsc`, `onsystem check`, the tables with intervals, `labels` and `report` with filled sheets. The mock is not a model of any agent: it writes a hardcoded color or an invented variant at random, less often when it has read the skill or the MCP tools, and fixes what the hook or `check_ui` reports. Its numbers only show that the stages are wired up.
- The spend cap with the mock's made-up prices (stops at the cap, exit code 3, resumes), and the missing-key and missing-cap refusals, with the key variables removed from the environment.
- `test/bench-v2.test.ts`: the statistics, the scorers, the plan and cost model (including the v1 check above), the three API adapters against recorded response shapes, the file tools, the mock and the loop.

The API adapters have not been called against the live APIs. The canary is the first run that does.
