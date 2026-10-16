---
'onsystem': minor
---

`exclude` adds to the defaults instead of replacing them. A config whose `exclude` lists folders without repeating the defaults now also leaves out tests and stories (`*.test.tsx`, `*.stories.tsx`, `__tests__`, `__stories__` and `__mocks__` folders) and `.d.ts` files, which it checked before. To check one of them again, add the default with `!` in front (`"!**/*.{test,spec,stories}.{ts,tsx,js,jsx}"`), or pass `--include-tests` to check tests and stories for one run; a `!` pattern that names no default gets a warning. A design-system package's `exclude` adds to the defaults for finding its own components too.
