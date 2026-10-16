---
'onsystem': minor
---

`check` and `check_ui` read only JS and TS files. A CSS, Markdown or JSON file named outright or matched by a glob, as `check $(git diff --name-only)`, lint-staged's `"*"` or `check "**/*"` passes them, was parsed as TSX and gave hundreds of syntax errors (209 for a shadcn/ui `app/globals.css`), so the run failed on files with no UI code in them. `check` now skips such a file and counts it in the summary line (`3 files that are not JS or TS skipped`). `check_ui` answers with an error for a `path` or `filename` that is not `.tsx`, `.jsx`, `.ts` or `.js` (or `.mts`, `.cts`, `.mjs`, `.cjs`): a `.vue` or `.css` file was checked as TSX before.

`--require-design-system` also fails (exit code 2) when the folders and globs it is given leave no file to check, so CI cannot pass by checking nothing: a JavaScript app whose pages are `.js` files, a job that runs in a design-system package, whose files are all its own components, or a glob that matches only styles. Files named outright that are not JS or TS still pass with nothing to check. This can fail a job that passed before.

Folders still stand for their `.tsx` and `.jsx` files, and `check` now names the `.js` files in them that have JSX (Next.js's JavaScript template writes `app/page.js`) with the command that checks them, such as `check . "**/*.js"`, in place of "no files match" for a folder of `.js` pages, and as the first line of the `--require-design-system` failure. In the GitHub Action, `paths: . **/*.js` checks them.

A run with 50 findings or more ends, in the default output, with the count per rule and the ten Tailwind palette classes it found most, each with the token to use. `--format json`, `sarif` and `github` print the findings alone, as before.
