---
'onsystem': patch
---

`no-hardcoded-color` reports a color as a warning, not an error, when the theme has no token of its hue: a green, yellow or blue status color in a stock shadcn/ui theme, which has no `success`, `warning` or `info` token. The message no longer names the nearest token, a gray or another hue's (`muted`, or `chart-2` in a chart), or says to pick one, since that led agents to swap a status color for a token that drops its meaning. It gives the two ways out instead: add a token for the hue to the theme (such as `--success`), or keep the color with `// onsystem-disable-next-line no-hardcoded-color -- <reason>`. The Claude Code hook no longer blocks on these findings, and `onsystem check` exits 0 for them unless `--max-warnings` is set. The ESLint plugin sets severity per rule, so there they stay errors. Grays with no gray token, and colors near a status token of another hue, are still errors.
