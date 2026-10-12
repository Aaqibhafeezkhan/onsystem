---
'onsystem': minor
---

`onsystem init` in a design-system package now declares its config in its package.json (`"onsystem": "./onsystem.config.json"`) and writes ONSYSTEM.md for the teams of the apps that use it, and an app with no config of its own takes on the config a dependency declares, from the workspace or from `node_modules`, in the CLI, the MCP server and the ESLint plugin alike.
