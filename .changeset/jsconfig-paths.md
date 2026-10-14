---
'onsystem': patch
---

A JavaScript app is now checked through its `jsconfig.json`. Without a `tsconfig.json`, onsystem read no path aliases, so in a shadcn/ui app set up with `"tsx": false` (its `@/*` alias in `jsconfig.json`, as create-next-app writes it for JavaScript) `components.json` was not followed, and every component imported through `@/components/ui/...` counted as external: `<Button variant="primary">` and a misspelled `<Cardd />` passed, and `check` printed "No problems" with exit code 0. onsystem now reads `jsconfig.json` when there is no `tsconfig.json`, as TypeScript does, so those imports resolve and the component rules run on them. `inspect --explain` names the file it read, and a change to it rebuilds the cached model, which the running MCP server picks up.
