---
'onsystem': patch
---

`check` on one file starts sooner, which the Claude Code hook does on every edit. The CLI turns on Node's compile cache (Node.js 22.1 and later), so the CLI and TypeScript are not compiled again on each run; it is kept in the user's own folder in the system temp folder, `onsystem-<uid>`. An app whose design system zero config finds in a package's `exports` keeps what it found beside the cached model, and reads it from there until a file in that package, or the app's `package.json` or `components.json`, changes: following the package's barrels parsed every file they lead to, on every run. On midday's dashboard and dub's web app, `check` on one file went from 0.51 s to 0.33 s and from 0.77 s to 0.43 s.

In a project without onsystem installed, the hook runs it through npx on the first edit only: the CLI npx started says where it is, and the next edits run it with Node directly, without starting npm, while it is still the plugin's release.
