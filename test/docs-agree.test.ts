import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { section } from './markdown.js';

// Pages that repeat what docs/clients.md, the plugins or the benchmark code do say the same:
// the client lists, the Copilot CLI install, the anchor for how the server finds the project, and
// what bench/v2 scores and checks.

const root = path.resolve(import.meta.dirname, '..');
const read = (file: string) =>
  fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const clients = read('docs/clients.md');

/** The text from `### heading` to the next `##` or `###` heading. */
function subsection(markdown: string, heading: string): string {
  const start = markdown.indexOf(`\n### ${heading}\n`);
  if (start === -1) throw new Error(`no "### ${heading}" section`);
  const end = markdown.slice(start + 1).search(/\n#{2,3} /);
  return markdown.slice(start, end === -1 ? undefined : start + 1 + end);
}

describe('the client lists', () => {
  it('quickstart.md names every client docs/clients.md has under Other clients', () => {
    const others = [
      ...section(clients, 'Other clients').matchAll(/<summary><strong>(.+?)<\/strong><\/summary>/g),
    ]
      .map((m) => (m[1] ?? '').replace(/\s*\(.*\)$/, ''))
      // The quickstart gives Claude Code the plugin, above the list.
      .filter((name) => !name.startsWith('Claude Code'));
    expect(others).toContain('Antigravity');
    const quickstart = read('docs/quickstart.md');
    const list = /\[configs for ([^\]]+)\]\(clients\.md#other-clients\)/.exec(quickstart)?.[1];
    for (const name of others) expect(list, name).toContain(name);
  });
});

describe('plugins/onsystem-agent/README.md', () => {
  it('installs in Copilot CLI from the marketplace, as docs/clients.md does', () => {
    const readme = read('plugins/onsystem-agent/README.md');
    const commands = [
      'copilot plugin marketplace add dgesteves/onsystem',
      'copilot plugin install onsystem@dgesteves',
    ];
    expect(section(clients, 'Plugins for other agents')).toContain(
      ['```sh', ...commands, '```'].map((line) => `  ${line}`).join('\n'),
    );
    expect(readme).toContain(['```sh', ...commands, '```'].join('\n'));
    // Copilot CLI has deprecated installing a plugin straight from a repository path.
    expect(readme).not.toMatch(/copilot plugin install dgesteves\//);
  });
});

describe('docs/tools.md', () => {
  it('links to how the server finds the project by its anchor in docs/clients.md', () => {
    expect(clients).toContain('\n## How the server finds your project\n');
    expect(read('docs/tools.md')).toContain(
      '[how the server finds the project](clients.md#how-the-server-finds-your-project)',
    );
  });
});

describe('bench/v2', () => {
  const readme = read('bench/v2/README.md');
  const scoring = subsection(readme, 'Scoring');

  it('LABELLING.md names the automatic scorers that Scoring lists', () => {
    const measures = [...scoring.matchAll(/^\d+\. \*\*(.+?)\*\*/gm)].map((m) => m[1] ?? '');
    expect(measures).toHaveLength(4);
    // The blind labels are the one measure that is not automatic.
    const automatic = measures.filter((m) => !m.startsWith('Blind labels'));
    expect(automatic).toEqual([
      '`tsc` (independent).',
      "`onsystem check` (the tool's own).",
      '@shadcn/lint (independent, added after the standard run).',
    ]);
    const intro = read('bench/v2/LABELLING.md').split('\n\n')[1] ?? '';
    expect(intro).toContain('three automatic scorers');
    for (const scorer of ['`tsc`', 'onsystem', '@shadcn/lint']) expect(intro).toContain(scorer);
  });

  it('says that prepare checks tsc and onsystem only, as lib/repo.mjs does', () => {
    expect(read('bench/v2/lib/repo.mjs')).toContain(
      'checking that tsc and onsystem score the controls as expected',
    );
    const prepare = scoring.split('\n\n').find((p) => p.startsWith('`prepare` checks')) ?? '';
    expect(prepare).toContain('`prepare` checks that `tsc` and onsystem can be trusted');
    expect(prepare).toContain('@shadcn/lint');
  });

  it('does not say that the hook is Claude Code only, now that Codex runs it', () => {
    expect(read('plugins/onsystem/hooks/check-ui.mjs')).toContain("tool_name === 'apply_patch'");
    expect(readme).not.toMatch(/ships its hook only for Claude Code/);
    expect(subsection(readme, 'The agent')).toContain('[#182]');
  });
});
