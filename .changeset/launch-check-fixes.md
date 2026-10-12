---
'onsystem': patch
---

`init` names `onsystem.baseline.json` in its next steps only when it wrote one. Without a terminal, it says that it skipped the baseline question and that `onsystem check . --update-baseline` records one. `inspect --explain` lists each `docs` glob once, where a shadcn/ui app listed `components/ui/**/*.{md,mdx}` twice. The MCP server's load line counts components as `inspect` does: `loaded 4 components (+6 parts)`, not `loaded 10 components`.
