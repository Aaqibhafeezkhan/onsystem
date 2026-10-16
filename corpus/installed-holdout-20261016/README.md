# Installed-types holdout, seed 20261016

A seeded random draw of 109 of the 12,945 distinct findings that the installed-types corpus reported on onsystem `7ca0f69` (5 repositories pinned by commit, 11 runs, each repository installed from its own lockfile with scripts off). It takes up to 30 findings of each rule, and every finding of a rule that has fewer, so each rule gets a false-positive rate of its own. It is not labelled yet: [BRIEF.md](BRIEF.md) is the labelling brief.

## Why a second sample

The corpus job checks its repositories without their dependencies, apart from MUI for the two MUI apps. Its blind sample ([corpus/fp-sample-20261016](../fp-sample-20261016)) therefore measures onsystem without types. Users and the Claude Code hook run onsystem with `node_modules` installed, and types decide which props and variants a component takes and whether a native element's attributes fit a design-system component. `pnpm corpus --installed` checks the five repositories that bench/v2 installs (`bench/v2/config/repos.json`) with their dependencies, and prints what installing changes against the same runs without them. This holdout gives the false-positive rate of each rule in that setting.

## Frozen

- The draw is never redone or edited. Once its findings change (a fix takes one out, or the population it was drawn from moves on), its rates no longer hold: draw a fresh holdout with a new seed into a new folder.
- It is a holdout: its labels measure the rules, and are not used to find false positives to fix. Work on a rule uses `corpus/labels.json` and `pnpm corpus sample`.
- Its labels stay in this folder, in `sample-labelled.json`. `corpus/labels.json` keeps the plain corpus's labels.

## Allocation (n = 109, seed 20261016)

From [allocation.json](allocation.json):

| Rule                           | Population | Sampled | Weight |
| ------------------------------ | ---------: | ------: | -----: |
| no-hardcoded-color             |     11,752 |      30 | 391.73 |
| prefer-design-system-component |      1,089 |      30 |  36.30 |
| icon-button-accessible-name    |         85 |      30 |   2.83 |
| no-hardcoded-radius            |          8 |       8 |   1.00 |
| no-hardcoded-spacing           |          7 |       7 |   1.00 |
| no-unknown-prop                |          4 |       4 |   1.00 |
| **Total**                      | **12,945** | **109** |        |

The population counts distinct findings as the README counts the plain corpus's: `dub-web-configured-installed`, which re-checks dub-web's files with a config, is left out, and a run from a monorepo root (`dub-root-installed`, `openstatus-root-installed`) counts only what it adds outside the folders its project runs check. Neither root run adds a finding. `no-unknown-variant` and `no-unknown-component` reported nothing.

Method (`drawHoldout` in [scripts/corpus-lib.ts](../../scripts/corpus-lib.ts)):

1. Each rule gets min(30, its population) slots.
2. One mulberry32 generator seeded with 20261016, the one `random()` in scripts/corpus-lib.ts is, makes every draw. Rules are taken in id order, and each rule's findings in the order of their ids (`repository:file:line:column:rule`). Each draw takes index floor(next() × remaining) out of that list, the corpus `sample` command's step.
3. The 109 picks are shuffled with the same generator (Fisher-Yates) and numbered H001 to H109, so the labeller does not see them grouped by rule.
4. A rule's weight, population / sampled, is how many findings each of its sampled findings stands for.

Sampled findings by repository: dub 81 (dub-web 78, dub-ui 3), openstatus 13 (dashboard 11, web 2), shadcn-ui 9, chatbot 5, saas-starter 1.

## Files

- `sample-unlabelled.json`: the labeller's only input. For each finding, where it is (repository, pinned commit, permalink, file, line and column), its rule, its message exactly as onsystem printed it, the matched source text, and 15 lines of code from the pinned commit. No suggested fix, no severity, no label. `run`, `occurrence` and `fingerprint` are the corpus keys.
- `sample-key.json`: severity, whether onsystem offers a fix and its suggestion, and the rule's population and weight, for each finding. Not for the labeller.
- `allocation.json`: the allocation above, the onsystem commit and version, and `populationSha256`, the sha256 of every distinct finding's id, sorted, one per line.
- [BRIEF.md](BRIEF.md): what the labeller reads, must not open, and writes.
- To come from the labeller: `sample-labelled.json` and `LABELLER.md`. `pnpm corpus --installed` then prints each rule's false-positive rate with its 95% Wilson interval.

## Commands that rebuild it

`$W` is a working folder outside any project. The draw needs `scripts/corpus.mjs` from the change that added this folder, and `src/` as it was at `7ca0f69`. Node v24.18.0, pnpm 11.6.0.

```sh
cd onsystem
pnpm install --frozen-lockfile
pnpm build
# Fetches the five repositories at their pinned commits into $W/corpus/.installed and installs
# each from its own lockfile (pnpm --frozen-lockfile --ignore-scripts --ignore-pnpmfile).
node scripts/corpus.mjs fetch --installed --dir "$W/corpus"
# Checks every run, requires the counts to match corpus/snapshot-installed.json, then draws.
node scripts/corpus.mjs draw --installed --seed 20261016 --per-rule 30 --out "$W/redraw" --dir "$W/corpus"
```

A second draw into another folder on the same day wrote byte-identical `sample-unlabelled.json`, `sample-key.json` and `allocation.json` (its `drawn` date and `onsystem.commit` change with the day and the checkout).
