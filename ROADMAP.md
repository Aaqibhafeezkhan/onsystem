# Roadmap

onsystem is built in the open, and this page lists what is in review, what comes next, what waits for your feedback and what is not planned. To weigh in, add a reaction or a comment on the linked issue: what people ask for there moves up.

## Merged, in the next release

- Token readers: `hsl(var(--x))` theme colors, stylesheet import order, Tailwind v3's default radius scale, and an app's own stylesheet next to a shared one ([#201](https://github.com/dgesteves/onsystem/pull/201))
- Website, already live: shareable playground links, no layout shift when the fonts load, and a larger Ask button on phones ([#200](https://github.com/dgesteves/onsystem/pull/200))

## In review

Open pull requests. Each one ships in the next release once it is reviewed and merged.

- Security hardening: a per-user cache folder, repository text quoted as text in MCP answers, a color rule that stays fast on long class strings, and exit code 2 for crashes ([#199](https://github.com/dgesteves/onsystem/pull/199))
- Layered configs: an app's config builds on its design-system package's, and a monorepo root's rules apply over both ([#202](https://github.com/dgesteves/onsystem/pull/202))
- A compatibility section in the README: Node.js, operating systems, ESLint, TypeScript, React, Tailwind, shadcn/ui bases and MCP clients ([#203](https://github.com/dgesteves/onsystem/pull/203))
- Support tiers for every client setup, and no new integrations for four weeks after launch unless someone asks for one ([#204](https://github.com/dgesteves/onsystem/pull/204))

## Next

Grouped by area, in the planned order within each group.

**Design systems and tokens**

- Package mode keeps every rule on: spacing from a Tailwind theme partial, and an error for an import from a subpath that does not exist [#205](https://github.com/dgesteves/onsystem/issues/205)
- Chakra UI, Mantine and React Aria Components read from their type declarations with no config, as MUI is today [#206](https://github.com/dgesteves/onsystem/issues/206)
- Exported tokens read back the same: the DESIGN.md spacing unit, no duplicate DTCG tokens, valid typography aliases [#207](https://github.com/dgesteves/onsystem/issues/207)

**MCP server, ESLint plugin and hook**

- The MCP server recovers from a config error once the config is fixed, and picks up edits to JS and TS configs [#208](https://github.com/dgesteves/onsystem/issues/208)
- The ESLint plugin: no wait in the editor while it refreshes, rule options such as `allow`, and suppression warnings [#209](https://github.com/dgesteves/onsystem/issues/209)
- A faster Claude Code hook: Node's compile cache, cached project detection and a cached npx path [#210](https://github.com/dgesteves/onsystem/issues/210)
- Clearer text: finding messages, MCP answers for Base UI and registry components, and CLI flag edge cases [#211](https://github.com/dgesteves/onsystem/issues/211)
- A written public API (what semver covers), then smaller config, detection and server modules [#212](https://github.com/dgesteves/onsystem/issues/212)

**New integrations** (after the four-week freeze, or sooner when someone asks in the issue)

- Edit-time hooks for Cursor, GitHub Copilot CLI, VS Code and Gemini CLI [#213](https://github.com/dgesteves/onsystem/issues/213)
- A Claude Desktop extension (`.mcpb`) and an `eslint-plugin-onsystem` alias for configs that expect that name [#214](https://github.com/dgesteves/onsystem/issues/214)

**Docs and examples**

- Package mode first: a guide for design-system teams, a short video and a design-system monorepo example [#215](https://github.com/dgesteves/onsystem/issues/215)
- Examples: a demo that runs with zero config, Tailwind v3 and React Aria apps, and a typecheck in CI [#216](https://github.com/dgesteves/onsystem/issues/216)
- A docs reference: every CLI flag with a test that keeps it in sync, a supported-stack table, measured speed and size [#217](https://github.com/dgesteves/onsystem/issues/217)
- Pages that still disagree with the code: the setup prompt, the FAQ on the hook, the Copilot install, the benchmark's scorer count [#218](https://github.com/dgesteves/onsystem/issues/218)
- An "Open in playground" link on each rule page's examples (`/rules/<id>`): it needs the playground's link code (`linkHash`) moved into `site/lib/`

**Measurement**

- A fresh false-positive sample on the current corpus, and per-rule rates with dependencies installed [#219](https://github.com/dgesteves/onsystem/issues/219)
- Benchmark v2.1: a rerun on the released version that counts token roles [#55](https://github.com/dgesteves/onsystem/issues/55)

**Good first issues**

- `get_component` answers "Available: ." in a project with no components [#220](https://github.com/dgesteves/onsystem/issues/220)
- `check --max-warnings` fails a GitHub Actions step without saying why [#221](https://github.com/dgesteves/onsystem/issues/221)
- `--help` leaves out `.mts` configs, DESIGN.md tokens and `inspect --format json` [#222](https://github.com/dgesteves/onsystem/issues/222)
- `search_components` misses everyday words for Sheet, Accordion, Textarea, Slider, Calendar and Command [#223](https://github.com/dgesteves/onsystem/issues/223)

Comment on one before you start. [CONTRIBUTING.md](CONTRIBUTING.md) has the checks to run.

## Waiting for your feedback

These get built when there is a signal for them. Each issue says what would move it.

- A shorter home page, cut to what visitors read: needs launch traffic on where people stop, and your comments on what you came for [#224](https://github.com/dgesteves/onsystem/issues/224)
- @shadcn/lint in the hook and the Action, a DESIGN.md-only recipe, a GitHub MCP registry listing: each waits for a team that would use it [#225](https://github.com/dgesteves/onsystem/issues/225)

## Not planned

- `--prefer-offline` in the plugins' MCP server configs: with a version range, npm's cached metadata fails once a new version is out. The hook already runs from npm's cache with an exact version.
- A wider span for icon-button findings: it would re-key every baselined finding and reopen code-scanning alerts. [Make it a required check](docs/required-check.md) says which removals the changed-lines gate catches.
- An OpenSSF Scorecard badge for now: a badge today would show a low score, and the hardening it measures comes first.
- A race with @shadcn/lint on token rules: onsystem checks components, props and variants at the edit and the pull request, and runs alongside it.
- A shared brand or more renames across onsystem, ondocs and signoff-ui: the current names, listings and redirects stay.

What shipped is in the [changelog](CHANGELOG.md). Bugs go in [issues](https://github.com/dgesteves/onsystem/issues/new/choose); questions, ideas and setups go in [Discussions](https://github.com/dgesteves/onsystem/discussions).
