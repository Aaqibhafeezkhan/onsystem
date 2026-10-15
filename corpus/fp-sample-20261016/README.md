# Blind false-positive sample, seed 20261016

A seeded random sample of 80 of the 14,539 distinct findings that the corpus job reported on onsystem `cb495c0` (12 repositories pinned by commit, 24 runs), stratified by rule. Each finding is labelled TP (right), FP (false positive) or debatable, judged from the code alone. These are blind labels by an AI reviewer, Claude Opus 5.5, not by a person. The labeller saw the sample (where each finding is, its rule, its message and the code around it), the rules doc and the pinned repositories. It saw no other label, no earlier sample and no rate. [LABELLER.md](LABELLER.md) says what it read and how it decided.

From [stats.txt](stats.txt):

| Reading                                                         | Count   | Share, 95% Wilson interval |
| --------------------------------------------------------------- | ------- | -------------------------- |
| Right                                                           | 57      | 71.2% (60.5-80.0%)         |
| Debatable                                                       | 14      |                            |
| False positives                                                 | 9       | 11.2% (6.0-20.0%)          |
| False positives, weighted by each rule's share of the findings  |         | 11.0% (5.8-20.0%)          |
| False positives, strict: the project's own design-system values | 6       | 7.5% (3.5-15.4%)           |
| `no-hardcoded-color`, false positives                           | 7 of 65 | 10.8% (5.3-20.6%)          |

The strict reading counts a false positive as debatable when the project's own design system already uses the flagged value (`own_ds_value`). The weighted interval uses the effective sample size. stats.txt has every rule.

## Files

- `sample-labelled.json`: the 80 findings with their code, and the labeller's `label`, `reason`, `own_ds_value`, `replacement_wrong` and the files it `looked_at`.
- `sample-key.json`: each finding's severity, whether it has a fix, and its rule's population and weight.
- `allocation.json` and [ALLOCATION.md](ALLOCATION.md): how the sample was drawn, and the commands that rebuild it.
- `stats.txt`: the statistics, from `python3 -I scripts/stats.py sample-labelled.json sample-key.json` in this folder.
- `scripts/`: `population.mjs` and `draw.mjs` drew the sample, and `stats.py` computes the statistics.

The same 80 labels are in [corpus/labels.json](../labels.json), with `"sample": "blind"` and `"draw": "fp-sample-20261016"`. The corpus job checks them as it checks the older labels, and fails when one of their true positives is no longer reported or a fixed false positive comes back. Five of these findings also have an older label, kept as it was. The older labels were made by an AI reviewer who could see the finding, so they are not blind.

The README quotes this sample's rate only while every one of its findings is still reported (`test/readme.test.ts` checks this). Once a fix takes one out, what is left under-counts the false positives: draw a fresh sample with a new seed.

## Edits from the working copy

LABELLER.md and ALLOCATION.md were written in the draw's working folder, outside this repository. These are every change made to them here; the other files are as the draw and the labeller left them, apart from Prettier's formatting of the scripts.

LABELLER.md, in the labeller's words except for:

- What I saw: the sample's path in the working folder is cut to `sample-unlabelled.json`, and "the only file under `roadmap/` that I opened" reads "the only file of the draw's working folder that I opened".
- What I did not see: "Not opened elsewhere under `roadmap/`: briefs, evaluation data and ROADMAP files" reads "Not opened elsewhere in that working folder: briefs, evaluation data and plans", and "nothing under `/private/tmp` written by another agent" reads "nothing in the temporary folders other sessions wrote".
- Four blank lines that Prettier adds.

ALLOCATION.md:

- The title was "OS-FP-SAMPLE: population and allocation". The intro no longer names the brief it was drawn for, and points to this README for the labels and rates.
- References to files not kept here are gone: `population-summary.json`, `population-index.json` and `scripts/summary.py`, and the full population's path in the working folder. `sample-unlabelled.json` is described as `sample-labelled.json` without the label fields. `run`, `occurrence` and `fingerprint` were the keys a later step needed "to add labels to corpus/labels.json"; they are now the keys of that file.
- "Commands run" is now "Commands that rebuild it", and adds that the draw ran on checkouts copied from a local cache at the pinned commits. In the block:
  - `$W` is any working folder, not the session folder's absolute path, and the clone goes straight to `$W/onsystem`;
  - `git checkout` of the draw's commit replaces `git -C onsystem rev-parse HEAD`, which printed it;
  - the scripts are copied out of this folder, not run from the working folder's own `scripts/`;
  - `corpus.mjs` fetches the pinned checkouts, in place of the loop that copied them from the cache;
  - the corpus check no longer writes a log, and its result moved from an end-of-line comment to the comment above it;
  - the `summary.py` step is gone.
- After the block: a check at e17d211, where the same two scripts rebuilt the same population and sample.
- Prettier aligned the allocation table. No value changed.
