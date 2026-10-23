---
'onsystem': patch
---

A long length or color no longer slows onsystem down. A class with an arbitrary length thousands of digits long, such as `p-[999…9x]`, took a second to check at 20,000 characters and about 25 seconds at 100,000, in `check`, the MCP `check_ui` tool, the ESLint plugin and the GitHub Action: the pattern that reads a length tried every way to split the digits. It now takes a few milliseconds. The same goes for token values: a length, a `var()` with a fallback, or bare HSL or RGB channels in the design system's stylesheets or Tailwind config, and typography, spacing and radius values in `onsystem export`. A `var()` whose fallback holds `calc()` or another `var()` now has the fallback's value, inside `calc()` too: `calc(2 * var(--gap, var(--space-2)))` is read as a length, and `calc(var(--gap, var(--space-2)) + 1px)` no longer drops the `+ 1px`.

`onsystem export --format dtcg` keeps a token whose path has a `__proto__` part, such as `--color-__proto__`, under a `"__proto__"` key of its group. It was left out, and a name such as `--__proto__.polluted` added a `polluted` property to every object in the process that ran the export.
