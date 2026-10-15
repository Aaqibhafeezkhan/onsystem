---
'onsystem': patch
---

In an app whose design-system package publishes only compiled `dist/`, not its component sources, `no-unknown-component` no longer reports every component the app imports from the package (`"Button" is not a design-system component (imported from "@acme/ui")`) when the package's config sets `importPath`, as `init` writes it for a package apps import by one name. Those errors blocked the Claude Code hook and failed CI on real components, while `check` said in the same run that the component rules did not run. With no component to check against, imports from the package are now left alone, by the CLI, the MCP server, the ESLint plugin, the hook and the Action. The token rules and `icon-button-accessible-name` on native elements still run. To check the package's components in those apps, add `src/` to `files` in its `package.json`.
