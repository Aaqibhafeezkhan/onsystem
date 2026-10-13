# Design-system packages

A design-system team owns one package that many apps use. Set onsystem up once, in that package, and every app that depends on it finds the design system with no config of its own: in the CLI, the MCP server, the ESLint plugin, the agent plugin's hook and the GitHub Action.

## Set up the package

Run `init` in the package's folder:

```sh
cd packages/ui
npx -y onsystem init
```

`init` treats the folder as a design-system package when zero config reads the components through the package's own `exports`, or when the package is named like one (`@acme/ui`, `@acme/design-system`, `acme-ui`), as apps look for it. There it writes:

- **`onsystem.config.json`**, from what zero config finds in the package, as in any project ([configuration](configuration.md#config-file)).
- **`"onsystem": "./onsystem.config.json"` in `package.json`**, which declares the config to the apps. When `package.json` lists `files`, the config is added to them, so it is published with the package.
- **`ONSYSTEM.md`**, for the apps' teams: how to see what their app finds, how to give their agents the plugin, the skill or the MCP server, and the CI check. An `ONSYSTEM.md` that is already there is kept, unless `--force` is passed.

Then it checks the package once and offers a baseline, as in any project. When `files` leaves out the component or token files (a package that publishes only `dist/`), `init` says so: apps that install the package from a registry will not find them. Commit what it wrote.

In a package that already has a config, `init` leaves it as it is (`--force` would replace it) and says to add the field by hand. The field names a JSON file in the package:

```json title="package.json"
{
  "name": "@acme/ui",
  "exports": { ".": "./dist/index.mjs" },
  "files": ["dist", "src", "onsystem.config.json"],
  "onsystem": "./onsystem.config.json"
}
```

## In the apps

An app without a config of its own looks through its `dependencies` and `devDependencies`. When one of them declares a config in its `package.json`, the app takes it on, whether the package is a workspace package or installed in `node_modules`. `inspect` says where the config comes from:

```text
config   ../../packages/ui/onsystem.config.json (declared by @acme/ui)
detected workspace package @acme/ui
```

`inspect --explain` names the package first among what zero config looked at.

- **Paths come from the package.** `components`, `exclude`, `tokens` and `docs` are relative to the package's folder, wherever the app finds it: `../../packages/ui`, or `node_modules/@acme/ui`. They stay in the package when it is installed, and in the workspace when it is a workspace package, so `../tokens/theme.css` in a sibling package works. A path that leaves them is ignored, with a warning.
- **`exclude` adds to the app's defaults.** The app still leaves out `node_modules`, `.d.ts` files, tests and stories, and the package's patterns are added. The package's components are found with its own list, as in the package.
- **Components.** When the config leaves `components` to zero config, the app reads the package as zero config reads a design-system package (step 3 of [zero config](configuration.md#zero-config)), whatever the package's name, and also when it is installed. When the config sets `components`, they are imported by `importPath` when it is set, else by the package's `exports`.
- **What applies to the app:** the rules' severities and options, `elements`, `importPath` and `libraries`.
- **What stays with the package:** `tsconfig` (the app keeps its own), `overrides` (their globs are about the package's files) and `includeDesignSystem`.
- **A missing file is not an error in the app.** A token file the config names that is not there matches nothing, since a published package ships only some of its files. In the package itself it is an error, so a typo is caught there.

The config a project reads is the first of these that it has:

1. Its own config file (`onsystem.config.json`, or another [config file](configuration.md#config-file) name), or one its own `package.json` names in `"onsystem"`.
2. The config a dependency declares. When several do, the one the app's code imports most.
3. At a [monorepo root](configuration.md#monorepo-roots), the root's config.
4. Zero config.

`check` from a monorepo root and from the app's folder read the same config. The root itself reads no dependency's config: each project in it finds its own.

The declared config is read as JSON and never run, so a dependency cannot make an app run its code. A field that names a `.js` or `.ts` config, a file outside the package, or a file that does not exist is an error that names the package when it is a workspace package, which its team can fix. In a package installed in `node_modules`, the declaration is skipped with a warning, and the app is read as if the package declared none. An app with a config of its own reads that instead.

`check` and `inspect` print each warning once, on stderr (`::warning` with `--format github`). The MCP server logs it once, and the ESLint plugin writes it once to stderr.

## Installed from a registry

An app that installs the package reads what was published. Publish the files the config names: the config, the token stylesheets or DTCG files, and the component sources (`src/`) for the components to be known. From a package that publishes only compiled `dist/`, apps get the tokens and the rules, but not the components: onsystem reads components from source, except for the [published libraries](configuration.md#published-libraries-mui) it knows.

## On real code

The [corpus](../corpus) runs `init --yes` in Dub's `@dub/ui`, a workspace package that Dub also publishes, then checks Dub's app, which has no config of its own (the `dub-web-package` run). The app takes on the config `@dub/ui` declares, and reports what zero config reports, file for file.
