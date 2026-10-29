---
'onsystem': patch
---

The ESLint plugin no longer holds up a lint while it looks at the design system again. In an editor, every lint after a pause of two seconds or more waited for that look, which takes longer the larger the design system. Now the lint is answered at once from the design system already loaded, the look runs in the background, and the lints after it get what it found.

Edits to the project's config reach an editor's ESLint server without a restart: a rule turned off in the `rules` or `overrides` of `onsystem.config.json`, `.mjs`, `.js` or `.ts` is no longer reported once the plugin has looked at the project again. Before, the plugin kept the rules it loaded first until the server restarted.

A rule's options can be set in ESLint's config, as in `onsystem.config.json`: `'onsystem/no-hardcoded-color': ['error', { allow: ['#fff'] }]` no longer fails ESLint's config validation ("should NOT have more than 0 items"), and its `allow` takes the place of the one the project's config gives that rule.

A misspelled rule in a suppression comment, such as `// onsystem-disable-next-line no-hardcoded-colour`, is reported by the new `onsystem/suppression` rule, a warning in the recommended config, with the message `check` gives. Through ESLint, nothing said why the comment suppressed nothing.

docs/eslint.md says where rule options live, what each ESLint run pays for the plugin (prefer `onsystem check` or the GitHub Action for a CI gate), and that ESLint's `--cache` does not see design-system changes.
