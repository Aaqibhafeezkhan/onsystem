---
'onsystem': patch
---

A prop typed differently in each member of a union now takes what any member allows. Radix types Accordion and ToggleGroup as `(SingleProps | MultipleProps)`, so stock shadcn/ui `<Accordion type="multiple">` and `<ToggleGroup type="multiple">` were reported as `no-unknown-variant` errors ("Allowed: single") once the Radix types were installed, and `get_component` listed only `"single"`. They now pass, and `get_component` shows `type: "single" | "multiple"`, `value?: string | string[]`. A prop is required only when every member requires it.
