---
'onsystem': patch
---

Zero config finds React Aria's Tailwind starter, or another flat folder of PascalCase components that wrap a primitives library (React Aria, Radix, Base UI, Headless UI, Ark UI), when it is copied into an app's `src/components/`, `components/` or `app/components/`, next to the app's `App.tsx`. Before, `inspect` found no component files, `check` checked the components as app code and said "No design-system components found: the component rules did not run", and `init --yes` stopped with "zero config found no design system". The same guard as for a flat `src/` applies: at least five such files, four in five of which import the library, so a folder of the app's own features is left alone. `inspect` says `detected src/components/ (7 components wrapping react-aria-components)`, the app's own `components/ui` is still read, and `init` writes the glob it found.
