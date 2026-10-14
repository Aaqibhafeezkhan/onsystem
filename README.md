# onsystem

**Keeps coding agents on your design system:** it knows your real components, props, variants and tokens, catches the moment an agent invents one and has it fix it, and the same check gates your PRs. Local, zero config, works alongside [@shadcn/lint](https://github.com/shadcn-ui/lint).

Built for design-system and platform teams with a React design-system package; a shadcn/ui app is the zero-config demo. Formerly `@dgesteves/design-system-mcp` ([what changed](https://onsystem.vercel.app/docs/migrating)).

[![CI](https://img.shields.io/github/actions/workflow/status/dgesteves/onsystem/ci.yml?branch=main&style=flat-square&label=CI&labelColor=0d0f12)](https://github.com/dgesteves/onsystem/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/onsystem?style=flat-square&labelColor=0d0f12&color=0e7490)](https://www.npmjs.com/package/onsystem)
[![Downloads](https://img.shields.io/npm/dw/onsystem?style=flat-square&labelColor=0d0f12&color=0e7490)](https://www.npmjs.com/package/onsystem)
[![MCP Registry](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fregistry.modelcontextprotocol.io%2Fv0%2Fservers%3Fsearch%3Dio.github.dgesteves%2Fonsystem%26version%3Dlatest&query=%24.servers%5B0%5D.server.version&prefix=v&label=MCP%20Registry&style=flat-square&labelColor=0d0f12&color=0e7490&logo=modelcontextprotocol&logoColor=white)](https://registry.modelcontextprotocol.io/?q=io.github.dgesteves%2Fonsystem)
[![Cursor Directory](https://img.shields.io/badge/Cursor_Directory-Listed-0d0f12?style=flat-square&logo=cursor&logoColor=white)](https://cursor.directory/plugins/design-system-mcp)
[![License: MIT](https://img.shields.io/github/license/dgesteves/onsystem?style=flat-square&labelColor=0d0f12&color=0e7490)](LICENSE)

[![Install in Cursor](https://img.shields.io/badge/Cursor-Install_server-0d0f12?style=flat-square&logo=cursor&logoColor=white)](https://cursor.com/en/install-mcp?name=onsystem&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIm9uc3lzdGVtIiwiLS1yb290IiwiJHt3b3Jrc3BhY2VGb2xkZXJ9Il19)
[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install_server-007ACC?style=flat-square)](https://insiders.vscode.dev/redirect/mcp/install?name=onsystem&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22onsystem%22%2C%22--root%22%2C%22%24%7BworkspaceFolder%7D%22%5D%7D)
[![Claude Code plugin](https://img.shields.io/badge/Claude_Code-Install_plugin-b4532a?style=flat-square&logo=claude&logoColor=white)](https://onsystem.vercel.app/docs/plugin)
[![GitHub Action](https://img.shields.io/badge/GitHub_Action-Marketplace-0d0f12?style=flat-square&logo=githubactions&logoColor=white)](https://github.com/marketplace/actions/onsystem-design-system-check)

**Also works with**
[![Codex CLI](https://img.shields.io/badge/Codex_CLI-0d0f12?style=flat-square)](https://onsystem.vercel.app/docs/clients#codex-cli)
[![Gemini CLI](https://img.shields.io/badge/Gemini_CLI-0d0f12?style=flat-square&logo=googlegemini&logoColor=white)](https://onsystem.vercel.app/docs/clients#gemini-cli)
[![Grok Build](https://img.shields.io/badge/Grok_Build-0d0f12?style=flat-square)](https://onsystem.vercel.app/docs/clients#grok-build)
[![GitHub Copilot CLI](https://img.shields.io/badge/GitHub_Copilot_CLI-0d0f12?style=flat-square&logo=githubcopilot&logoColor=white)](https://onsystem.vercel.app/docs/clients#github-copilot-cli)
[![Claude Desktop](https://img.shields.io/badge/Claude_Desktop-0d0f12?style=flat-square&logo=claude&logoColor=white)](https://onsystem.vercel.app/docs/clients#claude-desktop)
[![Windsurf](https://img.shields.io/badge/Windsurf-0d0f12?style=flat-square&logo=windsurf&logoColor=white)](https://onsystem.vercel.app/docs/clients#windsurf-devin-desktop)
[![JetBrains](https://img.shields.io/badge/JetBrains-0d0f12?style=flat-square&logo=jetbrains&logoColor=white)](https://onsystem.vercel.app/docs/clients#jetbrains-ides-ai-assistant-and-junie)
[![Zed](https://img.shields.io/badge/Zed-0d0f12?style=flat-square&logo=zedindustries&logoColor=white)](https://onsystem.vercel.app/docs/clients#zed)

**Website and docs:** [onsystem.vercel.app](https://onsystem.vercel.app), with a [playground](https://onsystem.vercel.app/playground) that checks your own code.

<!-- npm-readme:video -->

https://github.com/user-attachments/assets/900cc1fa-387c-4e76-a524-a818521dd1a0

<sub>On the <a href="https://onsystem.vercel.app">website</a>, an agent drafts a settings card, <code>check_ui</code> finds 11 problems with a fix each, and the agent applies them. Then a real Claude Code session with the plugin: Claude looks the components up before writing, and <code>check_ui</code> passes. Last, the benchmark.</sub>

<!-- npm-readme:image
<p align="center">
  <a href="https://onsystem.vercel.app"><img src=".github/assets/demo.webp" width="100%" alt="On the website, an agent drafts a settings card, check_ui finds 11 problems with a fix each and the agent applies them. Then a real Claude Code session with the plugin, where Claude looks the components up before writing and check_ui passes. Last, the benchmark: clean components go from 6 to 10 out of 10 with Claude Haiku 4.5 and from 8 to 10 with Claude Opus 5."></a>
</p>

<sub>On the <a href="https://onsystem.vercel.app">website</a>, an agent drafts a settings card, <code>check_ui</code> finds 11 problems with a fix each, and the agent applies them. Then a real Claude Code session with the plugin: Claude looks the components up before writing, and <code>check_ui</code> passes. Last, the benchmark.</sub>
-->

## The problem

Coding agents write UI from their training data, not from your design system. Ask for a settings card and you get `bg-[#ef4444]`, `p-[13px]`, a native `<button>`, `variant="danger"` on a `Button` that only has `destructive`, and `<Card.Header>` where the system exports `CardHeader`. On the demo draft above, `tsc` reports 3 of the 11 problems, and review catches the rest when someone has the time. Describing the design system to the agent helps; what holds is checking what it actually wrote, at the edit and at the pull request.

## What it checks

onsystem reads your components, `cva` and `tv` variants, parts and tokens from source with the TypeScript compiler, and checks `.tsx` and `.jsx` against them. Every finding has a rule id, a location and the fix. Tokens come from your stylesheets, [DTCG 2025.10 files or a DESIGN.md](https://onsystem.vercel.app/docs/tokens), and `onsystem export` writes them out as either.

| Rule                             | Default | Catches                                                                         |
| -------------------------------- | ------- | ------------------------------------------------------------------------------- |
| `no-unknown-component`           | error   | Components and parts that don't exist (`<Card.Header>`, typos)                  |
| `no-unknown-prop`                | error   | Props a component doesn't take (`tone`, `isDisabled`)                           |
| `no-unknown-variant`             | error   | Values outside a variant (`variant="danger"`)                                   |
| `prefer-design-system-component` | error   | Native elements the design system has a component for (`<button>` → `<Button>`) |
| `no-hardcoded-color`             | error   | Hex, rgb, hsl, oklch and Tailwind palette colors (`bg-gray-100` → `bg-muted`)   |
| `icon-button-accessible-name`    | error   | Icon-only buttons without an accessible name                                    |
| `no-hardcoded-spacing`           | warn    | Arbitrary padding, margin and gap (`p-[13px]` → `p-3`)                          |
| `no-hardcoded-radius`            | warn    | Arbitrary radius (`rounded-[7px]` → `rounded-sm`)                               |

**How often it is wrong.** The [corpus](corpus) job runs `check` on 12 public repositories pinned by commit (Documenso, Dub, Cal.com, midday, Flowise and others, the four monorepos also from their root, and Dub's app also with a config and with `@dub/ui` set up by `init`: 24 runs, 14,541 distinct findings) and compares the findings with labels made by an AI reviewer. Its random sample does not give a false-positive rate for all findings: the runs and rules it has labels for hold 28.0% of them, and 27 of its 30 false positives were fixed, so what is left of it under-counts them. The rate will come from a fresh seeded sample, published here with its confidence interval and who labelled it. Shipped code rarely invents components, props or variants: those three rules have 56 findings in the corpus, 55 of them in Flowise, an MUI app that passes props and values MUI's components do not take, and the 10 still in the sample are all right. The [rules reference](https://onsystem.vercel.app/rules) shows each rule on an example and how to [suppress a finding](https://onsystem.vercel.app/rules#suppressing-findings).

## Quickstart

Run it from the app's folder or from the monorepo root, with Node.js 20.19 or later:

```sh
npx -y onsystem inspect   # what it found; --explain says why
npx -y onsystem check .   # the same check the agent and CI run
npx -y onsystem init      # write the config, and offer a baseline
```

At a [monorepo root](https://onsystem.vercel.app/docs/configuration#monorepo-roots), `inspect` lists every app and design-system package, and `check` checks each file by its own project's design system. In a [design-system package](https://onsystem.vercel.app/docs/design-system-packages), `init` sets it up for every app that depends on it, workspace or npm, with no config in the apps.

In a new create-next-app, the template page's hardcoded colors already make the first `check .` fail; `init` offers to record them as a baseline, so only new findings fail.

**Claude Code.** The plugin brings the hook, the MCP server and a skill:

```text
/plugin marketplace add dgesteves/onsystem
/plugin install onsystem@dgesteves
```

After each Write or Edit of a `.tsx` or `.jsx` file, the hook runs `onsystem check` on it. Errors go back to Claude as a blocking error with the fix, so Claude corrects the file before it moves on; warnings go as a note. It stays quiet in projects without a design system. [What it runs and touches](https://onsystem.vercel.app/docs/plugin).

**Cursor or VS Code.** [![Install in Cursor](https://img.shields.io/badge/Cursor-Install_server-0d0f12?style=flat-square&logo=cursor&logoColor=white)](https://cursor.com/en/install-mcp?name=onsystem&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIm9uc3lzdGVtIiwiLS1yb290IiwiJHt3b3Jrc3BhY2VGb2xkZXJ9Il19) [![Install in VS Code](https://img.shields.io/badge/VS_Code-Install_server-007ACC?style=flat-square)](https://insiders.vscode.dev/redirect/mcp/install?name=onsystem&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22onsystem%22%2C%22--root%22%2C%22%24%7BworkspaceFolder%7D%22%5D%7D), or commit the [config](https://onsystem.vercel.app/docs/clients#cursor-and-vs-code). The agent gets the tools and runs `check_ui` on what it writes.

**Other agents.** `npx skills add dgesteves/onsystem` adds the skill to any agent with Agent Skills, and there are [plugins for Codex, GitHub Copilot CLI, VS Code and Cursor](https://onsystem.vercel.app/docs/clients#plugins-for-other-agents).

**Any MCP client.** Run `npx -y onsystem` as a stdio server. There are [configs for Claude Desktop, Codex CLI, GitHub Copilot CLI, Windsurf, JetBrains IDEs, Zed, Gemini CLI and Grok Build](https://onsystem.vercel.app/docs/clients#other-clients).

**CI.** Install it as a dev dependency, accept the findings the codebase already has once, and fail pull requests only on new ones:

```sh
npm install --save-dev onsystem
npx onsystem check . --update-baseline   # writes onsystem.baseline.json: commit it
```

```yaml
- run: npx onsystem check . --format github --require-design-system
```

Findings show up as annotations on the pull request, and `--require-design-system` fails the job when the design system is no longer found. [CI and baselines](https://onsystem.vercel.app/docs/ci) has the whole workflow. The GitHub Action, `uses: dgesteves/onsystem@v0`, annotates only the lines a pull request changed: [make it a required check on agent pull requests](https://onsystem.vercel.app/docs/required-check).

**ESLint.** The same rules for ESLint 9 and 10: add `onsystem.configs.recommended` from `onsystem/eslint` to `eslint.config.mjs` ([ESLint plugin](https://onsystem.vercel.app/docs/eslint), with @shadcn/lint).

## Works with @shadcn/lint

[@shadcn/lint](https://github.com/shadcn-ui/lint) checks the Tailwind classes written against a component and the theme (restyling, raw colors, arbitrary and unknown classes) as ESLint or Oxlint rules on Tailwind v4. onsystem checks that the components, props and variant values exist, flags native elements and unnamed icon buttons on Tailwind v3 or v4, and in Claude Code catches an invented one right after the edit, so run both.

## Does it help?

Claude Code built the same ten components for [vercel/ai-chatbot](https://github.com/vercel/ai-chatbot), once as it ships and once with the plugin, and `check` scored what it wrote:

| Model            | Clean without | Clean with the plugin | Design-system errors | Cost |
| ---------------- | ------------: | --------------------: | -------------------: | ---: |
| Claude Haiku 4.5 |        6 / 10 |           **10 / 10** |               13 → 0 | −11% |
| Claude Opus 5    |        8 / 10 |           **10 / 10** |                5 → 0 |  +7% |

It is small: one repository, Claude models only, 40 runs (one per task, model and condition), scored by the tool itself, and run before the rename. With the plugin, the agent looked components and tokens up before writing, and the hook never had to block. Read it as a direction, not a rate; the [method, per-run results and every generated file](bench/agents) are in the repository.

## Docs

On the [website](https://onsystem.vercel.app/docs), and as Markdown in [docs/](docs):

- [Quickstart](https://onsystem.vercel.app/docs), [Claude Code plugin](https://onsystem.vercel.app/docs/plugin), [CI and baselines](https://onsystem.vercel.app/docs/ci) and [Set up your agent](https://onsystem.vercel.app/docs/clients), with the config for each client
- [Configuration](https://onsystem.vercel.app/docs/configuration), [Rules](https://onsystem.vercel.app/rules), [MCP tools](https://onsystem.vercel.app/docs/tools) and [Troubleshooting](https://onsystem.vercel.app/docs/troubleshooting)
- [How it works](https://onsystem.vercel.app/docs/how-it-works), [FAQ](https://onsystem.vercel.app/docs/faq) and [Migrating from design-system-mcp](https://onsystem.vercel.app/docs/migrating)

[Contributing](CONTRIBUTING.md), [security](SECURITY.md) and the [changelog](CHANGELOG.md) are in the repository.

## License

[MIT](LICENSE) © Diogo Esteves
