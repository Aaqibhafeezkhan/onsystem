---
'onsystem': patch
---

pr: #153
author: @CRYPTONIKAV

`no-hardcoded-spacing` no longer reports or fixes values of 1px or less that the spacing scale has no exact step for. A `-1px` margin is a common way to overlap borders, and on a scale without a 1px step the rule fixed `mt-[-1px]` to `-mt-xs`, turning -1px into -4px, and `mt-[0.5px]` to `mt-xs`; `eslint --fix` applied both and changed the layout. A negative margin of 1px or less (`mt-[-1px]`, `-mt-[1px]`, `marginTop: -1`) is left alone even when the scale has the step, since the overlap is deliberate. A positive value on the scale is still fixed (`py-[1px]` → `py-px`).
