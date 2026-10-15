import { benchmarkMarkdown, playgroundMarkdown } from '@/lib/agent-markdown';
import { headlineText } from '@/lib/benchmark';
import { benchmark, corpus, designSystem, docs, readme, ruleCatalog, tools } from '@/lib/data';
import { DOCS_PAGES } from '@/lib/docs';
import { faqMarkdown } from '@/lib/faq';
import { withoutMarkers } from '@/lib/markers';
import { playground } from '@/lib/playground';
import {
  NPM,
  NPX,
  PLUGIN_COMMANDS,
  REGISTRY,
  REPO,
  repoLink,
  resolveDocHref,
  ruleHref,
  SITE_URL,
} from '@/lib/site';

/** Links in docs Markdown on `page`, made absolute: site pages where they exist, GitHub otherwise. */
export function absolute(markdown: string, page: string): string {
  return markdown.replace(/\]\(([^)]+)\)/g, (_, href: string) => {
    const target = resolveDocHref(href);
    if (target.startsWith('#')) return `](${SITE_URL}${page}${target})`;
    return `](${target.startsWith('/') ? `${SITE_URL}${target}` : target})`;
  });
}

// The home page's first screen, word for word (test/llms.test.ts checks), then how it works.
const pitch =
  'Keeps coding agents on your design system. Catches palette colors, native elements and APIs your design system lacks in agent-written React, at every edit and pull request, with the fix. Set it up once in your design-system package; every app in your monorepo gets it.';
const details =
  'It reads React components, props, cva variants and tokens from source with the TypeScript compiler. In Claude Code, a hook checks each file right after it is written and hands the errors back with their fixes; other agents run check_ui over MCP; the CI check gates pull requests. Static analysis, run locally: no model calls, no API key, zero config. It works alongside @shadcn/lint.';

/** llms.txt (https://llmstxt.org): what this is, how to install it, and where everything is. */
export function llmsTxt(): string {
  const lines = [
    '# onsystem',
    '',
    `> ${pitch}`,
    '',
    details,
    '',
    `Version ${tools.version}, MIT. React (.tsx/.jsx), shadcn/ui or any design system, Tailwind v3 or v4, Node.js ${readme.engines.node.replace('>=', '')}+.`,
    '',
    'Install:',
    '',
    `- Claude Code (hook, MCP server and skill): \`${PLUGIN_COMMANDS.split('\n').join('` then `')}\``,
    '- CI: `npx onsystem check . --format github --require-design-system`, with `--update-baseline` once to accept existing findings',
    '- Required check on pull requests: the GitHub Action `uses: dgesteves/onsystem@v0`, which annotates the lines a pull request changed',
    `- Any MCP client, over stdio: \`${NPX}\``,
    '',
    `Benchmark (${benchmark.date}): ${headlineText(benchmark)}. Tables, method and blind labels: ${SITE_URL}/benchmark`,
    '',
    '## Docs',
    '',
    ...DOCS_PAGES.map((page) => `- [${page.title}](${SITE_URL}${page.href}): ${page.description}`),
    `- [Benchmark](${SITE_URL}/benchmark): coding agents from ${String(benchmark.providers.length)} providers with and without onsystem, by arm and model, with the method and how to reproduce it`,
    `- [Rules](${SITE_URL}/rules): every rule with what it catches, why it matters, an example and its fix`,
    `- [Playground](${SITE_URL}/playground): run check_ui on code in the browser, against a demo design system`,
    '',
    '## Tools',
    '',
    ...tools.tools.map((tool) => `- \`${tool.name}\`: ${tool.description}`),
    '',
    '## Rules',
    '',
    ...ruleCatalog.rules.map(
      (rule) =>
        `- [\`${rule.id}\`](${SITE_URL}${ruleHref(rule.id)}) (${rule.severity}): ${rule.description}`,
    ),
    '',
    '## Optional',
    '',
    `- [All the docs in one file](${SITE_URL}/llms-full.txt)`,
    `- [These docs over MCP](${SITE_URL}/api/mcp): \`search\`, \`fetch\` and \`list_pages\` for agents, over Streamable HTTP`,
    `- [README](${REPO}#readme)`,
    `- [Benchmark method and per-run results](${repoLink('bench/v2', 'tree')})`,
    `- [npm](${NPM})`,
    `- [MCP Registry](${REGISTRY})`,
    `- [Changelog](${repoLink('CHANGELOG.md')})`,
  ];
  return `${lines.join('\n').replace(/\n{3,}/g, '\n\n')}\n`;
}

/** Every docs page, the rules, the FAQ, the benchmark and the playground, as one Markdown file. */
export function llmsFullTxt(): string {
  // /benchmark and /playground as the docs index has them, without their `# title` (the section
  // has one) and the ids their headings carry for the index's citations.
  const indexed = (markdown: string) =>
    markdown.replace(/^# .*\n+/, '').replace(/ \{#[\w-]+\}$/gm, '');
  const sections: [title: string, page: string, body: string][] = [
    ['Quickstart', '/docs', docs.quickstart],
    ['Claude Code plugin', '/docs/plugin', docs.plugin],
    ['CI and baselines', '/docs/ci', docs.ci],
    ['Make it a required check on agent pull requests', '/docs/required-check', docs.requiredCheck],
    ['Set up your agent', '/docs/clients', docs.clients],
    ['Configuration', '/docs/configuration', docs.configuration],
    ['Design-system packages', '/docs/design-system-packages', docs.designSystemPackages],
    ['Design tokens', '/docs/tokens', docs.tokens],
    ['ESLint plugin', '/docs/eslint', docs.eslint],
    [
      'Rules',
      '/rules',
      [
        ...ruleCatalog.rules.map(
          (rule) =>
            `### ${rule.id} (${rule.severity} by default)\n\n${rule.description}\n\nCatches: ${rule.catches}\n\nSuggests: ${rule.suggests}\n\nWhy it matters: ${rule.why}\n\nExample:\n\n\`\`\`tsx\n${rule.bad.trimEnd()}\n\`\`\`\n\n${rule.findings.map((f) => `- ${String(f.line)}:${String(f.column)} ${f.severity}: ${f.message}`).join('\n')}\n\nFixed:\n\n\`\`\`tsx\n${rule.good.trimEnd()}\n\`\`\``,
        ),
        `### How fixes are chosen\n\n${ruleCatalog.details}`,
        `### Suppressing findings\n\n${ruleCatalog.suppression}`,
      ].join('\n\n'),
    ],
    ['Tools', '/docs/tools', docs.tools],
    ['Troubleshooting', '/docs/troubleshooting', docs.troubleshooting],
    ['FAQ', '/docs/faq', faqMarkdown(corpus)],
    ['How it works', '/docs/how-it-works', docs.howItWorks],
    ['Migrating from @dgesteves/design-system-mcp', '/docs/migrating', docs.migrating],
    ['Benchmark', '/benchmark', indexed(benchmarkMarkdown(benchmark, headlineText(benchmark)))],
    ['Playground', '/playground', indexed(playgroundMarkdown(playground.presets, designSystem))],
  ];
  // Each page's own `##` sections become `###` under its `##` title; code blocks stay as they are.
  const nest = (body: string) => {
    let fenced = false;
    return body
      .split('\n')
      .map((line) => {
        if (/^\s*```/.test(line)) fenced = !fenced;
        return !fenced && /^#{2,5} /.test(line) ? `#${line}` : line;
      })
      .join('\n');
  };
  return `# onsystem\n\n> ${pitch}\n\n${details}\n\n${sections
    .map(([title, page, body]) => `## ${title}\n\n${absolute(nest(withoutMarkers(body)), page)}`)
    .join('\n\n')}\n`;
}
