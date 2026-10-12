# Labelling guide

The blind labels are the benchmark's check on its two automatic scorers. `tsc` sees invented components, props and variants but not hardcoded values; onsystem sees both but is the tool under test. A labeller reading a sample of the generated files, a person or an AI reviewer (each run's `labels/LABELLER.md` says which), says what each scorer missed or got wrong.

## What you get

`node bench/v2/run.mjs labels --out <results>` draws a stratified random sample: by default 2 files per model and arm (60 files for the `standard` matrix), shuffled, each under a blind id (`S001`, `S002`, ...). In `<results>/labels/`:

- `files/<id>/` holds the generated file.
- `labels.csv` has one row per file: the repository and its commit, a description of its design system, the task, and empty columns to fill.
- `findings.csv` has one row per onsystem finding on those files, with an empty `verdict` column.
- `key.json` maps each id to its model and arm.

Keep the sample blind: do not open `key.json`, `runs/`, `transcripts/` or the results tables until both sheets are done. Do `labels.csv` for every file before you open `findings.csv`, so onsystem's findings do not shape your own reading.

## Step 1: `labels.csv`, one row per file

Open the repository at the commit in `repo_url` to see its design system: its component folder (`components/ui`, `registry/new-york-v4/ui`, `packages/ui`), its token file (`globals.css` or the theme), and how existing screens use them. Read the task, then the file.

| Column               | Fill in                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uses_design_system` | `yes`, `partly` or `no`: does the file build its UI from the project's own components where the project has one for the job?                                                                                                                                                                                                                                                                                                                                  |
| `invented_api`       | How many components, props, variant values or parts the file uses that the design system does not have (check the component's source). An import of a component that does not exist counts once.                                                                                                                                                                                                                                                              |
| `hardcoded_values`   | How many colors, spacing, radii or font sizes are written as literal values where the project has a token that fits: hex, `rgb()`, `oklch()`, arbitrary values such as `p-[13px]`, or Tailwind's default palette such as `bg-red-500` when the project has `destructive`. When the task asks for a color the project has no token for (a green "Connected" label in a theme without a success color), do not count it; write "no token for green" in `notes`. |
| `native_elements`    | How many native elements (`<button>`, `<input>`, `<select>`, `<textarea>`, `<label>`, `<dialog>`, ...) the file uses where the design system has a component for that job.                                                                                                                                                                                                                                                                                    |
| `unnamed_controls`   | How many icon-only buttons or links have no accessible name (no text, `aria-label`, `aria-labelledby` or `title`).                                                                                                                                                                                                                                                                                                                                            |
| `would_merge`        | `yes` or `no`: would you approve this file as it is, for this project, in a code review that cares about the design system and about the file doing what the task asks? Ignore formatting and anything a formatter would fix.                                                                                                                                                                                                                                 |
| `notes`              | Anything that explains a count or the verdict.                                                                                                                                                                                                                                                                                                                                                                                                                |

Counts are of distinct places in the code: the same wrong class on three elements counts three times; a component used ten times with one invented prop each time counts ten. Leave a count empty only when it is 0; the report reads an empty count as 0. A row counts once `would_merge` is filled.

## Step 2: `findings.csv`, one row per onsystem finding

Each row is one finding onsystem reported on a sampled file: its rule, line, the code it points at (`source`) and its message. Set `verdict` to:

- `TP`: the code breaks the project's design system as described in step 1, and the message says what is wrong.
- `FP`: the code is fine for this project; onsystem is wrong.
- `D`: debatable. For example, a literal color for a color the task asked for and the project has no token for, or a native element where the design-system component would not fit.

Use `notes` for the reason when it is not obvious. These are the same verdicts as `corpus/labels.json`.

## Then

Run `node bench/v2/run.mjs report --out <results>`. The tables gain a section with, per arm: the share of files you would merge, the share with no violations, violations per file, how often you and onsystem agreed on whether a file had a problem, and the share of onsystem's findings you judged correct (debatable ones left out). A second labeller can fill a copy of the sheets on the same sample; compare the two before replacing `labels.csv` with the agreed version.
