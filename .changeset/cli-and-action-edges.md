---
'onsystem': patch
---

`check --max-warnings=-1` is no limit, as in ESLint: it failed a clean file with "Too many warnings (0, max -1)". An empty value, as an unset variable in a CI script gives, or one that is not a whole number, now exits 2 with one line; an empty one was read as 0.

An option of another command now exits 2 with one line instead of being ignored: `check . --out report.json` wrote no file and exited as if it had, and `check . --explain` explained nothing.

`check`, `inspect`, `export` and `init` run from a folder inside a project that has no config, `components.json`, `package.json` or `project.json` of its own (`app/settings`) now work on the nearest folder above it with one, as the Claude Code hook does. From there, zero config found no design system, so a file with errors gave "No problems in 1 file." and exit 0. With `--root`, `--config`, `--components`, `--tokens` or `--docs`, or with a baseline in the folder, the root is what it was.

`inspect` says when the design system has no color tokens, or no components, which `check` said only after it ran: `No color tokens found: check will not run no-hardcoded-color.` At a monorepo root, each project's entry says what it is missing, and `check --require-design-system` names the projects and what each one lacks.

Ctrl+D or Ctrl+C at one of `init`'s questions now says it cancelled and exits 130, instead of printing an `AbortError` stack trace.

`check --format github` titles its annotations `onsystem: <rule>`, as the GitHub Action does.

The GitHub Action no longer drops a file's later changes when an added line starts with `++ ` (which the diff shows as `+++ `, like a file header), so their findings are reported. It also reads the checkout in a `container:` job, where git refused the workspace as another user's ("dubious ownership") and every pull request failed; when git still refuses it, the error says to add it to `safe.directory` rather than to check out with `fetch-depth: 0`.
