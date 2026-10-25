# Agent benchmark v1

An earlier, smaller benchmark, replaced by [bench/v2](../v2).

Its files stay here because bench/v2 builds on them: v2's task prompts end with the same instruction as [run.mjs](run.mjs), its chatbot tasks reuse [tasks.json](tasks.json), and its cost estimate ([config/usage-model.json](../v2/config/usage-model.json)) is measured from these runs.

- [run.mjs](run.mjs): the harness, which runs Claude Code headless on each task with and without the plugin and scores the files with `onsystem check`.
- [tasks.json](tasks.json): the tasks.
- [results/](results/) and [output/](output/): the record of each run and the files it wrote.
