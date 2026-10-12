import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

// The one-click install links in the README (which the site shows too) and in docs/clients.md:
// each client gets the same command, which passes the workspace folder as the root.
const root = path.resolve(import.meta.dirname, '..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

/** The server config each install link carries: Cursor's in base64, VS Code's URL-encoded. */
function configs(text: string): { client: string; config: unknown }[] {
  const found: { client: string; config: unknown }[] = [];
  for (const [url] of text.matchAll(/https:\/\/[^\s)]*(?:install-mcp|mcp\/install)\?[^\s)]+/g)) {
    const config = new URL(url).searchParams.get('config') ?? '';
    found.push(
      url.includes('cursor.com')
        ? { client: 'Cursor', config: JSON.parse(Buffer.from(config, 'base64').toString('utf8')) }
        : { client: 'VS Code', config: JSON.parse(config) },
    );
  }
  return found;
}

describe('the install links', () => {
  it.each(['README.md', 'docs/clients.md'])(
    'in %s start the server with the workspace folder as its root, in every client',
    (file) => {
      const found = configs(read(file));
      // The README links each client twice: in the badges at the top and in the quickstart.
      expect([...new Set(found.map((f) => f.client))].sort()).toEqual(['Cursor', 'VS Code']);
      for (const { client, config } of found) {
        expect(config, `${file}: ${client}`).toEqual({
          command: 'npx',
          args: ['-y', 'onsystem', '--root', '${workspaceFolder}'],
        });
      }
    },
  );

  it('lead the README quickstart with commands to copy, run through npx -y', () => {
    const quickstart = read('README.md').split('## Quickstart')[1] ?? '';
    const block = /^```sh\n([\s\S]*?)```/m.exec(quickstart);
    expect(quickstart.indexOf('```sh')).toBeLessThan(quickstart.indexOf('**Claude Code.**'));
    const commands = (block?.[1] ?? '')
      .split('\n')
      .map((line) => line.replace(/\s+#.*$/, '').trim())
      .filter(Boolean);
    expect(commands).toEqual([
      'npx -y onsystem inspect',
      'npx -y onsystem check .',
      'npx -y onsystem init',
    ]);
    expect(quickstart.split('**Claude Code.**')[0]).not.toMatch(/`npx onsystem /);
  });
});
