---
'onsystem': patch
---

`no-unknown-prop` and `no-unknown-variant` no longer fix a guess that changes what the code means. `eslint --fix`, fix-on-save and the agent tools applied them: `<Button href="/docs">` became `ref="/docs"`, `<Input onValueChange={…}>` became `onVolumeChange`, `as="a"` and `component={Link}` became `asChild`, `onClose` became `onOpenChange` (which also runs on open), and `size="xl"` on a button with an `xs` size became `xs`. Now:

- A prop guessed by spelling from the attributes a component forwards is named in the message but not fixed (`disable`: Did you mean "disabled"?). `ref`, whether the component forwards it or takes it as its own prop, and forwarded event handlers are never guessed by spelling. Equivalents and synonyms (`isDisabled` to `disabled`, `tone` to `variant`), the same name in other case (`onclick` to `onClick`) and an own prop one letter off, handlers included (`varient` to `variant`), are still fixed.
- `href`, `as` and `component` get how the component composes instead: `asChild` with a `<Link>` child on Radix, `render` on Base UI. On a component that composes neither way, they get no guess (no `ref` for `href`, no `is` for `as`).
- `onClose`, `onDismiss`, `onOpen` and `onToggle` point at `onOpenChange` with the check to add (`onOpenChange={(open) => { if (!open) … }}`), without a fix.
- A variant value guessed by spelling is named but not fixed, and a size is never guessed from another size (`xl` from `xs`, `icon-xl` from `icon-xs`). Only another name for the same size is fixed (`xlarge` to `xl`, `small` to `sm`), and so is the same step spelled the way the scale spells it (`xxl` to `2xl` or `2xl` to `xxl`, `xxs` to `2xs`, `XL` to `xl`). A size one step past the end of the scale is named next to that end without a fix: `xxs` next to `xs`, `2xl` or `xxl` next to `xl`, `3xl` next to `2xl`, and `xs` next to `sm` or `small` on a scale without `xs`, which was fixed before.
