---
'onsystem': patch
---

The plugin's hook now checks edits in Codex. Codex installs the Claude Code plugin from the same marketplace and runs its hook on `apply_patch`, but the hook read only `tool_input.file_path`, and Codex puts the patch in `tool_input.command`, so every edit passed unchecked. The hook now reads the files a patch adds or updates from its `*** Add File:`, `*** Update File:` and `*** Move to:` lines, checks each `.tsx` or `.jsx` file in one run per project, and holds an updated file to the lines its hunks change, as it holds an Edit. It also reads the file from `path` or `filePath`, as other clients' tools name it, when the tool's input carries the text it wrote. Codex runs a plugin's hooks once you trust them in `/hooks`.

`init`, run in a terminal, offers to add a short section to the project's `AGENTS.md` (create-next-app writes one) or `CLAUDE.md`: use the onsystem tools before writing UI, and run `check_ui`, or `npx -y onsystem check <file>` without the tools, on every UI file changed. It sits between `BEGIN:onsystem-agent-rules` and `END:onsystem-agent-rules` comment markers, which a later run updates in place. A `CLAUDE.md` that imports `AGENTS.md` is left alone, and `--yes` never writes it.
