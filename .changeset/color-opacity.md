---
'onsystem': patch
---

`no-hardcoded-color` counts opacity when it matches a color to a token. It used to compare only lightness, chroma and hue, so a translucent color matched its opaque token and the fix made it opaque: `bg-[#e7000b33]` (the red at 20%) became `bg-destructive`, `rgba(255, 255, 255, 0)` became the opaque background, and in shadcn/ui's dark theme `dark:border-[#ffffff]` became `dark:border-border`, which is 10% white. Now a token more than 0.02 apart in opacity is never a fix, and the message gives both opacities (`destructive is opaque, and this color is 20% opaque.`), so the color can keep its opacity with a modifier (`bg-destructive/20`). Colors and tokens of the same opacity still match (`dark:border-[rgba(255,255,255,0.1)]` → `dark:border-border`, and 15% white → `dark:border-input`), an opacity modifier still stays on the token (`bg-[#ffffff]/40` → `bg-background/40`), and "same value as" lists only tokens of the same opacity.
