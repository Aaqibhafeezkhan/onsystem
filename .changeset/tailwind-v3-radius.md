---
'onsystem': patch
---

Tailwind v3 projects: radius values set in `tailwind.config` `borderRadius`, or in a preset it imports, are read, so `4px` in a project whose `rounded-sm` is `calc(var(--radius) - 4px)` suggests `rounded-sm`. Thanks @CRYPTONIKAV.
