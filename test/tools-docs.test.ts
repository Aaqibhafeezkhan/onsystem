import fs from 'node:fs';
import path from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createServer } from '../src/server/index.js';
import { DEMO_ROOT, loadOnce } from './helpers.js';
import { blocks } from './markdown.js';

// docs/tools.md, "What the agent sees": the check_ui example is what check_ui answers for that
// code on the demo. It kept the error a color without a token of its hue got before #132 made
// that a warning with a new message, so the page showed agents a reply they no longer get.

const tools = fs.readFileSync(path.join(import.meta.dirname, '../docs/tools.md'), 'utf8');

/** The page's transcript of a tool call: the call's arguments and the reply as shown. */
function transcript(tool: string): { args: Record<string, unknown>; shown: string } {
  const block = blocks(tools, 'text').find((b) => b.startsWith(`> ${tool} `));
  if (!block) throw new Error(`docs/tools.md has no ${tool} example`);
  const [call = '', ...reply] = block.trimEnd().split('\n');
  // Lines the page wraps are indented under the finding they continue.
  const shown = reply
    .join('\n')
    .trim()
    .replace(/\n {5}(?=\S)/g, ' ');
  return { args: JSON.parse(call.slice(`> ${tool} `.length)) as Record<string, unknown>, shown };
}

describe('the check_ui example (docs/tools.md)', () => {
  const client = new Client({ name: 'test-client', version: '1.0.0' });

  beforeAll(async () => {
    const ds = await loadOnce(DEMO_ROOT);
    const server = createServer({ getDesignSystem: () => Promise.resolve(ds) });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  });

  afterAll(async () => {
    await client.close();
  });

  it('shows the summary and the findings check_ui returns for its code', async () => {
    const { args, shown } = transcript('check_ui');
    const result = (await client.callTool({ name: 'check_ui', arguments: args })) as CallToolResult;
    const content = result.content[0];
    const text = content?.type === 'text' ? content.text : '';
    // The page leaves out the closing line that asks the agent to fix the errors.
    expect(text.split('\n\n').slice(0, 2).join('\n\n')).toBe(shown);
    expect(shown).toContain('warning [no-hardcoded-color] `bg-blue-600`');
    expect(shown).not.toContain('nearest is');
  });
});
