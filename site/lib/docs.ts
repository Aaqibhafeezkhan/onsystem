import { docs, type Docs } from '@/lib/data';

export const DOCS_GROUPS = [
  'Get started',
  'Gate PRs',
  'Integrations',
  'Reference',
  'Help',
] as const;

export type DocsGroup = (typeof DOCS_GROUPS)[number];

interface DocsPageInfo {
  href: string;
  /** The sidebar group, also the page's eyebrow. */
  group: DocsGroup;
  /** The file in the repository the page is written in. */
  source: string;
  title: string;
  /** A shorter sidebar label, when the title is long. */
  label?: string;
  /** A line under the title, for pages whose file has a longer title of its own. */
  lead?: string;
  description: string;
}

/** The docs pages, in reading order: by group, as the sidebar lists them. */
const PAGES = [
  {
    href: '/docs',
    group: 'Get started',
    source: 'docs/quickstart.md',
    title: 'Quickstart',
    description:
      'See what it found in your app, hold your agent to the design system, and gate your pull requests with the same check.',
  },
  {
    href: '/docs/clients',
    group: 'Get started',
    source: 'docs/clients.md',
    title: 'Set up your agent',
    // Names every client docs/clients.md sets up (site/test/docs-agree.test.ts) in 160 characters
    // at most (site/test/shell.test.ts), and is at 151. Before adding the next client, shorten the
    // wording: drop the "and" before the last name, or "MCP " at the start.
    description:
      'MCP configs for Cursor, VS Code, Claude Desktop, Codex CLI, Copilot CLI, Windsurf, JetBrains, Zed, Gemini CLI, Antigravity, Grok Build and Claude Code.',
  },
  {
    href: '/docs/plugin',
    group: 'Get started',
    source: 'docs/plugin.md',
    title: 'Claude Code plugin',
    description:
      'The hook that checks each UI file right after Claude writes it and hands the errors back, the MCP server and a skill: what each does, runs and touches.',
  },
  {
    href: '/docs/rollout',
    group: 'Get started',
    source: 'docs/rollout.md',
    title: 'Roll out to a team',
    description:
      'The files a team commits, in order: a pinned version, a baseline with code owners, the plugin in project settings, MCP configs, ESLint and the required check.',
  },
  {
    href: '/docs/ci',
    group: 'Gate PRs',
    source: 'docs/ci.md',
    title: 'CI and baselines',
    description:
      'Gate pull requests with the same check, as annotations, and adopt it in a codebase that already has findings.',
  },
  {
    href: '/docs/required-check',
    group: 'Gate PRs',
    source: 'docs/required-check.md',
    title: 'GitHub Action',
    lead: 'Make it a required check on agent pull requests.',
    description:
      'The GitHub Action that annotates the lines a pull request changed, making it a required check, and notes for pull requests from Copilot, Codex and Claude.',
  },
  {
    href: '/docs/eslint',
    group: 'Integrations',
    source: 'docs/eslint.md',
    title: 'ESLint plugin',
    description:
      'The same rules in ESLint 9 and 10, checked against each file’s design system, and how to run them alongside @shadcn/lint.',
  },
  {
    href: '/docs/configuration',
    group: 'Reference',
    source: 'docs/configuration.md',
    title: 'Configuration',
    description:
      'How the design system is found with zero config, and the config file for other layouts.',
  },
  {
    href: '/docs/design-system-packages',
    group: 'Reference',
    source: 'docs/design-system-packages.md',
    title: 'Design-system packages',
    description:
      'Set onsystem up once in a design-system package, and every app that depends on it finds the design system with no config of its own.',
  },
  {
    href: '/docs/tokens',
    group: 'Reference',
    source: 'docs/tokens.md',
    title: 'Design tokens',
    description:
      'Tokens from stylesheets, DTCG 2025.10 files and a DESIGN.md, and onsystem export to write them as DTCG or DESIGN.md.',
  },
  {
    href: '/docs/tools',
    group: 'Reference',
    source: 'docs/tools.md',
    title: 'Tools',
    description: 'The five MCP tools, the resources and the prompt, with real responses.',
  },
  {
    href: '/docs/cli',
    group: 'Reference',
    source: 'docs/cli.md',
    title: 'CLI reference',
    description:
      'Every command and option of the onsystem CLI: serve, check and its exit codes, inspect, export and init.',
  },
  {
    href: '/docs/troubleshooting',
    group: 'Help',
    source: 'docs/troubleshooting.md',
    title: 'Troubleshooting',
    description:
      'When inspect finds nothing, a monorepo root that misses a project, components with 0 props, and min-release-age policies that block npx.',
  },
  {
    href: '/docs/faq',
    group: 'Help',
    source: 'site/lib/faq.ts',
    title: 'FAQ',
    description: 'Privacy, @shadcn/lint and Storybook, other frameworks, and false positives.',
  },
  {
    href: '/docs/how-it-works',
    group: 'Help',
    source: 'docs/how-it-works.md',
    title: 'How it works',
    description:
      'How the design system is read and checked, results on real codebases, how it compares, design decisions and limits.',
  },
  {
    href: '/docs/migrating',
    group: 'Help',
    source: 'docs/migrating.md',
    title: 'Migrating from design-system-mcp',
    label: 'Migrating',
    description:
      'What moved when @dgesteves/design-system-mcp became onsystem: the package, command, config and baseline files, plugin, MCP key and registry name.',
  },
] as const satisfies readonly DocsPageInfo[];

export type DocsHref = (typeof PAGES)[number]['href'];

export type DocsPage = DocsPageInfo & { href: DocsHref };

export const DOCS_PAGES: readonly DocsPage[] = PAGES;

export function docsPage(href: DocsHref): {
  page: DocsPage;
  previous: DocsPage | undefined;
  next: DocsPage | undefined;
} {
  const index = DOCS_PAGES.findIndex((p) => p.href === href);
  return {
    page: DOCS_PAGES[index] ?? PAGES[0],
    previous: index > 0 ? DOCS_PAGES[index - 1] : undefined,
    next: DOCS_PAGES[index + 1],
  };
}

/** A link in the docs sidebar: a docs page, or another page of the site listed with them. */
export interface DocsNavItem {
  href: string;
  label: string;
}

/** The sidebar: each group's pages, with the rules (their own page) under Reference. */
export const DOCS_NAV: { group: DocsGroup; items: DocsNavItem[] }[] = DOCS_GROUPS.map((group) => {
  const items = DOCS_PAGES.filter((page) => page.group === group).map((page): DocsNavItem => ({
    href: page.href,
    label: page.label ?? page.title,
  }));
  if (group === 'Reference') {
    const tools = items.findIndex((item) => item.href === '/docs/tools');
    items.splice(tools, 0, { href: '/rules', label: 'Rules' });
  }
  return { group, items };
});

/** The page's last path segment, `quickstart` for /docs: its card is /og/docs/<slug>. */
export function docsSlug(href: DocsHref): string {
  return href === '/docs' ? 'quickstart' : href.slice('/docs/'.length);
}

/** The Markdown a page renders, for the pages written in docs/*.md. */
export function docsMarkdown(page: DocsPage): string | undefined {
  const name = /^docs\/([\w-]+)\.md$/.exec(page.source)?.[1];
  if (!name) return undefined;
  const key = name.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase()) as keyof Docs;
  return docs[key];
}

/** The `##` headings of a page's Markdown, as plain text; headings inside code blocks are not. */
export function docsHeadings(markdown: string): string[] {
  const headings: string[] = [];
  let fenced = false;
  for (const line of markdown.split('\n')) {
    if (/^\s*```/.test(line)) fenced = !fenced;
    const heading = fenced ? null : /^## (.+)$/.exec(line);
    if (heading?.[1])
      headings.push(heading[1].replace(/`/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1'));
  }
  return headings;
}
