---
'onsystem': minor
---

Upgrading: three changes can fail a CI run that passed before. An option of another command, such as `check . --out report.json` or `inspect --max-warnings 0`, now exits 2: drop it, or give it to the command it belongs to. An empty `--max-warnings=`, as an unset variable gives, now exits 2 instead of being read as 0: set the variable, or leave the option out. And `check` run from a folder inside a project that has no config, `components.json`, `package.json` or `project.json` of its own (`app/settings`) now checks against the project above it, so it can report findings where it reported none: fix them, record them with `--update-baseline`, or pass `--root .` to check that folder on its own as before.

`check --max-warnings=-1` is no limit, as in ESLint: it failed a clean file with "Too many warnings (0, max -1)". An empty value, or one that is not a whole number, exits 2 with one line; an empty one was read as 0.

An option of another command exits 2 with one line instead of being ignored: `check . --out report.json` wrote no file and exited as if it had, and `check . --explain` explained nothing. `onsystem` (the MCP server) only says on stderr that it ignores such an option, and starts, so a stale argument in an agent's MCP config does not stop the server.

`check`, `inspect`, `export` and `init` run from a folder inside a project with none of those files (`app/settings`) work on the nearest folder above it with one, as the Claude Code hook does, and `check` says which: `Checking the project in ../..` (on stderr with `--format json`, `sarif` or `github`). From there, zero config found no design system, so a file with errors gave "No problems in 1 file." and exit 0. With `--root`, `--config`, `--components`, `--tokens` or `--docs`, from a folder with a baseline or a `components/ui` or `src/components/ui` folder, or from the home folder, the root is what it was; the home folder is never the project. At a monorepo root, the notices name the projects relative to the working directory, as the files are named.

`inspect` says when the design system has no color tokens, or no components, which `check` said only after it ran: `No color tokens found: check will not run no-hardcoded-color.` At a monorepo root, each project's entry says what it is missing, and `check --require-design-system` names the projects and what each one lacks.

Ctrl+D or Ctrl+C at one of `init`'s questions now says it cancelled, on a line of its own, and exits 130, instead of printing an `AbortError` stack trace. `init` run from a folder below the project names the baseline it records as it names the config (`../../onsystem.baseline.json`).

`check --format github` titles its annotations `onsystem: <rule>`, as the GitHub Action does.

The GitHub Action no longer drops a file's later changes when an added line starts with `++ ` (which the diff shows as `+++ `, like a file header), so their findings are reported. It also reads the checkout in a `container:` job, where git refused the workspace as another user's ("dubious ownership") and every pull request failed; when git still refuses it, the error says to add it to `safe.directory` rather than to check out with `fetch-depth: 0`. The CLI it runs gets the same `safe.directory` entries, so it leaves out what git ignores there too.
