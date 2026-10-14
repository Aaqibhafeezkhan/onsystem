---
'onsystem': patch
---

A `pnpm-workspace.yaml` that lists no `packages` no longer makes a single app a monorepo root. pnpm 11 keeps its settings in that file in a single app too (`create-next-app --use-pnpm` writes one with only `allowBuilds`), and in such an app `inspect` printed "workspace 0 packages", `init` wrote a config with only `$schema` ("This is a monorepo root: 0 of 0 workspace packages have a design system"), and a design-system package the app installs, which declares its config, was ignored without a word: no components, no tokens, no component findings. The app is now one project, as it is without the file and as pnpm reads it.
