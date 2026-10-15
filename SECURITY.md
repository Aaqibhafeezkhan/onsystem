# Security

## Reporting a vulnerability

Report it privately through [GitHub's private vulnerability reporting](https://github.com/dgesteves/onsystem/security/advisories/new), not in a public issue. Include the version, how the server or CLI was run, and the smallest project or input that shows the problem. Fixes ship as a patch release of the latest version, with an advisory once users can upgrade.

## What the tool trusts

- The server runs locally over stdio, opens no ports and makes no network requests of its own. `npx` downloads the package from npm when the client starts it.
- It reads files under the project root (components, tokens, docs, `tsconfig`, `tailwind.config`) and the workspace packages they point at, and writes only its cache, in `node_modules/.cache/onsystem` or the system temp folder, and the baseline file when you run `check --update-baseline`.
- Component, token and docs files are read only when their real path, links resolved, is in the project, the workspace or git repository it is in, the package whose declared config it takes on, or a package installed in `node_modules`. A link, or a `../` or absolute path in the config, that leads anywhere else is skipped, and `inspect` and the server's log name it. The home folder and the filesystem root never count as the workspace or repository.
- `check_ui` with a `path` reads only files inside the project root, symlinks resolved, and limits input size.
- An `onsystem.config.ts`, `.mjs` or `.js` file (or one under the old `design-system-mcp.config` name) is imported, so it runs as code, like an ESLint config. A `tailwind.config` is parsed, never run. Treat the config file like any other code in the repository.
- The Claude Code plugin's hook runs the project's own install of the CLI when there is one, else `npx` with the exact version the plugin was released with.

Reports about any of these boundaries are welcome.
