---
'onsystem': patch
---

`init` in a design-system package that exports its components by a pattern (`"./components/*": "./src/components/*.tsx"`, as shadcn/ui's monorepo template does) no longer writes `"importPath": "@acme/ui/components/*"`. Every app took that on: `check`, the MCP server and the hook told agents to write `import { Button } from "@acme/ui/components/*"`, which does not compile, and a component imported by its own subpath was not checked against its props and variants. Apps now get each component's own subpath (`@acme/ui/components/button`). If `init` wrote such an `importPath` for you, delete it from `onsystem.config.json`.
