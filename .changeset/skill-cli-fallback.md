---
'onsystem': patch
---

The skill now says what to run when the onsystem MCP tools are not available, as when it is added on its own with `npx skills add dgesteves/onsystem`. It named only the tools, so an agent without them had nothing to look the design system up or check its work with. It now names `npx -y onsystem inspect` for the components, `npx -y onsystem export --format design-md` for the tokens and `npx -y onsystem check <file> --format json` after each change. Agents that have the tools use them as before.
