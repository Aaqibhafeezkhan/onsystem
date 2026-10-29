# tailwind-v3

shadcn/ui on Tailwind v3, the way projects were set up before Tailwind v4: the tokens are bare HSL channels in `app/globals.css`, and `tailwind.config.ts` turns them into classes (`bg-primary` is `hsl(var(--primary))`). onsystem reads both, with no config of its own, and reads the Tailwind config as text without running it.

| Path                             | What it is                                                                                                                                                                             |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components.json`                | shadcn/ui's config, which names `tailwind.config.ts` and `app/globals.css`                                                                                                             |
| `components/ui/*.tsx`            | `Button`, `Badge`, `Card`, `Input`, built with `cva` and `forwardRef` as shadcn/ui wrote them for Tailwind v3 (adapted from [shadcn/ui](https://ui.shadcn.com), [MIT](LICENSE-shadcn)) |
| `app/globals.css`                | `:root` / `.dark` custom properties that hold HSL channels (`--muted-foreground: 240 3.8% 46.1%`)                                                                                      |
| `tailwind.config.ts`             | The `colors` and `borderRadius` that turn them into classes                                                                                                                            |
| `app/account/profile.tsx`        | UI written against the design system. `check` reports nothing.                                                                                                                         |
| `app/account/delete-account.tsx` | UI written without it. `check` reports 9 problems.                                                                                                                                     |

## Try it

Copy the folder, install it and run onsystem, with Node.js 20.19 or later:

```sh
npx degit dgesteves/onsystem/examples/tailwind-v3 onsystem-tailwind-v3
cd onsystem-tailwind-v3
npm install
npm run inspect   # what onsystem read: components, variants and the v3 tokens
npm run check     # check the pages (exits 1: delete-account.tsx has errors)
```

The scripts run the latest onsystem release with npx. `inspect` prints `config (defaults)` and finds the components through `components.json`. The fixes use the class names from `tailwind.config.ts`: `text-[#71717a]` is the color of `--muted-foreground`, so `check` suggests `text-muted-foreground`.

`no-hardcoded-spacing` does not run here: it needs a spacing scale, which onsystem reads from a Tailwind v4 stylesheet or from spacing tokens, and this project has neither. The other rules run as on Tailwind v4.

To have an agent write UI against it, set it up as the [shadcn-demo](https://github.com/dgesteves/onsystem/tree/main/examples/shadcn-demo#try-it) describes, from this folder.

## Working on onsystem

From the repository root, to run this checkout's build on the example:

```sh
pnpm install && pnpm build
cd examples/tailwind-v3
node ../../dist/cli.js inspect
node ../../dist/cli.js check .   # exits 1: delete-account.tsx has errors
```
