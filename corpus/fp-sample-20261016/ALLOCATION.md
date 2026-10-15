# The draw: population and allocation

Drawn 2026-10-15 for a fresh false-positive sample. This file describes how the sample was drawn. It has no labels and no rates: [README.md](README.md) has those.

- onsystem main: `cb495c00c0b4e433547a03c9178832fda6dab1bb` (Merge pull request #158, 2026-10-15 17:42 +0100; still the tip of main when the draw finished). package.json and snapshot version 0.6.0.
- Corpus: 12 repositories pinned by commit in corpus/repos.json, 24 runs. Every checkout's HEAD equals its pinned SHA.
- `node scripts/corpus.mjs` on this main printed "Counts match corpus/snapshot.json." and exited 0. Every monorepo-root run reported what its project runs report, file for file.
- Population: 14,539 distinct findings, the same number the README states, counted the way README.md and test/readme.test.ts count them. Every run is included except dub-web-configured, which has its own config and re-checks dub-web's files. A run with `sameAs` (documenso-root, dub-root, openstatus-root, calcom-root, dub-web-package) adds only its findings outside the `sameAs` folders. The per-run and per-rule counts from the raw results equal corpus/snapshot.json (`rules` and `added`) for all 24 runs. The ids (`repo:file:line:column:rule`) are unique.

## Allocation (n = 80, seed 20261016)

| Rule                           | Population |  Share | Proportional quota | Sampled | Floor applied |
| ------------------------------ | ---------: | -----: | -----------------: | ------: | ------------- |
| no-hardcoded-color             |     12,422 | 85.44% |             68.351 |      65 |               |
| prefer-design-system-component |      1,462 | 10.06% |              8.045 |       7 |               |
| icon-button-accessible-name    |        530 |  3.65% |              2.916 |       3 |               |
| no-hardcoded-radius            |         57 |  0.39% |              0.314 |       1 | yes           |
| no-unknown-prop                |         41 |  0.28% |              0.226 |       1 | yes           |
| no-unknown-variant             |         14 |  0.10% |              0.077 |       1 | yes           |
| no-hardcoded-spacing           |         12 |  0.08% |              0.066 |       1 | yes           |
| no-unknown-component           |          1 |  0.01% |              0.006 |       1 | yes           |
| **Total**                      | **14,539** |   100% |             80.000 |  **80** |               |

Method:

1. Each rule's quota is proportional to its share of the population, with a floor of 1. Any rule whose quota n × N_rule / N is below 1 gets 1 slot. The remaining slots (75) are split proportionally among the other rules, repeating until no rule falls below the floor. Here that split gives color 64.635, prefer-component 7.607 and icon-button 2.758.
2. Each rule then gets the whole-number part of its share. The 2 slots left over go to the largest remainders (Hamilton's method): icon-button (0.758) and color (0.635).
3. One mulberry32 generator seeded with 20261016 does all the random draws. It is the generator that scripts/corpus-lib.ts `random()` uses.
4. Rules are taken in id order. Within each rule, findings are sorted by id. The draw then takes index floor(next() × remaining) out of that list, k times, which is the same step the corpus `sample` command uses.
5. The 80 picks are shuffled with the same generator (Fisher-Yates) and numbered S01 to S80, so they are not grouped by rule.
6. Each rule's weight for the population-weighted rate is N_rule / n_rule. allocation.json and sample-key.json list it.

Sampled findings by repository: dub 58 (dub-web 57, dub-ui 1), cal.com 6, midday 5, flowise 4, documenso 4, chatbot 2, saas-starter 1.

## Files

- `sample-unlabelled.json` (not kept here: it is `sample-labelled.json` without the five label fields) was the labeller's only input. For each finding it gives:
  - where it is: id, sample number, repository and its URL, pinned SHA and a permalink, file, line, column and end position;
  - the rule id;
  - the finding's message, exactly as onsystem printed it;
  - the matched source text;
  - about 15 lines of code from the pinned checkout (7 above, 7 below), with the reported line marked `>`. A context line over 400 characters is cut and marked as cut (none are in this sample).

  It leaves out onsystem's separate `suggestion` field and its fix edits, plus severity and labels. The messages are verbatim, so many of them name the replacement token themselves (for example "→ `bg-bg-inverted`"). `run`, `occurrence` and `fingerprint` are the corpus keys of [corpus/labels.json](../labels.json).

- `sample-key.json`: severity, whether onsystem offers a fix, and the stratum size and weight for each sampled id. It is for the statistics step, not for labelling.
- `allocation.json`: the table above as data.
- `scripts/population.mjs` and `scripts/draw.mjs`: the scripts that produced these files.

The full population (11.1 MB, sha256 `40d3bbce5464e041a5880a523931ce37192711fd025bbb035d6d0e8e46620fec`) is not kept here. The commands below rebuild it.

## Commands that rebuild it

The draw itself ran on corpus checkouts copied from a local cache at the pinned commits, rather than fetched by `corpus.mjs` as below. `$W` is a working folder outside the repository. Node v24.18.0, pnpm 11.6.0.

```sh
git clone https://github.com/dgesteves/onsystem.git "$W/onsystem"
cd "$W/onsystem"
# The draw's scripts, kept in this folder, are newer than the commit it was drawn on: copy them out.
cp -R corpus/fp-sample-20261016/scripts "$W/scripts"
git checkout cb495c00c0b4e433547a03c9178832fda6dab1bb
pnpm install --frozen-lockfile --prefer-offline
pnpm build

# The corpus job's check: fetches the pinned checkouts and writes the raw per-run results to
# $W/corpus/.results/<run>.json. At the draw it printed "Counts match corpus/snapshot.json."
# and exited 0.
node scripts/corpus.mjs --dir "$W/corpus"

# Population and draw
node "$W/scripts/population.mjs" "$W/onsystem" "$W/corpus" "$W/population.json" "$W/population-stats.json"
node "$W/scripts/draw.mjs" "$W/population.json" "$W/corpus" "$W/out" --n 80 --seed 20261016
```

A second run of draw.mjs with the same seed produced a byte-identical sample-unlabelled.json. On main at e17d211, where the corpus counts are unchanged, the same two scripts rebuilt a population.json with the sha256 above and the same `sample-key.json`, `allocation.json` and findings.
