# onsystem for Claude Code

This plugin keeps Claude on your React design system. It reads the project's real components, props, `cva` variants and design tokens, gives them to Claude before it writes UI, and checks every `.tsx` or `.jsx` file Claude writes against them. When Claude invents a component, a prop, a variant value or a color, the hook answers the edit with a blocking error that names the fix, and Claude corrects the file before it moves on.

## What it adds

- **A hook.** After every `Write` or `Edit` of a `.tsx` or `.jsx` file, it runs `onsystem check` on that file. Errors go back to Claude as a blocking error (for an Edit, only those on the lines it changed; older findings are counted, not pushed, and when the hook cannot tell which lines an Edit changed, the findings go to Claude as a note that does not block). Warnings go to Claude as a note that does not block. It stays silent for clean files, other files, and projects without design-system components, so it is safe to install for every project. If the check cannot run (npx cannot fetch the package, an offline machine without it in npm's cache, a private registry, a broken config), it tells you once per session and project and never blocks the edit. When npm could not reach the registry, or npx did not finish within the hook's 55 seconds, the hook does not start npx again for ten minutes, so an offline session waits for npm once, not on every edit.
- **An MCP server,** `onsystem`, with five read-only tools: `list_components`, `get_component`, `search_components`, `get_tokens` and `check_ui`.
- **A skill** that tells Claude to look components and tokens up before writing UI and to fix every `check_ui` finding. It loads by itself for UI work, or run `/onsystem:onsystem`.

## What it runs

Both the hook and the MCP server run the `onsystem` npm package, pinned to the exact version of this plugin. The hook uses the copy installed in the project (`npm install --save-dev onsystem`) when there is one, and otherwise `npx --prefer-offline --yes onsystem@<version>`, which runs the copy in npm's cache without asking the registry; if npm itself fails there, it runs once more with `--prefer-online`, which asks it. A failure of the CLI, such as a broken config, is reported at once, without a second run. The server runs `npx -y onsystem@<version>`. Both are started with Node.js directly, never through a shell.

## What data it touches

Everything runs on your machine. The package reads the project's component files, stylesheets and token files, docs, `package.json`, `tsconfig` and the config file if there is one, and the workspace packages they point at. It writes only its cache (in `node_modules/.cache/onsystem`, or the system temp folder), small marker files in the system temp folder so the hook's notice is shown once and its pause holds, and a baseline file when you ask for one. It makes no network requests and no model calls, needs no API key, and sends nothing anywhere. The only network access is npm's, through npx:

- The hook's npx downloads the package the first time and on each new version. After that it runs from npm's cache, offline too.
- The server's npx asks the npm registry about the package each time it starts, and downloads it the first time and on each new version. Offline, it starts the server from npm's cache only after npm gives up on the registry, over a minute later.
- A project install (`npm install --save-dev onsystem`) needs no network: the hook runs it without npm, and the server's npx uses it when it is this plugin's version.

## Install

```text
/plugin marketplace add dgesteves/onsystem
/plugin install onsystem@dgesteves
```

## Coming from the design-system plugin

This plugin used to be called `design-system`, and the package `@dgesteves/design-system-mcp`. Remove the old plugin, then install this one:

```text
/plugin uninstall design-system@dgesteves
/plugin marketplace update dgesteves
/plugin install onsystem@dgesteves
```

## Links

- [Docs](https://onsystem.vercel.app/docs/plugin)
- [Source](https://github.com/dgesteves/onsystem)
- [Issues](https://github.com/dgesteves/onsystem/issues)

MIT License.
