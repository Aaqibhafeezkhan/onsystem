---
'onsystem': patch
---

`no-unknown-prop` and `no-unknown-variant` no longer fix a guess that changes what the code means. `eslint --fix`, fix-on-save and the agent tools applied them: `<Button href="/docs">` became `ref="/docs"`, `<Input onValueChange={…}>` became `onVolumeChange`, `as="a"` and `component={Link}` became `asChild`, `onClose` became `onOpenChange` (which also runs on open), and `size="xl"` on a button with an `xs` size became `xs`. Now:

- A prop guessed by spelling from the attributes a component forwards is named in the message but not fixed (`disable`: Did you mean "disabled"?), and `ref` and event handlers are never guessed by spelling. Equivalents and synonyms (`isDisabled` to `disabled`, `tone` to `variant`), the same name in other case (`onclick` to `onClick`) and an own prop one letter off (`varient` to `variant`) are still fixed.
- `href`, `as` and `component` get how the component composes instead: `asChild` with a `<Link>` child on Radix, `render` on Base UI.
- `onClose`, `onDismiss`, `onOpen` and `onToggle` point at `onOpenChange` with the check to add (`onOpenChange={(open) => { if (!open) … }}`), without a fix.
- A variant value guessed by spelling is named but not fixed, and a size is never guessed from another size (`xl` from `xs`, `icon-xl` from `icon-xs`). `xxs` and `2xl` map to `xs` and `xl` when the component has them.
