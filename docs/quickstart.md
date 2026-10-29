# Quickstart

No config is needed in a shadcn/ui project (Tailwind v3 or v4), an app whose components live in a workspace package, or the design-system package itself ([how it finds them](configuration.md#zero-config)). Other layouts take a [config file](configuration.md#config-file). Run it from the app's folder, or from a [monorepo root](configuration.md#monorepo-roots), where it finds every app and design-system package and checks each file against its own project.

> [!NOTE]
> It needs Node.js 20.19 or later.

<!-- steps -->

## See what it found

From the app's folder or the monorepo root, with no install and no config:

```sh
npx -y onsystem check .
```

It checks your UI code against the components, variants and tokens it found and prints each finding with what to write instead. It exits with code 1 when there are errors. Findings in folders that `npx shadcn add` filled from other registries, such as `components/ai-elements`, are in code you did not write: [Code from shadcn registries](configuration.md#code-from-shadcn-registries) says how to set them apart.

`npx -y onsystem inspect` shows what it read from your design system: the components with their props, variants and parts, and the tokens by category. `inspect --explain` adds every place it looked and why each was taken or not, the config it resolved to, tokens that did not resolve and components whose props did not. If it found nothing, see [troubleshooting](troubleshooting.md#inspect-found-nothing).

To keep what it found in a file you can edit, run `npx -y onsystem init`: it writes `onsystem.config.json` from it (or asks where the components and tokens are when it found nothing), checks the project once and offers to record the findings as a baseline. `--yes` answers for you.

## Hold your agent to it

Give your agent this prompt, and it does the rest of the setup itself: the config and the baseline, onsystem in the agent, and the CI check. [setup.md](https://onsystem.vercel.app/setup.md) has the steps it follows.

```text title="Prompt for your agent"
Read https://onsystem.vercel.app/setup.md and set up onsystem in this project.
```

Or add it yourself. Pick one:

- **Claude Code**: install the [plugin](plugin.md). Its hook checks every UI file Claude writes and hands the errors back before Claude moves on; it also brings the MCP server and a skill that has Claude look components up first.

  ```text title="Claude Code"
  /plugin marketplace add dgesteves/onsystem
  /plugin install onsystem@dgesteves
  ```

- **Cursor or VS Code**: use the [one-click install links](clients.md#cursor-and-vs-code), or commit the config there to the repository.
- **Any other MCP client**: run `npx -y onsystem` as a stdio server. There are [configs for Claude Desktop, Codex CLI, GitHub Copilot CLI, Windsurf, JetBrains IDEs, Zed, Gemini CLI, Antigravity and Grok Build](clients.md#other-clients).

## Try it

Ask your agent for some UI, such as _"Add a danger-zone card to the settings page."_ It looks the components, variants and tokens up before writing and runs `check_ui` on the result. In Claude Code the skill loads by itself for UI work (or run `/onsystem:onsystem`), and the hook checks each file as it is written.

## Gate your pull requests

Install it as a dev dependency, record the findings the codebase already has, and fail CI only on new ones:

```sh pm
npm install --save-dev onsystem
npx onsystem check . --update-baseline   # writes onsystem.baseline.json: commit it
```

```yaml title=".github/workflows/onsystem.yml"
- run: npx onsystem check . --format github --require-design-system
```

`check .` lints every `.tsx` and `.jsx` file under the folder, whatever the layout, and leaves out the design system's own components, tests and stories, and what git ignores. [CI and baselines](ci.md) has the whole workflow, and the [CLI reference](cli.md) every option.

<!-- /steps -->

## What it works with

|                | Supported                                                                                                                                                                                                                                                                                | Not supported yet                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| UI code        | React, in `.tsx` and `.jsx` files, and `.js` files with JSX that a glob names                                                                                                                                                                                                            | Vue, Svelte, Angular                                                       |
| Styling        | Tailwind CSS v3 and v4 classes, `style` objects and color attributes                                                                                                                                                                                                                     | CSS-in-JS (styled-components, Emotion), CSS Modules, plain stylesheets     |
| Variants       | `cva()`, `tv()` (tailwind-variants), and props typed as unions of string literals                                                                                                                                                                                                        | —                                                                          |
| Components     | Your own, such as shadcn/ui's or ones built on Radix, React Aria, Base UI or another primitives library, in the app or in a workspace package; a design-system package installed with its type declarations ([design-system packages](design-system-packages.md)); MUI (`@mui/material`) | Chakra UI, Mantine, HeroUI, Radix Themes, Ant Design, MUI's other packages |
| Tokens         | CSS custom properties (Tailwind v4's `@theme`, shadcn/ui's `:root` variables), a Tailwind v3 `tailwind.config`, DTCG 2025.10 `.tokens.json` files, a `DESIGN.md` ([tokens](tokens.md))                                                                                                   | Values computed in code                                                    |
| Monorepos      | pnpm, npm, Yarn and Bun workspaces, Lerna, Nx and Turborepo ([monorepo roots](configuration.md#monorepo-roots))                                                                                                                                                                          | —                                                                          |
| Agents         | The Claude Code plugin (hook, MCP server and skill), its hook in Codex CLI, and the MCP server in Cursor, VS Code and [other clients](clients.md)                                                                                                                                        | —                                                                          |
| CI and editors | `onsystem check` in any CI with Node.js, the [GitHub Action](required-check.md), and the [ESLint plugin](eslint.md) for ESLint 8.57, 9 and 10 with a flat config                                                                                                                         | —                                                                          |
| Runtime        | Node.js 20.19 or later (22.18 or later for a TypeScript config file), on macOS, Linux and Windows                                                                                                                                                                                        | —                                                                          |

Zero config finds the design system in the common layouts ([how](configuration.md#zero-config)); the others take a config file with a `components` glob. [How it works](how-it-works.md#limits) lists what it does not check yet.
