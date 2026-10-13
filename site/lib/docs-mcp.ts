import { mcpInstallLinks } from 'ondocs';

import { SITE_URL } from '@/lib/site';

/**
 * The docs as an MCP server (app/api/mcp/route.ts), and the ways to add it, as ondocs's README
 * links its own: install pages for Cursor and VS Code, claude.ai's connector form, and the
 * Claude Code command. Named `onsystem-docs`, apart from onsystem's own server, which checks code.
 */
const url = `${SITE_URL}/api/mcp`;
const name = 'onsystem-docs';
const links = mcpInstallLinks({ url, name });

export const DOCS_MCP = {
  url,
  name,
  cursor: `https://cursor.com/en/install-mcp?name=${name}&config=${encodeURIComponent(Buffer.from(JSON.stringify({ url })).toString('base64'))}`,
  vscode: `https://insiders.vscode.dev/redirect/mcp/install?name=${name}&config=${encodeURIComponent(JSON.stringify({ type: 'http', url }))}`,
  claude: links.claude,
  claudeCode: links.claudeCode,
};
