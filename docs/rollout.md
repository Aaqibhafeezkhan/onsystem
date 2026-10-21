# Roll out to a team

Once `check .` finds the right things in your codebase ([quickstart](quickstart.md)), make it the team's: every agent gets the design system when someone opens the repository, every pull request is checked, and the findings already in the code are recorded so that only new ones fail. Each step is a file you commit. Do them in this order: the baseline comes before anything that fails on findings, and the pull request check reports for a while before it is required.

<!-- steps -->

## Pin the version

Add it as a dev dependency, at the root in a monorepo (with pnpm, `pnpm add -D -w onsystem`):

```sh
npm install --save-dev onsystem
```

`npx onsystem` and the Claude Code plugin's hook run this install, so everyone runs the version in `package.json`. The GitHub Action runs the version of its own release: [pin it](#upgrade) to the same one.

## Set up the design system

In a monorepo with a design-system package, run `init` in the package. Every app that depends on it then takes its config on, with no config of its own ([design-system packages](design-system-packages.md)):

```sh
cd packages/ui
npx onsystem init
```

In a single app, run `npx onsystem init` in the app, and answer yes when it offers a baseline: the app is where CI runs the check, so that does the next step. `init` writes `onsystem.config.json` from what it found, and in a package also `ONSYSTEM.md`, which tells the apps' teams how to use it. Commit what it writes.

In a package, answer no when it offers a baseline: CI at the root does not read a baseline in the package, and the next step records one where CI runs the check. Skip `ONSYSTEM.md`'s CI section too, which has each app record a baseline in its own folder: it is for apps outside this repository, and the next step sets the baseline for the apps inside it.

## Record the baseline

Record the findings already in the code once, from the folder where CI runs the check, and commit the file:

```sh
npx onsystem check . --update-baseline
git add onsystem.baseline.json
```

Keep one baseline. From a monorepo root, `check .` checks each file against its own project and reads the root baseline, and the plugin's hook reads it too. A run from an app's folder reads neither the root config nor the root baseline ([monorepo roots](configuration.md#monorepo-roots)), so if CI runs [a job per app](#a-job-per-app), record a baseline in each app's folder instead, and none at the root.

Give the baseline and the config to the design-system team in `.github/CODEOWNERS`, so that a pull request that accepts new findings by rewriting the baseline needs their review. Turn on **Require review from Code Owners** in the ruleset or branch protection for it to hold.

```text title=".github/CODEOWNERS"
/onsystem.baseline.json @acme/design-system
/packages/ui/onsystem.config.json @acme/design-system
```

## Give every agent the design system

Commit these at the repository root.

**Claude Code** gets the plugin, with the hook, the MCP server and the skill, for everyone who opens the repository:

```json title=".claude/settings.json"
{
  "extraKnownMarketplaces": {
    "dgesteves": {
      "source": { "source": "github", "repo": "dgesteves/onsystem" }
    }
  },
  "enabledPlugins": {
    "onsystem@dgesteves": true
  }
}
```

Claude Code adds the marketplace once each teammate accepts its trust dialog for the folder, and ignores it without a message until then. The plugin then loads from the marketplace, with no `/plugin install`. Claude Code reads this file from the folder it starts in, so start it at the root. Cloud sessions (Claude Code on the web) do not load plugins from a repository's settings; the pull request check still covers what they push. No `.mcp.json` entry for onsystem goes next to it: the plugin and that entry register the same tools ([plugin](plugin.md)). If the repository commits [one `.mcp.json`](clients.md) for the other clients, add `"disabledMcpjsonServers": ["onsystem"]` to this file, so Claude Code skips that entry.

**Cursor** and **VS Code** get the MCP server, started in the workspace folder, which at a monorepo root serves every project ([set up your agent](clients.md#cursor-and-vs-code)):

```json title=".cursor/mcp.json"
{
  "mcpServers": {
    "onsystem": {
      "command": "npx",
      "args": ["-y", "onsystem", "--root", "${workspaceFolder}"]
    }
  }
}
```

```json title=".vscode/mcp.json"
{
  "servers": {
    "onsystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "onsystem", "--root", "${workspaceFolder}"]
    }
  }
}
```

**Other agents** that read `AGENTS.md` get one line there. Agents without the MCP server, such as one in a cloud sandbox, check with the CLI instead:

```md title="AGENTS.md"
Before writing UI, use the onsystem tools. Run check_ui on every file you change and fix all errors. Without the tools, run `npx onsystem check <file>` on each file you change and fix all errors.
```

GitHub Copilot's cloud agent can also get the MCP server in the repository's settings ([pull requests from agents](required-check.md#pull-requests-from-agents)).

## Add it to ESLint

If the apps run ESLint, add the recommended config at the end of each app's `eslint.config.mjs`, or of the shared config they extend, so findings show in the editor as people type ([ESLint plugin](eslint.md)):

```js title="eslint.config.mjs"
import onsystem from 'onsystem/eslint';

export default [
  // ...your config, such as eslint-config-next's or typescript-eslint's
  onsystem.configs.recommended,
];
```

ESLint does not read the onsystem baseline. If ESLint runs in CI, record the findings already there with ESLint's own suppressions (`npx eslint . --suppress-all`, on ESLint 9.24 and later), or the lint job fails on all of them.

## Gate pull requests

The workflow from [Make it a required check](required-check.md), with two inputs for a team:

```yaml title=".github/workflows/onsystem.yml"
name: Design system
on:
  pull_request:
  merge_group:
permissions:
  contents: read
jobs:
  onsystem:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - uses: dgesteves/onsystem@v0
        with:
          only-changed-lines: false
          fail-on: none
```

With pnpm, set up pnpm before Node and install from its lockfile. `pnpm/action-setup` takes pnpm's version from `packageManager` in `package.json`, or from its `version` input:

```yaml
steps:
  - uses: actions/checkout@v7
  - uses: pnpm/action-setup@v6
  - uses: actions/setup-node@v7
    with:
      node-version: 24
      cache: pnpm
  - run: pnpm install --frozen-lockfile
  - uses: dgesteves/onsystem@v0
    with:
      only-changed-lines: false
      fail-on: none
```

- **Report first.** With `fail-on: none`, the findings show as annotations on the pull request and in the job summary, and the job fails only when the check cannot run (no design system found, a broken config). Keep it that way until the team trusts what it reports, and fix or [suppress](rules.md#suppressing-findings) what it gets wrong.
- **Then require it.** Remove `fail-on: none`, so that errors fail the job, and add `onsystem` as a required check ([make the check required](required-check.md#make-the-check-required)). While the check only reported, pull requests could merge new findings, and they are not in the baseline: once errors fail the job, every pull request fails on them, even one that does not touch them. So in the pull request that removes `fail-on: none`, first run `npx onsystem check .` where CI runs it, and fix what is new or record it with `npx onsystem check . --update-baseline`, which the baseline's code owners review. The first required run then passes.

`only-changed-lines: false` checks every line, and only findings that are not in the baseline fail. By default the action reports only the lines a pull request changed, so a pull request that removes a variant from `packages/ui` passes while an app still uses it: the app's line did not change. Since every pull request is checked in full, the workflow needs no `paths` filter, which would leave a required check waiting on the pull requests it skips.

<!-- /steps -->

## A job per app

When each app should be its own gate, as when the apps have different owners, run a job per app with a matrix. Each app keeps its own baseline in its folder (`npx onsystem check . --update-baseline` there), and the root has none:

```yaml
jobs:
  onsystem:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: [web, admin]
    steps:
      # ...the steps above, then:
      - uses: dgesteves/onsystem@v0
        with:
          working-directory: apps/${{ matrix.app }}
          only-changed-lines: false
          fail-on: none
```

It reports first and is required later, as above, with `npx onsystem check .` run in each app's folder before you remove `fail-on: none`. GitHub names each job after its matrix value, `onsystem (web)` and `onsystem (admin)`: require each of them, and the new one whenever you add an app. Give each app's baseline a line in `CODEOWNERS`. The plugin's hook reads each app's baseline too. A job per app is also the stricter `require-design-system` gate: from the root, it fails only when no workspace package has components and color tokens.

## Upgrade

`@v0` follows the latest 0.x release, while the dev dependency stays on the version you installed. To run one version everywhere, pin the action to the commit of that release:

```sh
git ls-remote https://github.com/dgesteves/onsystem refs/tags/onsystem@<version>
```

```yaml
- uses: dgesteves/onsystem@<commit> # onsystem <version>
```

To upgrade, change both in one pull request: the dev dependency and the action's commit. A new release can find more, so run `npx onsystem check .` and fix what is new, or record it with `npx onsystem check . --update-baseline`, which the baseline's code owners then review. When the new findings come from a rule that the baseline says did not run, `check` says so. The Claude Code plugin updates from its marketplace (`/plugin marketplace update dgesteves`), and its hook runs the project's install whatever the plugin's version, so edits are checked with the pinned version.
