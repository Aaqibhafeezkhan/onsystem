# shadcn-demo

A small shadcn/ui-style design system to try `onsystem` on:

| Path                           | What it is                                                                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components.json`              | shadcn/ui's config, as `npx shadcn init` writes it                                                                                                |
| `components/ui/*.tsx`          | `Button`, `Badge`, `Card`, `Dialog`, `Input`, built with `cva` and Radix (adapted from [shadcn/ui](https://ui.shadcn.com), [MIT](LICENSE-shadcn)) |
| `app/globals.css`              | Tailwind v4 tokens: `:root` / `.dark` custom properties mapped through `@theme inline`                                                            |
| `docs/components/*.md`         | Usage guidelines and examples, one file per component                                                                                             |
| `app/settings/members.tsx`     | UI written against the design system. `check` reports nothing.                                                                                    |
| `app/settings/danger-zone.tsx` | UI written without it. `check` reports 11 problems, at least one for each of onsystem's 8 rules.                                                  |

There is no onsystem config: like any shadcn/ui project, it needs none. `inspect` prints `config (defaults)` and finds the components through `components.json`, and the docs in `docs/components/`, where it looks by default.

## Try it

Copy the folder, install it and run onsystem, with Node.js 20.19 or later:

```sh
npx degit dgesteves/onsystem/examples/shadcn-demo onsystem-demo
cd onsystem-demo
npm install
npm run inspect   # what onsystem read: components, variants and tokens
npm run check     # check the pages (exits 1: danger-zone.tsx has errors)
```

The scripts run the latest onsystem release with npx. Install first: onsystem reads props from the components' types, and `Dialog`'s come from Radix.

To have an agent write UI against it, open the folder in Claude Code and install the plugin, which brings the MCP server and checks each UI file Claude writes:

```text
/plugin marketplace add dgesteves/onsystem
/plugin install onsystem@dgesteves
```

Or, without the plugin, add only the MCP server, from this folder:

```sh
claude mcp add onsystem -- npx -y onsystem
```

Then ask for some UI, such as _"Add a billing card to the settings page."_ [Set up your agent](https://onsystem.vercel.app/docs/clients) has the config for other clients.

## Working on onsystem

From the repository root, to run this checkout's build on the demo:

```sh
pnpm install && pnpm build
pnpm demo:inspect   # what the server extracted
pnpm demo:check     # lint app/**/*.tsx (exits 1: danger-zone.tsx has errors)
```

To point an agent at this checkout's build:

```sh
claude mcp add onsystem -- node /absolute/path/to/dist/cli.js --root /absolute/path/to/examples/shadcn-demo
```
