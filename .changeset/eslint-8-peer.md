---
'onsystem': patch
---

`npm install --save-dev onsystem` no longer fails with ERESOLVE in a project on ESLint 8.57. The optional `eslint` peer now admits ESLint 8.57 and later, where it asked for 9: the ESLint plugin runs on ESLint 8.57 with a flat config. On an older ESLint, npm still stops the install with ERESOLVE: upgrade ESLint to 8.57, or, since the CLI and the MCP server need no ESLint, install with `--legacy-peer-deps`.
