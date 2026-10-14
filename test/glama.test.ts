import fs from 'node:fs';
import path from 'node:path';

import { expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '..');
const read = (file: string) =>
  JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')) as unknown;

// Glama lists MCP servers from their repositories, and glama.json says which GitHub users may
// claim and maintain this one there (https://glama.ai/mcp/schemas/server.json).
it("glama.json names the repository's owner as the maintainer", () => {
  const { repository } = read('server.json') as { repository: { url: string } };
  const owner = /^https:\/\/github\.com\/([^/]+)\//.exec(repository.url)?.[1];
  expect(owner).toBe('dgesteves');
  expect(read('glama.json')).toEqual({
    $schema: 'https://glama.ai/mcp/schemas/server.json',
    maintainers: [owner],
  });
});
