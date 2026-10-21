---
'onsystem': minor
---

`no-hardcoded-color` warns on a `chart-*` token used outside a chart, such as `text-chart-2` on a green "Connected" label in a theme with no success color. The class is a token, so it was counted as clean, but it changes with the chart palette and does not say what a status color says: in benchmark v2's two tasks that ask for a small green label in such a theme, all 24 runs with onsystem's skill, MCP server and hook together used a chart token for the green, and 0 of 24 without onsystem did. The warning does not fail `check` or block the hook, and has no fix: it says to add a status token for a status color (`--success`, as docs/tokens.md#status-colors shows) or to use the token that fits. Chart tokens are left alone in a file that draws a chart (it imports a chart library, renders a tag such as `<ChartContainer>` or `<BarChart>`, declares a name such as `chartData`, or is named for charts), in an element inside an `<svg>`, a `<figure>` or a `role="img"`, and everywhere when the design system's own components use them outside a chart. The real-world corpus has no such finding; sidebar tokens, which apps use for their frame (`bg-sidebar` on a shell or header), are not reported.

`onsystem init` says which of success, warning and info the theme has no color for, after the dry run, with a link to the CSS that adds them.

`icon-button-accessible-name` takes a button's name from a `<label htmlFor>` (or the design system's `<Label htmlFor>`) whose value is the button's `id`, as for `<label htmlFor={id}>Autopilot</label>` next to `<button id={id} role="switch">`. A button is a labelable element, so that label is its accessible name, and the button was reported without one.
