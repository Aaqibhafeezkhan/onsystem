# react-aria

An app with React Aria Components in `src/components/`, next to its `src/App.tsx`, where they land when you copy React Aria's [Tailwind starter](https://react-aria.adobe.com/getting-started) into an app. onsystem finds them with no config: a flat folder of PascalCase components that wrap `react-aria-components`. The components are written for this example in the starter's style (`tailwind-variants`, `composeRenderProps`).

| Path                   | What it is                                                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/*.tsx` | `Button`, `Checkbox`, `Switch`, `TextField`, `Modal`, `Dialog` with its `DialogTitle`, and the field parts in `Field.tsx` (`Label`, `Input`, `Description`, `FieldError`) |
| `src/index.css`        | Tailwind v4 tokens in `@theme`: `bg-primary`, `text-muted-foreground`, `border-border`                                                                                    |
| `src/App.tsx`          | UI written against the design system. `check` reports nothing.                                                                                                            |
| `src/InviteForm.tsx`   | UI written without it, with HTML's prop names where React Aria has its own (`checked` for `isSelected`). `check` reports 7 problems.                                      |

## Try it

Copy the folder, install it and run onsystem, with Node.js 20.19 or later:

```sh
npx degit dgesteves/onsystem/examples/react-aria onsystem-react-aria
cd onsystem-react-aria
npm install
npm run inspect   # what onsystem read: components, props and tokens
npm run check     # check the pages (exits 1: InviteForm.tsx has errors)
```

The scripts run the latest onsystem release with npx. `inspect` prints `config (defaults)` and `detected src/components/ (7 components wrapping react-aria-components)`. Install first: the props come from React Aria's types, so without them `check` cannot tell that `checked` should be `isSelected`.

To have an agent write UI against it, set it up as the [shadcn-demo](https://github.com/dgesteves/onsystem/tree/main/examples/shadcn-demo#try-it) describes, from this folder.

## Working on onsystem

From the repository root, to run this checkout's build on the example:

```sh
pnpm install && pnpm build
cd examples/react-aria
node ../../dist/cli.js inspect
node ../../dist/cli.js check .   # exits 1: InviteForm.tsx has errors
```
