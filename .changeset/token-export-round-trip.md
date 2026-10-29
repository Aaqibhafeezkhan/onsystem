---
'onsystem': patch
---

`onsystem export --format design-md` writes Tailwind's spacing unit as the steps of the scale (`"1": 0.25rem`, `"2": 0.5rem` up to `"96": 24rem`) instead of `base: 0.25rem`. DESIGN.md has no multiplier, so a reader, onsystem included, took 4px as the only step: read back in a project with no stylesheet, `padding: "16px"` got the advice "Use `p-[4px]`", and `gap-[8px]` the nearest step `gap-[4px]`. Now 8px and 16px are on the scale, and `p-[13px]` is nearest `p-[12px]`. Export again to rewrite a DESIGN.md written by an earlier version.

A typography alias in the DESIGN.md export, such as shadcn/ui's `--font-heading: var(--font-sans)`, is written as the level it names (`fontFamily: ...`) instead of `"{typography.font-sans}"`. A reference in the front matter names one value, not a level: onsystem warned "unresolved reference {typography.font-sans}" when it read the file, and DESIGN.md's linter reported one unknown typography property per character of the reference.

A DTCG file exported into the project with `onsystem export --format dtcg --out design.tokens.json`, which zero config reads back next to the stylesheet, no longer adds tokens. Its `@theme inline` tokens (`rounded-sm`, `font-sans`) have no custom property to merge by, so they now merge with the stylesheet's by name and Tailwind class. In a stock shadcn/ui app, `inspect` listed 50 tokens instead of 42, and a later DESIGN.md export listed the radii twice and warned that they were left out of the front matter.
