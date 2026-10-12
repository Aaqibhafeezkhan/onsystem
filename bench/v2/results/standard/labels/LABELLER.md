# Labeller

## Who

An AI reviewer, Claude Opus 5.5, labelled this sample in a Claude Code cloud session on 2026-10-12. No person labelled or reviewed these sheets. The labeller's model family may overlap with the models under test, so they may share blind spots. Treat these labels as one labeller's sheets. LABELLING.md's second-labeller step still applies: have a person fill a copy of the sheets and compare the two.

## Blind

What the labeller read:

- `bench/v2/LABELLING.md`.
- Its inputs in `bench/v2/results/standard/labels/`: `labels.csv`, `files/S001`–`S060`, and later `findings.csv`. It read `sample.json`'s keys but did not use the file.
- The five repositories, shallow-cloned outside this repository at the commits in `repo_url`. It read each one's component folder, token file and a few existing screens. For shadcn/ui and dub it used a sparse checkout of the UI, app-component and Tailwind-config folders.
- Two `grep`s of `bench/v2/run.mjs` for `sample.json` / `labels.csv` / `findings.csv`, to find out which files the report reads. The matching lines name `key.json` but contain no models or arms.
- One `git log` of `bench/v2/LABELLING.md`, to check the commit identity. It showed a single commit, "bench: add the v2 harness, without results". That is not the results commit.

What it did not open, list or search: `results/standard/runs/`, `runs.csv`, `results.md`, `results.json`, `ledger.jsonl`, `run-info.json`, `results/canary/`, any transcripts, the git log or diffs of the results commit, PR #91 and its comments, the `bench-v2-*` release, and `key.json` (there is none, and it did not look for one). It saw nothing that says which model or arm wrote a file.

Order: every row of `labels.csv` was filled and committed (`bench: blind labels for the 60 sampled files`) before `findings.csv` was opened. The commit timestamps show this.

## Time

- About 10 minutes of wall-clock time, from creating the branch at 16:38 UTC to committing `labels.csv` at 16:48 UTC. Roughly 4 of those minutes went to cloning and reading the five design systems.
- About 1 more minute for `findings.csv`.
- About 15 minutes in total with this file.

An AI's wall-clock time is not comparable to a person's.

## Result in brief

- `labels.csv`: 60 rows.
  - `uses_design_system`: yes 58, partly 2 (S010, S036), no 0.
  - `would_merge`: yes 58, no 2 (S046, S060).
  - No file invents API, uses a native element where the design system has a component, or leaves an icon-only control unnamed.
  - Hardcoded values are in S060 (4) and in five dub files (20 in all).
- `findings.csv`: 22 findings, all `no-hardcoded-color`. TP 3, D 19, FP 0.

What this means for the scorers:

- **tsc**: the sample has no invented API, so these labels cannot check tsc's recall on it. The one file that does not compile (S046, `useRef()` without an initial value under the repo's @types/react 19) fails for a reason unrelated to the design system.
- **onsystem missed**:
  - `text-white` on S060's Button.
  - Every dub literal (S012, S018, S031, S034, S037). dub does have color tokens (below), even though the sample's description says none were found.
- **onsystem reported** the task-requested greens in S010, S011 and S053. Those are D by the guide's own example.

## Hardest rows

- **dub (S012, S018, S031, S034, S037).** `labels.csv` says dub has "no color tokens". It does. `packages/tailwind-config/themes.css` defines `bg-*`, `border-*` and `content-*` tokens, including `content-success`, `content-error` and `content-warning`, and `tailwind.config.ts` maps them to utilities (`text-content-subtle`, `bg-bg-default`, ...). Most map exactly onto palette shades: `content-subtle` = neutral-500, `content-emphasis` = neutral-900, `content-error` = red-600, `content-success` = green-600.
  - At the same time, @dub/ui's own sources use the raw palette for the same roles: Button `danger` is `bg-red-500`, Badge `green`/`red` are `bg-green-100`/`bg-red-100`, the Input error style is `text-red-500`, and the app's Callout is `bg-amber-50 text-amber-900`. The app also uses the palette about 7 times as often as the tokens (5,505 vs 795 class uses in `apps/web/ui`). In the folders these tasks target (`links/`, `analytics/`), the tokens are almost unused.
  - Rule 4 below records how this was resolved.
- **S060.** It copies the template's invite button, `bg-orange-500 hover:bg-orange-600 text-white`. saas-starter has no orange token. But the literal overrides the Button's own `primary` fill, and `primary` fits the role, so it is counted (rule 3).
- **S019, S052, S036, S028.** These use the `chart-2` token as a stand-in for green where the project has no success token. That is a token, not a literal, so nothing is counted. It is a semantic stretch, though: in chatbot, `chart-2` is teal in light mode. In S028 only a dot is `chart-2` and the Badge itself is gray. All four were accepted as meeting "a small green label".
- **S030, S035.** These use the dashboard's `StatusBadge` with `dot`. The label text stays neutral and the dot carries success, destructive or warning. The task asks for a label "green when up, red when down, yellow when degraded". This was accepted: it is openstatus's own pattern (`status-report-badge.tsx`).
- **S046.** Its design-system use is clean, but it does not type-check, so `would_merge` is no. Nothing in the four counts reflects this.
- **S010, S036.** The "Connected" pill is a hand-rolled span although chatbot has `components/ui/badge`, so `uses_design_system` is `partly`. chatbot has no Card component, so a hand-rolled card from tokens is fine.

## Rules as interpreted

These were decided once and applied to every file.

1. **One place per class.** Each color utility class is one place, including `hover:` and `dark:` variants: `bg-red-500 hover:bg-red-600` counts 2.
2. **No token for a status hue.** saas-starter, chatbot and shadcn/ui have no success or green token. Literal greens there are not counted and are noted as "no token for green". This applies whether or not the task asked for the color, as in S060's green success text. In `findings.csv`, such findings are D.
3. **Overriding a component's color.** A literal that replaces the token color of a design-system component's variant is counted, even when the project has no token of that hue, because the component's own token fits the role. Example: S060's orange on the default Button.
4. **dub.**
   - Counts: palette colors are counted in `hardcoded_values` wherever a dub token fits (rule from the guide; the tokens exist).
   - Merge: in dub, palette colors alone do not make `would_merge` no, because @dub/ui's own components use the palette for those roles.
   - Elsewhere: in the other four repositories, the component sources use tokens only, so any counted literal blocks the merge.
   - To compare against onsystem without this rule, subtract the dub counts. The notes list each one.
5. **Tokens.** A `chart-N` token used for a status color, and `shadow-[var(--shadow-card)]` (it references chatbot's own `--shadow-card`), are tokens, not literals.
6. **Native elements.** Only elements with a design-system counterpart count. `<form>` counts nowhere: no repository has a form-element component. `<fieldset>`/`<legend>` do not count in saas-starter, which has no fieldset component. A plain `<a>` for an external URL does not count.
7. **`uses_design_system`.**
   - **yes:** every element the project has a component for uses it.
   - **partly:** the core controls use the design system, but at least one element with a component is hand-rolled or native.
   - **no:** the core controls are hand-rolled or native.
8. **`would_merge`.** No if the file has any of these:
   - invented API;
   - a counted hardcoded value (except under rule 4);
   - a counted native element;
   - an unnamed icon-only control;
   - a missing piece of the task;
   - a failure to type-check.

   Presentational stubs, such as a Delete button with no handler, are accepted when the task describes only UI. Behavior the task asks for was checked: the 2-second "Copied" state, the success message replacing the form, the textarea after a vote, and the 24-hour condition. Prop-API style is not judged (redundant prop aliases, for example).
9. **Accessible names.** `sr-only` text counts, including the `sr-only` span that chatbot's `MessageAction` renders from `label`/`tooltip`. So do `aria-label` and `title`. A Radix tooltip alone does not. A non-focusable tooltip trigger, such as the `<span>` in S034, is not a control, so it is not counted.
10. **Missing modules.** An import from a module that does not exist would count once per import statement. This did not come up.
11. **Zero counts** are written as `0`.
12. **`sample.json`** was left unchanged: the harness writes it but the report does not read it.
