import { docs, type Docs } from '@/lib/data';

/**
 * The docs pages, in reading order. Titles double as sidebar labels. `source` is the file in the
 * repository the page is written in.
 */
export const DOCS_PAGES = [
  {
    href: '/docs',
    source: 'docs/quickstart.md',
    title: 'Quickstart',
    description:
      'See what it found in your app, hold your agent to the design system, and gate your pull requests with the same check.',
  },
  {
    href: '/docs/plugin',
    source: 'docs/plugin.md',
    title: 'Claude Code plugin',
    description:
      'The hook that checks each UI file right after Claude writes it and hands the errors back, the MCP server and a skill: what each does, runs and touches.',
  },
  {
    href: '/docs/ci',
    source: 'docs/ci.md',
    title: 'CI and baselines',
    description:
      'Gate pull requests with the same check, as annotations, and adopt it in a codebase that already has findings.',
  },
  {
    href: '/docs/required-check',
    source: 'docs/required-check.md',
    title: 'GitHub Action',
    description:
      'The GitHub Action that annotates the lines a pull request changed, making it a required check, and notes for pull requests from Copilot, Codex and Claude.',
  },
  {
    href: '/docs/clients',
    source: 'docs/clients.md',
    title: 'Set up your agent',
    description:
      'MCP configs for Cursor, VS Code, Claude Desktop, Codex CLI, Copilot CLI, Windsurf, JetBrains, Zed, Gemini CLI, Grok Build and Claude Code without the plugin.',
  },
  {
    href: '/docs/configuration',
    source: 'docs/configuration.md',
    title: 'Configuration',
    description:
      'How the design system is found with zero config, and the config file for other layouts.',
  },
  {
    href: '/docs/design-system-packages',
    source: 'docs/design-system-packages.md',
    title: 'Design-system packages',
    description:
      'Set onsystem up once in a design-system package, and every app that depends on it finds the design system with no config of its own.',
  },
  {
    href: '/docs/tokens',
    source: 'docs/tokens.md',
    title: 'Design tokens',
    description:
      'Tokens from stylesheets, DTCG 2025.10 files and a DESIGN.md, and onsystem export to write them as DTCG or DESIGN.md.',
  },
  {
    href: '/docs/eslint',
    source: 'docs/eslint.md',
    title: 'ESLint plugin',
    description:
      'The same rules in ESLint 9 and 10, checked against each file’s design system, and how to run them alongside @shadcn/lint.',
  },
  {
    href: '/docs/tools',
    source: 'docs/tools.md',
    title: 'Tools',
    description: 'The five MCP tools, the resources and the prompt, with real responses.',
  },
  {
    href: '/docs/troubleshooting',
    source: 'docs/troubleshooting.md',
    title: 'Troubleshooting',
    description:
      'When inspect finds nothing, a monorepo root that misses a project, components with 0 props, and min-release-age policies that block npx.',
  },
  {
    href: '/docs/how-it-works',
    source: 'docs/how-it-works.md',
    title: 'How it works',
    description:
      'How the design system is read and checked, results on real codebases, how it compares, design decisions and limits.',
  },
  {
    href: '/docs/faq',
    source: 'site/app/docs/faq/page.tsx',
    title: 'FAQ',
    description: 'Privacy, @shadcn/lint and Storybook, other frameworks, and false positives.',
  },
  {
    href: '/docs/migrating',
    source: 'docs/migrating.md',
    title: 'Migrating from design-system-mcp',
    description:
      'What moved when @dgesteves/design-system-mcp became onsystem: the package, command, config and baseline files, plugin, MCP key and registry name.',
  },
] as const;

export type DocsHref = (typeof DOCS_PAGES)[number]['href'];

export function docsPage(href: DocsHref) {
  const index = DOCS_PAGES.findIndex((p) => p.href === href);
  return {
    page: DOCS_PAGES[index] ?? DOCS_PAGES[0],
    previous: index > 0 ? DOCS_PAGES[index - 1] : undefined,
    next: DOCS_PAGES[index + 1],
  };
}

export type DocsPage = (typeof DOCS_PAGES)[number];

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
