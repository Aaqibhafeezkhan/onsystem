---
'onsystem': patch
---

A design-system package whose tokens are a Tailwind v4 theme partial (`@theme`, with no `@import "tailwindcss"`, since the app imports Tailwind) no longer turns off `no-hardcoded-spacing` in the apps that read its config. In a project on Tailwind v4 (`@tailwindcss/postcss`, `@tailwindcss/vite` or `@tailwindcss/cli` in its `package.json`, or `tailwindcss` in a range other than v3's, such as `^4`), such a theme gets Tailwind's default spacing unit and radius scale, as a stylesheet that imports Tailwind does, unless it clears them (`--spacing-*: initial`). `p-[13px]` is reported again, with `p-3` as the nearest step.

A component imported through a subpath export that leads to a source file that does not exist, such as `<Tooltip>` from `@acme/ui/components/tooltip` where `"./components/*": "./src/components/*.tsx"` has no `src/components/tooltip.tsx`, is reported by `no-unknown-component` in workspace apps that read the package's config, as it already was in apps that install the package. It was said not to have been checked, with advice to add the missing files to "components". An import whose export leads to a build folder (`dist/`) with no file there, as before the package is built, is still said not to have been checked, whatever its sources are named.

In an app whose design-system package publishes neither its component sources nor their type declarations, `list_components`, `get_component` and `inspect --explain` now say so, and what its team can do, instead of telling you to check the "components" globs in the config, which would not help.

`init` in a design-system package adds `ONSYSTEM.md` to `files` in its `package.json`, next to the config, so the teams of apps that install the package get the guide in `node_modules`, unless `files` leaves it out (`"!ONSYSTEM.md"`).
