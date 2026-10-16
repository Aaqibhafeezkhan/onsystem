import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { dynamic, GET } from '@/app/setup.md/route';
import { slug } from '@/components/markdown-blocks';
import { docs } from '@/lib/data';
import { DOCS_PAGES } from '@/lib/docs';
import { llmsTxt, SETUP_PROMPT } from '@/lib/llms';
import { PLUGIN_COMMANDS, SITE_URL } from '@/lib/site';

// /setup.md: the steps an agent follows to set onsystem up in a project, and the one prompt that
// points it there, as @shadcn/lint's quickstart does with its SETUP.md.
const root = path.join(import.meta.dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

const setup = async () => {
  const response = GET();
  expect(response.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
  return response.text();
};

/** The code of the fenced block titled `title` in a docs page's Markdown. */
function titled(markdown: string, title: string): string {
  const at = markdown.indexOf(` title="${title}"\n`);
  expect(at, title).toBeGreaterThan(-1);
  const start = markdown.indexOf('\n', at) + 1;
  return markdown.slice(start, markdown.indexOf('\n```', start));
}

describe('/setup.md', () => {
  it('is Markdown, written once per build', async () => {
    expect(dynamic).toBe('force-static');
    expect(await setup()).toMatch(/^# Set up onsystem\n\n/);
  });

  it('takes an agent through init --yes, its own config, the CI check and a report', async () => {
    const body = await setup();
    const steps = [...body.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
    expect(steps).toEqual([
      '1. Look at the project',
      '2. Write the config and record the baseline',
      '3. Add it to your agent',
      '4. Check pull requests',
      '5. Check it works, and report',
    ]);
    expect(body).toContain('npx -y onsystem init --yes');
    expect(body).toContain('npx -y onsystem inspect --explain');
    expect(body).toContain('npx -y onsystem check .');
    // Every agent the home page's tabs install for, and any other.
    for (const agent of ['Claude Code', 'Cursor', 'VS Code', 'Codex CLI', 'Any other agent']) {
      expect(body).toContain(`- **${agent}**`);
    }
    // npx without -y asks before it installs, which an agent's terminal cannot answer. (The
    // AGENTS.md line, from the docs, is for a project that has it installed.)
    expect(body.replace(/^ *```[\s\S]*?^ *```/gm, '')).not.toMatch(/npx onsystem/);
    expect(body).toContain('Tell the user');
  });

  it('gives the configs and the workflow the docs give, word for word', async () => {
    const body = await setup();
    for (const file of ['.claude/settings.json', '.cursor/mcp.json', '.vscode/mcp.json']) {
      expect(body, file).toContain(
        `\`${file}\`:\n\n  \`\`\`json\n  ${titled(docs.rollout, file).replace(/\n/g, '\n  ')}\n  \`\`\``,
      );
    }
    expect(body).toContain(titled(docs.rollout, 'AGENTS.md'));
    expect(body).toContain(titled(docs.requiredCheck, '.github/workflows/onsystem.yml'));
    for (const command of PLUGIN_COMMANDS.split('\n')) expect(body).toContain(`\`${command}\``);
    for (const command of [
      'codex plugin marketplace add dgesteves/onsystem',
      'codex plugin add onsystem@dgesteves',
    ]) {
      expect(body).toContain(`\`${command}\``);
      expect(read('docs/clients.md')).toContain(command);
    }
  });

  it('links with absolute URLs, to pages the site has', async () => {
    const body = await setup();
    const links = [...body.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1] ?? '');
    expect(links.length).toBeGreaterThanOrEqual(3);
    const pages = new Set([...DOCS_PAGES.map((page) => page.href), '/llms-full.txt']);
    for (const link of links) {
      expect(link).toMatch(/^https:\/\//);
      if (!link.startsWith(SITE_URL)) continue;
      const [page = '', anchor] = link.slice(SITE_URL.length).split('#');
      expect(pages, link).toContain(page);
      if (anchor) {
        const file = DOCS_PAGES.find((p) => p.href === page)?.source ?? '';
        const ids = [...read(file).matchAll(/^#{2,6} (.+)$/gm)].map((m) => slug(m[1] ?? ''));
        expect(ids, link).toContain(anchor);
      }
    }
  });
});

describe('the setup prompt', () => {
  it('points the agent at /setup.md, as @shadcn/lint’s quickstart does at its SETUP.md', () => {
    expect(SETUP_PROMPT).toBe(
      'Read https://onsystem.vercel.app/setup.md and set up onsystem in this project.',
    );
  });

  it('is in step 2 of the quickstart, as a block to copy', () => {
    const quickstart = read('docs/quickstart.md');
    const step = quickstart.slice(
      quickstart.indexOf('## Hold your agent to it'),
      quickstart.indexOf('## Try it'),
    );
    expect(step).toContain(`\`\`\`text title="Prompt for your agent"\n${SETUP_PROMPT}\n\`\`\``);
    // Before the per-agent steps it stands in for.
    expect(step.indexOf(SETUP_PROMPT)).toBeLessThan(step.indexOf('- **Claude Code**'));
  });

  it('is in llms.txt, with /setup.md', () => {
    const txt = llmsTxt();
    expect(txt).toContain(`${SITE_URL}/setup.md`);
    expect(txt).toContain(SETUP_PROMPT);
  });
});
