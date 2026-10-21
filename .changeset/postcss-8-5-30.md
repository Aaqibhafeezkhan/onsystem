---
'onsystem': patch
---

The `postcss` dependency now requires 8.5.30 or later (it was `^8.5.29`). 8.5.30 fixes a broken source map when PostCSS escapes `</style>`; onsystem only parses stylesheets and writes no source maps, so what `check`, the MCP tools and the ESLint plugin report does not change.
