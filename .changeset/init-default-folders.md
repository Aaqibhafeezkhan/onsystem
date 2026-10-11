---
'onsystem': patch
---

`init` writes a config where `check` and `inspect` already find the design system without detecting one: an app with `components/ui` and no `components.json`. It spells out the default globs that match and the token files found, with `--yes`, without a terminal, and in one (where it no longer asks where the components are). Before, `init --yes` and `init` without a terminal exited 2 with "zero config found no design system".
