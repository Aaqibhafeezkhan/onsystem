---
'onsystem': patch
---

The baseline follows a file that is renamed or moved. Its entries are keyed by path, so after `git mv` every finding of the file was new to `check .` and to the GitHub Action with `only-changed-lines: false`, and nothing was said about the entries left under the old path. Now a file with no entries of its own takes over those of a file that no longer exists when at least half of its findings match them, and half of them match its findings, as git counts a rename from 50% similarity. `check` says which file it took for moved, and `--prune-baseline` records the new path. Each file that no longer exists is taken over by one file at most, so copies of a file are still new, and a finding the move adds is still reported. The entries of deleted files in the folders a run checks now count in the "no longer occurs" hint.

The GitHub Action tells `check` which lines a pull request changed, and the baseline accepts the findings on the other lines first. A pull request that copied a baselined line above the original passed before: the baseline accepted the copy, and the original, reported instead, was on a line the pull request did not change. Now the copy is reported, on the line it was added, and fails the check. `check` without the Action still accepts findings in file order.

The GitHub Action runs the onsystem the project installed, found in `working-directory` or the nearest folder above it up to the repository root, so the version the lockfile pins checks the pull request, and the log says when it is not the action's own version. Without an install, it runs `npx onsystem@<the action's version>` as before.
