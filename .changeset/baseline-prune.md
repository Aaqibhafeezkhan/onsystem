---
'onsystem': patch
---

`check --prune-baseline` drops the baseline entries that no longer occur and accepts nothing new, and it is the command `check` now prints when baselined findings get fixed. The command it printed before, `--update-baseline`, also recorded every new finding of the run, so following it next to a new error accepted the error. The printed command keeps `--baseline`, `--root`, `--config`, `--components`, `--tokens`, `--docs`, `--include-design-system` and `--include-tests`, so it rewrites the same file from the same findings; before, with `--baseline <file>` it wrote a second baseline at the root. `--update-baseline` creates the baseline's folder, and with `--format json`, `sarif` or `github` prints its summary on stderr, so stdout stays in the format.

The baseline now records the onsystem version that wrote it and the rules that ran. When a rule that did not run then reports findings, as when an upgrade finds tokens an older version missed, `check` says they are new to the baseline rather than to the code, and how many other new findings `--update-baseline` would accept with them. A baseline without these fields is read as before, and older versions of onsystem read the new ones without complaint.
