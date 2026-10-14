# Design tokens

onsystem reads design tokens from stylesheets, W3C DTCG 2025.10 files and a DESIGN.md, and `onsystem export` writes the tokens it found as a DTCG file or a DESIGN.md.

## Where tokens come from

| Source                 | Zero config reads                                                                                                                       | In `tokens` |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| CSS custom properties  | The stylesheet [zero config](configuration.md#zero-config) finds, else `app/globals.css` and the like, and the stylesheets these import | `*.css`     |
| W3C DTCG 2025.10       | `**/*.tokens.json`                                                                                                                      | `*.json`    |
| DESIGN.md front matter | `DESIGN.md` in the root, only when none of the files above exist                                                                        | `*.md`      |

`tokens` in the [config](configuration.md#config-file), or `--tokens`, replaces what zero config reads: a `DESIGN.md` listed there is read next to the other files. `inspect --explain` shows which files were read.

## DTCG 2025.10

DTCG files are read as the [Format Module 2025.10](https://www.designtokens.org/tr/2025.10/format/) defines them, and files written to older drafts still work:

- values as objects (`{ "colorSpace": "oklch", "components": [0.205, 0, 0] }`, `{ "value": 0.5, "unit": "rem" }`) or as strings (`"#ff0000"`, `"16px"`),
- `$type` inherited from groups, `$description`, and `$deprecated`,
- aliases (`"{color.brand.500}"`) and JSON Pointers (`{ "$ref": "#/color/brand/500" }`),
- `$root` tokens: the token a group has for itself. `color.accent.$root` is referenced as `{color.accent.$root}` and its custom property is `--color-accent`,
- groups that extend another: `"$extends": "{button}"` (or JSON Schema's `"$ref": "#/button"`) gives the group every token and property of `button`, and its own tokens replace the ones at the same path. Circular extension, a reference that resolves to nothing and `$extends` that names a token are reported by `inspect` and left out.

A token is named by its path (`color.brand.500`), unless onsystem's extension keeps another name for it, and its custom property is the path with dashes (`--color-brand-500`, or `--acme-color-brand-500` with `"prefix": "acme"`). Values for other themes can sit under `$extensions.modes` (`{ "dark": "#000" }`). A DTCG file and the CSS generated from it are merged by custom property.

### onsystem's extension

DTCG has no field for how code uses a token, so onsystem keeps it under `$extensions["com.github.dgesteves.onsystem"]`, which other tools ignore:

| Field      | What it holds                                                                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `name`     | The token's name where onsystem read it, when it is not its path: `destructive` for `color.destructive`. Findings use it                                                 |
| `cssVar`   | The custom property code reads: `--primary`. A token with the extension and no `cssVar` has none (a Tailwind `@theme inline` value)                                      |
| `tailwind` | The Tailwind theme variable that makes the class: `--color-primary` for `bg-primary`, `--spacing` for the spacing unit                                                   |
| `modes`    | Values in other themes, in the form of `$value`: `{ "dark": { "colorSpace": "oklch", "components": [0.922, 0, 0] } }`                                                    |
| `channels` | `"hsl"` when the custom property holds bare HSL channels (Tailwind v3), used as `hsl(var(--border))`; `"rgb"` for bare RGB channels, used as `rgb(var(--content-error))` |

## DESIGN.md

A [DESIGN.md](https://github.com/google-labs-code/design.md) describes a design system to agents: YAML front matter with tokens, then prose. onsystem reads the front matter's `colors`, `typography`, `rounded` and `spacing`, named by their path (`colors.primary`, as `{colors.primary}` references them). `components` holds styling for each component rather than tokens to pick from, and the prose is guidance for the agent, so neither is read. A spacing value without a unit (a column count) is no length, and stays out of the spacing scale.

A DESIGN.md does not say how code reads its tokens, so they have no class or custom property: `check` names the token a hardcoded color matches (`Matches token colors.primary`) without a fix, and snaps an off-scale length to the nearest step.

Hex colors must be quoted (`primary: "#1A1C1E"`): in YAML, `#` starts a comment, and `inspect` warns about the empty value.

## Export

`onsystem export` prints the project's tokens, or writes them to a file with `--out`:

```sh
npx -y onsystem export --format dtcg --out design.tokens.json
npx -y onsystem export --format design-md --out DESIGN.md
```

At a monorepo root, pass `--root` with the project to export.

### DTCG

One group per category (`color`, `spacing`, `radius`, `typography`, `shadow`, `other`), with the token's name inside it: `--primary` is `color.primary`, `--radius-md` is `radius.md`, and Tailwind's spacing unit is `spacing.$root`.

```json
{
  "color": {
    "destructive": {
      "$type": "color",
      "$value": { "colorSpace": "oklch", "components": [0.577, 0.245, 27.325] },
      "$description": "Errors and irreversible actions.",
      "$extensions": {
        "com.github.dgesteves.onsystem": {
          "name": "destructive",
          "cssVar": "--destructive",
          "tailwind": "--color-destructive",
          "modes": { "dark": { "colorSpace": "oklch", "components": [0.704, 0.191, 22.216] } }
        }
      }
    }
  }
}
```

- Colors are color objects in the color space they are written in; an 8-bit sRGB color also has its `hex`.
- Lengths are `{ value, unit }` in `px` or `rem`. A length computed from other tokens, such as `calc(var(--radius) - 4px)`, is written as its value in px.
- Typography tokens and shadows get their DTCG types (`fontFamily`, `fontWeight`, `dimension`, `number`, `typography`, `shadow`).
- An alias stays a reference: `--card: var(--background)` is `"{color.background}"`.
- What DTCG has no type for (`color-mix()`, a `var()` no token defines, lengths in `em` or `%`) is written as the CSS string, without `$type`.

Read back as a token source, the file gives the same tokens with the same names: the shadcn demo's `check` reports the same findings from its exported file as from `globals.css`, and names `destructive`, not `color.destructive`. The test suite runs this round trip.

### DESIGN.md

Front matter in the DESIGN.md schema (`version`, `name`, `colors`, `typography`, `rounded`, `spacing`), then a section per category in the format's order (Colors, Typography, Layout, Elevation & Depth, Shapes, and Other tokens), each with one sentence and a table of the tokens: their value, a column per mode, the class and custom property code uses, and the description. Values the schema cannot hold, such as a `var()` font family, are left out of the front matter and kept in the table. Aliases stay references (`"{colors.background}"`).

## Status colors

shadcn/ui's themes have `destructive` for errors, and no token for success, warning or info. A green "Active" badge, a yellow "Pending" one or a blue notice then has no token to use, and `no-hardcoded-color` warns that no token has the color's hue rather than name a gray or another hue's token, which would lose what the color says. Add the three to the theme, in the stylesheet that defines the others (`app/globals.css` in a shadcn/ui app):

```css title="app/globals.css"
:root {
  --success: oklch(0.527 0.154 150.069);
  --success-foreground: oklch(0.985 0 0);
  --warning: oklch(0.554 0.135 66.442);
  --warning-foreground: oklch(0.985 0 0);
  --info: oklch(0.546 0.245 262.881);
  --info-foreground: oklch(0.985 0 0);
}

.dark {
  --success: oklch(0.792 0.209 151.711);
  --success-foreground: oklch(0.145 0 0);
  --warning: oklch(0.852 0.199 91.936);
  --warning-foreground: oklch(0.145 0 0);
  --info: oklch(0.707 0.165 254.624);
  --info-foreground: oklch(0.145 0 0);
}

@theme inline {
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);
}
```

The values are Tailwind v4's green-700, yellow-700 and blue-600 in light mode, and green-400, yellow-400 and blue-400 in dark mode. Each has a contrast of at least 4.5:1 (WCAG AA for text) with shadcn/ui's page background and with its own foreground. Change the values to fit your brand, and keep the names: onsystem reads `success`, `warning` and `info` as status colors, as it reads `destructive`. Use them like the theme's other colors:

```tsx
<span className="bg-success/10 text-success">Active</span>
<span className="bg-warning text-warning-foreground">Pending</span>
<p className="border-info/50 text-info">Your invoice is on its way.</p>
```

With the tokens in place, `check` judges a green, yellow or blue against them as it judges a red against `destructive` ([how fixes are chosen](rules.md)). What it reports depends on how far the color's hue is from a status token's:

- **Within 8°:** an error that names the token. The shade the token copies gets the token as its fix (`text-green-700` becomes `text-success`, `dark:text-green-400` becomes `dark:text-success`). A shade next to it gets the token as a suggestion that is not applied (`text-green-800`), and the other shades get the token's name and no fix. All of Tailwind's greens are in this band, in light and dark mode.
- **From 8° to 15°:** an error that names the status token and offers no fix, such as `Nearest is warning (ΔE 0.132), a status color 9° away in hue`. When another token, such as a gray, is nearer, the warning stays instead.
- **Beyond 15°:** the warning stays.

Tailwind's colors change hue from shade to shade, yellow and amber the most (103° at yellow-100, 62° at yellow-800). With `warning` at yellow-700's 66°, `bg-yellow-600` and `bg-yellow-900` without `dark:` are 9° off: they become errors, which the Claude Code hook blocks, where the stock theme only warned. Shades yellow-50 to yellow-500 and yellow-950 keep the warning. In both cases, write the token: `text-warning` or `bg-warning` for the color, and the token with an opacity for a tint, `bg-warning/10`.
