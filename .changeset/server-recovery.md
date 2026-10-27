---
'onsystem': patch
---

The MCP server no longer keeps a load that failed. A config that was invalid when the server started (a typo in `rules`, a bad glob) is read again on the next request, so fixing it is enough, without restarting the server. Before, every request returned the first error until the client restarted the server, even with `--watch`. In a project found from the path a tool call names, a project whose config fails no longer counts as a project found, and switching from `onsystem.config.mjs` to `onsystem.config.json`, as the error says, now takes effect. A design system whose first build fails is built again by the next request.

An edited `onsystem.config.mjs`, `.js` or `.ts` is read again: the server logged "reloaded" but kept the rules it loaded first, because Node.js returns a module it has already imported. A JSON config was not affected. The modules a config imports are still loaded once.

A `--root` that is no project but holds projects in its folders, such as a folder of repositories that `--root ${workspaceFolder}` names when the editor has their parent open, is no longer served as one project that mixed their tokens and suggested fixes with another repository's tokens. The server answers each request from the project of the absolute path it names, as it does when started outside any project, and asks for a path until one is named. The same holds for a client's root. For zero config in such a folder, `**/*.tokens.json` no longer reads the token files of the projects in it, so `check` run there gives no fix from another project either.
