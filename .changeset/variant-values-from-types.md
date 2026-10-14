---
'onsystem': patch
---

A variant prop that TypeScript types as a set of strings keeps every value in that set when its `cva()` or `tv()` literal lists fewer. With `variant: { ...base, brand: "…" }` and `VariantProps`, `variant` took only `"brand"`, so `<Button variant="default">` was a `no-unknown-variant` error and the fix rewrote it to `variant="brand"`; with tv's `extend`, `size` took only the values of its own literal, so `size="sm"` from the base was an error. The literal now only sets the order of the values. When nothing types the prop (class-variance-authority or tailwind-variants is not installed) and the literal does not list every value (a spread, a key that is not a literal, or tv's `extend`), the prop accepts any value instead of only the ones listed.
