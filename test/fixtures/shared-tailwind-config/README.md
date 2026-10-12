A monorepo shaped like Dub's: the color tokens live in a shared package, not in the apps.

- `packages/tailwind-config`: a Tailwind v3 config whose colors read custom properties
  (`rgb(var(--content-error) / <alpha-value>)`), and `themes.css`, which sets them as RGB
  channels for the light and dark themes.
- `packages/theme`: a Tailwind v4 theme, imported as a package from an app's stylesheet.
- `packages/ui`: the components.

Each app reaches the tokens another way:

- `apps/web` (Dub's own setup): a preset spread from `@acme/tailwind-config/tailwind.config`,
  and `styles/globals.css` imports `themes.css` by a relative path.
- `apps/preset`: `presets: [require("@acme/tailwind-config")]`, which only the package's
  `exports` resolve; the stylesheet is imported from code, not from CSS.
- `apps/theme`: the theme object the package exports, as the config's `theme`.
- `apps/v4`: Tailwind v4, `@import "@acme/theme"` in `app/globals.css`.
