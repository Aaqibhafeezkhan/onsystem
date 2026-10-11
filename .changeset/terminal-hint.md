---
'onsystem': patch
---

`npx onsystem` with no command, typed in a terminal, says on stderr what it is before it starts the MCP server, which otherwise sits waiting on stdin and looks hung: where to add it to an agent, and that `inspect` or `check .` is what to run by hand. An MCP client starts it with a pipe, not a terminal, so clients see nothing new.
