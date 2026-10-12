---
'onsystem': patch
---

Zero config now finds color tokens kept in a shared Tailwind config package, as Dub keeps them in `packages/tailwind-config`: it follows the `@import`s of the stylesheets it finds, by a path or into a workspace package (`@import "@acme/theme"` in Tailwind v4), reads presets that a package exposes only through `exports`, takes the stylesheets of a shared preset's package that set the colors its config maps, and reads bare RGB channels (`--content-error: 220 38 38`) as colors where the config reads them with `rgb()`.
