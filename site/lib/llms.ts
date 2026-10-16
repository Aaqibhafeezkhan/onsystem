import { benchmarkMarkdown, playgroundMarkdown } from '@/lib/agent-markdown';
import * as benchmarkFormat from '@/lib/benchmark';
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

/**
 * What a visitor gives their agent to have it set onsystem up, as @shadcn/lint's quickstart gives
 * one for its SETUP.md: the home page's first screen and step 2 of the quickstart offer it.
 */
export const SETUP_PROMPT = `Read ${SITE_URL}/setup.md and set up onsystem in this project.`;

/** The code of the block titled `title` in a docs page, so /setup.md shows what the docs show. */
function titled(markdown: string, title: string): { lang: string; code: string } {
  const at = markdown.indexOf(` title="${title}"\n`);
  const lang = /```(\w+)$/.exec(markdown.slice(0, at))?.[1];
  if (at === -1 || !lang) throw new Error(`No code block titled ${title} in the docs`);
  const start = markdown.indexOf('\n', at) + 1;
  return { lang, code: markdown.slice(start, markdown.indexOf('\n```', start)) };
}

/** A fenced code block, indented to sit in a list item. */
function fence({ lang, code }: { lang: string; code: string }, indent = ''): string {
  return [`\`\`\`${lang}`, ...code.split('\n'), '```'].map((line) => indent + line).join('\n');
}

/**
 * /setup.md: the steps an agent follows to set onsystem up in the project it is working in. The
 * configs and the workflow are the ones docs/rollout.md and docs/required-check.md give.
 */
export function setupMd(): string {
  const config = (file: string) => fence(titled(docs.rollout, file), '  ');
  const [marketplace, install] = PLUGIN_COMMANDS.split('\n');
  const node = readme.engines.node.replace('>=', '');
  return `# Set up onsystem

These are the steps to set onsystem up in the user's project. onsystem keeps coding agents on the project's design system: it reads the components, their props and variants, and the tokens from source, gives the agent MCP tools to look them up and \`check_ui\` to check its own UI code, and checks pull requests in CI. Make only the changes below, and ask the user before anything else, such as fixing what it finds.

The docs are at ${SITE_URL}/docs, and all of them in one file at ${SITE_URL}/llms-full.txt.

## 1. Look at the project

- onsystem checks React (\`.tsx\` and \`.jsx\`) and needs Node.js ${node} or later. If the project has no React UI, stop and tell the user.
- Find the package manager from the lockfile, and whether this is one app or a monorepo. If the dependencies are not installed, install them first: without them, the props of components that wrap a library (Radix, React Aria) are not read.
- Set it up in the folder that CI will check: the app's folder, or the root of a monorepo, where each app and design-system package is checked against its own design system.

## 2. Write the config and record the baseline

In that folder, run:

\`\`\`sh
npx -y onsystem init --yes
\`\`\`

It writes \`onsystem.config.json\` from the components and tokens it finds, checks the project once, and records the findings already in the code in \`onsystem.baseline.json\`, so that the check fails only on new ones. Keep what it prints for step 5.

- If it says a config already exists, keep that config: do not pass \`--force\`.
- If it found no design system, run \`npx -y onsystem inspect --explain\` to see where it looked, ask the user where the components and tokens are, and run it again with them: \`npx -y onsystem init --yes --components "src/components/ui/**/*.tsx" --tokens src/app/globals.css\`.

## 3. Add it to your agent

Add onsystem to the agent you are running in, in files the repository keeps, so the whole team gets it. Merge into a file that is already there; do not replace it.

- **Claude Code**: the plugin, with the hook that checks each file Claude writes, the MCP server and the skill. \`.claude/settings.json\`:

${config('.claude/settings.json')}

  Claude Code loads it the next time it starts in this folder, once the user accepts the folder's trust prompt. Do not add onsystem to \`.mcp.json\` as well: both register the same tools. To install it for the user alone instead, they run \`${marketplace ?? ''}\`, then \`${install ?? ''}\`.
- **Cursor**: the MCP server. \`.cursor/mcp.json\`:

${config('.cursor/mcp.json')}

- **VS Code**: the MCP server, for Copilot agent mode. \`.vscode/mcp.json\`:

${config('.vscode/mcp.json')}

- **Codex CLI**: the plugin, with the MCP server and the skill: \`codex plugin marketplace add dgesteves/onsystem\`, then \`codex plugin add onsystem@dgesteves\`.
- **Any other agent**: the MCP server runs over stdio as \`${NPX} --root <the project's absolute path>\`, and [Set up your agent](${SITE_URL}/docs/clients#other-clients) has the config for each client. If the project has an \`AGENTS.md\`, add this line to it:

${config('AGENTS.md')}

## 4. Check pull requests

On GitHub, add \`.github/workflows/onsystem.yml\`. It runs the GitHub Action, which checks the lines each pull request changes, leaves out the findings in the baseline, and fails on errors:

${fence(titled(docs.requiredCheck, '.github/workflows/onsystem.yml'))}

Install the dependencies the way the project does: with pnpm, add \`pnpm/action-setup\` before \`actions/setup-node\` and run \`pnpm install --frozen-lockfile\` ([Roll out to a team](${SITE_URL}/docs/rollout#gate-pull-requests)). When the folder from step 1 is not the root, give the action that folder as \`working-directory\` ([GitHub Action](${SITE_URL}/docs/required-check)). On another CI, run \`${NPX} check . --require-design-system\` in that folder.

## 5. Check it works, and report

1. Run \`${NPX} check . --require-design-system\` in the folder from step 1. It exits with code 0: the findings already there are in the baseline. Code 2 means it found no design system or could not read the config: go back to step 2.
2. Tell the user:
   - the files you added or changed, to review and commit: \`onsystem.config.json\`, \`onsystem.baseline.json\`, and the agent's and CI's files;
   - what \`init\`'s check found, by rule, and that \`${NPX} check . --ignore-baseline\` lists each finding with its fix;
   - what is left for them to do, such as restarting the agent so it loads the plugin or the MCP server.
3. Leave the findings as they are unless the user asks you to fix them.
`;
}

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
    `To set onsystem up in a project, follow ${SITE_URL}/setup.md: the config and baseline (\`npx -y onsystem init --yes\`), the agent's plugin or MCP config, and the CI check. A person can give their agent this prompt: "${SETUP_PROMPT}"`,
    '',
    'Install:',
    '',
    `- Claude Code (hook, MCP server and skill): \`${PLUGIN_COMMANDS.split('\n').join('` then `')}\``,
    '- CI: `npx onsystem check . --format github --require-design-system`, with `--update-baseline` once to accept existing findings',
    '- Required check on pull requests: the GitHub Action `uses: dgesteves/onsystem@v0`, which annotates the lines a pull request changed',
    `- Any MCP client, over stdio: \`${NPX}\``,
    '',
    `Benchmark (${benchmark.date}): ${benchmarkFormat.headlineText(benchmark)}. Tables, method and blind labels: ${SITE_URL}/benchmark`,
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
    ['Roll out to a team', '/docs/rollout', docs.rollout],
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
        `### Known limits\n\n${ruleCatalog.limits}`,
        `### How fixes are chosen\n\n${ruleCatalog.details}`,
        `### Suppressing findings\n\n${ruleCatalog.suppression}`,
      ].join('\n\n'),
    ],
    ['Tools', '/docs/tools', docs.tools],
    ['Troubleshooting', '/docs/troubleshooting', docs.troubleshooting],
    ['FAQ', '/docs/faq', faqMarkdown(corpus)],
    ['How it works', '/docs/how-it-works', docs.howItWorks],
    ['Migrating from @dgesteves/design-system-mcp', '/docs/migrating', docs.migrating],
    ['Benchmark', '/benchmark', indexed(benchmarkMarkdown(benchmark, benchmarkFormat))],
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
