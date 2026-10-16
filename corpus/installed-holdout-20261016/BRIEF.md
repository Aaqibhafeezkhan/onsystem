# Labelling brief: installed-holdout-20261016

You label 109 findings that onsystem reported in five public repositories with their dependencies installed. Each label says whether the finding is right. Your labels give each rule's false-positive rate, so they must be blind: judge every finding from the code alone, without any other label, rate or opinion about onsystem.

Who labels: a reviewer who did not draw this sample and has not worked on onsystem's rules, its corpus or its samples. When the reviewer is an AI, its labels are published as "blind labels by an AI reviewer", never as labels by a person, and `LABELLER.md` names the model by its id.

## Your input

`sample-unlabelled.json` in this folder: the findings H001 to H109, in a shuffled order. For each one it gives:

- where it is: the repository, its pinned commit, a permalink, the file, line and column;
- the rule id;
- the message, exactly as onsystem printed it;
- the matched source text;
- 15 lines of code from the pinned commit, with the reported line marked `>`.

These findings come from `onsystem check` run with each repository's dependencies installed from its own lockfile, so onsystem saw the TypeScript types of the components. Judge them the same way. When a finding says a component takes no such prop or variant, read the props the component's types declare, including what it spreads from a native element or a library primitive.

## What you may read

- This brief and `sample-unlabelled.json`. Nothing else in this folder.
- onsystem's `docs/rules.md` on `main`: only the introduction, the rules table and "How fixes are chosen".
- The five repositories, read-only, at the commits the sample pins: source tarballs from codeload.github.com or the GitHub API. Read the finding's whole file, the project's theme and CSS variables (Tailwind config, `globals.css` and the like) and its components.
- The type declarations of a package a finding depends on, at the version the repository's lockfile pins, from that version's npm tarball (`.d.ts` files only).

Nothing from the repositories or the packages is installed, built or run.

## What you must not open

- In this folder: `sample-key.json` (severity, fixes and weights), `allocation.json` (how many findings each rule has), `README.md`, and any `sample-labelled.json` or `LABELLER.md` from an earlier attempt.
- In onsystem: `corpus/labels.json`, `corpus/snapshot.json`, `corpus/snapshot-installed.json`, anything in `corpus/fp-sample-20261016`, any other sample, the README's paragraph on false positives, the website's numbers, the source in `src/`, and issues or pull requests about false positives.
- The web beyond the sources above: no search.
- Credential files and tokens of any kind. Write nothing anywhere except the two files below.

## How to label

Use the definitions of the earlier blind sample, so the rates compare:

- **TP**: a maintainer who cares about that project's design system would want the finding flagged, and the message's claim is correct.
- **FP**: the code is fine as written, or the message's claim is false.
- **debatable**: reasonable maintainers would disagree, or the answer depends on intent you cannot see.

Record for each finding:

- `label`: `TP`, `FP` or `debatable`.
- `own_ds_value`: `true` when the flagged value appears deliberately in the project's design-system package, theme or CSS variables; `false` when it does not; `null` for rules that are not about a value (component, prop, variant, accessible name).
- `replacement_wrong`: `null` when the message names no replacement; `true` only when the replacement it names is factually wrong (a component that does not fit, a token with another value); `false` otherwise.
- `reason`: one or two sentences with the evidence, citing files and lines.
- `looked_at`: the permalinks you read for it.

Settle on working rules for cases that repeat, apply them to every finding, and write them down.

## What to write

1. `sample-labelled.json` in this folder: `sample-unlabelled.json` with the same findings in the same order, each with the five fields above added and nothing else changed, and a `$comment` that says the labels were added and by which reviewer.
2. `LABELLER.md` in this folder: who labelled (for an AI, its model id), the date, what you read and what you did not open, your working rules, how long it took, and the findings you found hard.

Compute no rates or statistics, and do not add the labels to `corpus/labels.json`: that file keeps the plain corpus's blind sample, which the README quotes.

## After the labels

Whoever opens the pull request with the two files runs `pnpm build`, then `pnpm corpus --installed`. It prints, for each rule, the share of false positives with its 95% Wilson interval, and how many of the holdout's findings are still reported; the table goes in the pull request. The pull request changes nothing else in this folder, says that the labels are blind labels by an AI reviewer when they are, and names the model.
