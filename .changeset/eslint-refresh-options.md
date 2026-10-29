---
'onsystem': minor
---

The ESLint plugin no longer holds up a lint while it looks at the design system again. In an editor, every lint after a pause of two seconds or more waited for that look, which takes longer the larger the design system. Now the lint is answered at once from the design system already loaded, the look runs in the background, and the lints after it get what it found. The lint that starts a look is answered from what was loaded before, so after a change to the design system or the config, the file shows its earlier findings until it is linted again (the next edit, or the next save when the editor lints on save). A one-shot `eslint` run always loads fresh.

Edits to the project's config reach an editor's ESLint server without a restart: a rule turned off in the `rules` or `overrides` of `onsystem.config.json`, `.mjs`, `.js` or `.ts` is no longer reported once the plugin has looked at the project again. Before, the plugin kept the rules it loaded first until the server restarted.

A rule's options can be set in ESLint's config, as in `onsystem.config.json`: `'onsystem/no-hardcoded-color': ['error', { allow: ['#fff'] }]` no longer fails ESLint's config validation ("should NOT have more than 0 items"), and its `allow` takes the place of the one the project's config gives that rule.

A misspelled rule in a suppression comment, such as `// onsystem-disable-next-line no-hardcoded-colour`, is reported by the new `onsystem/suppression` rule, a warning in the recommended config, with the message `check` gives. Through ESLint, nothing said why the comment suppressed nothing. This is a new warning on upgrade: a run with `--max-warnings 0` over code with such a comment now fails, until the comment is fixed or `'onsystem/suppression': 'off'` turns the rule off.

docs/eslint.md says where rule options live, what each ESLint run pays for the plugin (prefer `onsystem check` or the GitHub Action for a CI gate), and that ESLint's `--cache` does not see design-system changes.
