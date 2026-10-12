// The onsystem MCP server for the "mcp" and "all" arms: started over stdio in the run's copy
// of the repository (its root, as a client opened on the repository would), listed, and
// called. Tools are offered to the model as mcp__onsystem__<tool>, the way Claude Code names
// them, with the server's own descriptions and input schemas; the server's instructions go
// into the system prompt, as MCP clients do.
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export const MCP_PREFIX = 'mcp__onsystem__';

/**
 * @param {{ cli: string, cwd: string }} options
 * @returns {Promise<{ tools: { name: string, description: string, schema: Record<string, unknown> }[], instructions: string, call: (name: string, input: Record<string, unknown>) => Promise<{ output: string, isError: boolean }>, close: () => Promise<void> }>}
 */
export async function startOnsystemMcp({ cli, cwd }) {
  // --no-cache: runs of the same repository share its node_modules, where the cache lives.
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [cli, '--no-cache'],
    cwd,
    env: minimalEnv(),
    stderr: 'pipe',
  });
  const client = new Client({ name: 'onsystem-bench', version: '2.0.0' });
  await client.connect(transport);
  const { tools } = await client.listTools();
  return {
    tools: tools.map((t) => ({
      name: `${MCP_PREFIX}${t.name}`,
      description: t.description ?? '',
      schema: /** @type {Record<string, unknown>} */ (t.inputSchema),
    })),
    instructions: client.getInstructions() ?? '',
    async call(name, input) {
      try {
        const result = await client.callTool({
          name: name.slice(MCP_PREFIX.length),
          arguments: input,
        });
        const content = Array.isArray(result.content) ? result.content : [];
        const text = content
          .filter((c) => c.type === 'text')
          .map((c) => c.text)
          .join('\n');
        return { output: text || '(no text content)', isError: result.isError === true };
      } catch (error) {
        return {
          output: `MCP error: ${error instanceof Error ? error.message : String(error)}`,
          isError: true,
        };
      }
    },
    async close() {
      await client.close().catch(() => {});
    },
  };
}

/** What the server needs to run, and nothing else: no API keys reach it. */
export function minimalEnv() {
  const keep = [
    'PATH',
    'HOME',
    'TMPDIR',
    'TEMP',
    'TMP',
    'SYSTEMROOT',
    'USERPROFILE',
    'APPDATA',
    'LANG',
  ];
  /** @type {Record<string, string>} */
  const env = { NO_COLOR: '1' };
  for (const name of keep)
    if (process.env[name]) env[name] = /** @type {string} */ (process.env[name]);
  return env;
}
