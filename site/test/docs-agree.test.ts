import fs from 'node:fs';
import path from 'node:path';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import Home from '@/app/page';
import { corpus } from '@/lib/data';
import { DOCS_PAGES } from '@/lib/docs';
import { faqEntries } from '@/lib/faq';
import { llmsFullTxt, llmsTxt, setupMd } from '@/lib/llms';

// What the site says about the clients, in /setup.md, the FAQ, llms.txt, the docs index and the
// home page, says what docs/clients.md says; and llms-full.txt keeps its own outline.
const root = path.join(import.meta.dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
const clients = read('docs/clients.md');

/** The text of `markdown` from `from` up to `to`. */
const between = (markdown: string, from: string, to: string) =>
  markdown.slice(markdown.indexOf(from), markdown.indexOf(to, markdown.indexOf(from)));

/** The paragraphs and list items of `markdown` that have every one of `terms` in them. */
const paragraphsWith = (markdown: string, ...terms: (string | RegExp)[]) =>
  markdown
    .split(/\n\s*\n/)
    .filter((p) => terms.every((t) => (typeof t === 'string' ? p.includes(t) : t.test(p))));

/** Every client docs/clients.md has a setup block for, by the name the site uses. */
const clientNames = [...clients.matchAll(/<summary><strong>(.+?)<\/strong><\/summary>/g)].map((m) =>
  (m[1] ?? '')
    .replace(/\s*\(.*\)$/, '')
    .replace(/^GitHub /, '')
    .replace(/ IDEs$/, '')
    .replace(/ without the plugin$/, ''),
);

describe('/setup.md', () => {
  it('turns a committed .mcp.json entry off for Claude Code, as docs/clients.md does', () => {
    const disabled = '`"disabledMcpjsonServers": ["onsystem"]`';
    expect(clients).toContain(disabled);
    const claude = between(setupMd(), '- **Claude Code**', '- **Cursor**');
    expect(claude).toContain(disabled);
    expect(claude).toContain('`.claude/settings.json`');
    // docs/clients.md offers one .mcp.json to the team: the step no longer forbids it.
    expect(claude).not.toMatch(/Do not add onsystem to `\.mcp\.json`/);
  });

  it('gives Codex CLI the plugin’s hook, trusted in /hooks, as docs/clients.md does', () => {
    expect(paragraphsWith(clients, 'Codex CLI', /\bhook\b/, '`/hooks`')).not.toEqual([]);
    const codex = between(setupMd(), '- **Codex CLI**', '- **Any other agent**');
    expect(codex).toContain('the hook');
    expect(codex).toContain('`/hooks`');
  });
});

describe('the hook in Codex CLI', () => {
  it('is in the FAQ and llms.txt, as in docs/clients.md', () => {
    expect(paragraphsWith(clients, 'Claude Code', 'Codex CLI', /\bhook\b/)).not.toEqual([]);
    const question = 'Does it work with agents other than Claude Code?';
    const answer = faqEntries(corpus).find(([q]) => q === question)?.[1];
    expect(answer).toContain('Claude Code and Codex CLI');
    expect(answer).not.toMatch(/Claude Code only/);
    expect(llmsTxt()).toContain('In Claude Code and Codex CLI, a hook checks each file');
  });
});

describe('the docs index', () => {
  // The description also has to stay at 160 characters or fewer (site/test/shell.test.ts), and is
  // at 151: before adding the next client, shorten its wording, e.g. drop the "and" before the
  // last name, or "MCP " at the start (site/lib/docs.ts says the same).
  it('names every client docs/clients.md sets up in the description of /docs/clients', () => {
    const description = DOCS_PAGES.find((page) => page.href === '/docs/clients')?.description ?? '';
    expect(clientNames).toContain('Antigravity');
    for (const name of clientNames) expect(description, name).toContain(name);
  });
});

describe('the home page', () => {
  it('names every client docs/clients.md sets up in its Works with list', () => {
    const home = renderToStaticMarkup(createElement(Home));
    // The section's first list, Agents and editors; the second is the codebases.
    const section = /<section[^>]*id="works-with"[\s\S]*?<\/section>/.exec(home)?.[0] ?? '';
    const list = /<ul[^>]*>([\s\S]*?)<\/ul>/.exec(section)?.[1] ?? '';
    const chips = [...list.matchAll(/<li[^>]*>([^<]*)<\/li>/g)].map((m) => m[1] ?? '');
    expect(chips).toContain('Antigravity');
    expect(clientNames.filter((name) => !chips.some((chip) => chip.includes(name)))).toEqual([]);
  });
});

describe('llms-full.txt', () => {
  it('keeps its outline: no line of a code block starts with #', () => {
    const full = llmsFullTxt();
    const lines = full.split('\n');
    let fenced = false;
    const hashed: string[] = [];
    for (const line of lines) {
      if (/^\s*```/.test(line)) fenced = !fenced;
      else if (fenced && line.startsWith('#')) hashed.push(line);
    }
    // get_component's Markdown answer in docs/tools.md, and a shell comment in docs/ci.md.
    expect(hashed).toEqual([]);
    expect(lines.filter((line) => line.startsWith('# '))).toEqual(['# onsystem']);
    // Cut at its `## ` lines, the Tools section runs to the end of the page.
    const tools = full.slice(full.indexOf('\n## Tools\n'), full.indexOf('\n## CLI reference\n'));
    expect(tools.slice(1).match(/\n## /g)).toBeNull();
    expect(tools).toContain('\n  # Badge\n');
    expect(tools).toContain('> check_ui {');
  });
});
