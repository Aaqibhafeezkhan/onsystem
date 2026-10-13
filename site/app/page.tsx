import type { Metadata } from 'next';
import Link from 'next/link';
import { Fragment } from 'react';

import { Headline, HeadlineStats } from '@/components/benchmark-summary';
import { Code } from '@/components/code';
import { ArrowRightIcon, CheckIcon } from '@/components/icons';
import { InstallPanel, StarButton } from '@/components/install';
import { LoopDemo } from '@/components/loop-demo';
import { InlineMarkdown } from '@/components/markdown';
import { Eyebrow, InlineCode, Section, TextLink } from '@/components/section';
import { headline } from '@/lib/benchmark';
import { benchmark, corpus, demo, readme, rules, tools } from '@/lib/data';
import { pageMetadata } from '@/lib/metadata';
import { HOME_CARD } from '@/lib/og';
import { AUTHOR, docsHref, NPM, REPO, repoLink, SITE_URL } from '@/lib/site';

const title = 'onsystem: keeps coding agents on your design system';
// 160 characters at most: search results cut longer descriptions off.
const description =
  'Keeps coding agents on your design system: catches invented components, props, variants and tokens, has the agent fix them, and gates PRs. Local, zero config.';

// The home page's own title, canonical URL and cards; the root layout sets none of them.
export const metadata: Metadata = {
  ...pageMetadata({
    title,
    socialTitle: title,
    description,
    path: '/',
    image: HOME_CARD.path,
    imageAlt: HOME_CARD.alt,
    imageSize: HOME_CARD.size,
  }),
  title: { absolute: title },
};

/** What search engines get as structured data. */
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareSourceCode',
  name: 'onsystem',
  description,
  url: SITE_URL,
  codeRepository: REPO,
  programmingLanguage: 'TypeScript',
  runtimePlatform: 'Node.js',
  version: tools.version,
  license: 'https://opensource.org/licenses/MIT',
  sameAs: [REPO, NPM],
  author: { '@type': 'Person', name: AUTHOR.name, url: AUTHOR.url },
};

export default function Home() {
  return (
    <main id="main">
      <script
        type="application/ld+json"
        // Static data from this file; nothing user-supplied.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <Hero />
      <Problem />
      <Proof />
      <RealCodebases />
      <HowItWorks />
      <AgentView />
      <ShadcnLint />
      <WorksWith />
      <Adoption />
      <FinalCta />
    </main>
  );
}

// ─── Hero and the loop ──────────────────────────────────────────────────────

/** The primary call to action: the quickstart. */
function GetStarted() {
  return (
    <Link
      href="/docs"
      className="group inline-flex items-center gap-1.5 rounded-lg border border-cyan bg-cyan px-3.5 py-2 text-sm font-semibold text-ink transition-colors hover:border-cyan-bright hover:bg-cyan-bright"
    >
      Get started
      <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function Hero() {
  const result = headline(benchmark);
  return (
    <div className="relative">
      <div className="glow pointer-events-none absolute inset-x-0 top-0 h-180" aria-hidden="true" />
      <div
        className="grid-lines pointer-events-none absolute inset-x-0 top-0 h-160"
        aria-hidden="true"
      />
      <div className="relative mx-auto w-full max-w-6xl px-4 pt-14 pb-12 sm:px-6 sm:pt-20 lg:pt-24">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_28.5rem] lg:gap-14">
          <div>
            {/* Lines break only after a separator, and balance so the last item is not alone. */}
            <Eyebrow className="text-balance">
              {['Claude Code hook', 'CI check', 'MCP server', 'MIT'].map((item, i) => (
                <Fragment key={item}>
                  {i > 0 && '\u00a0· '}
                  <span className="whitespace-nowrap">{item}</span>
                </Fragment>
              ))}
            </Eyebrow>
            <h1 className="mt-5 text-[2.15rem] leading-[1.08] font-semibold tracking-[-0.03em] text-balance text-fg sm:text-5xl lg:text-[3.15rem]">
              Keeps coding agents on your design system.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-fg-soft sm:text-xl">
              It knows your real components, props, variants and tokens, catches the moment an agent
              invents one and has it fix it, and the same check gates your PRs. Local, zero config,
              works alongside{' '}
              <TextLink href="https://github.com/shadcn-ui/lint">@shadcn/lint</TextLink>.
            </p>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted sm:text-base">
              In Claude Code, the plugin&apos;s hook checks each file right after it is written and
              hands the errors back, each with its fix. Other agents run{' '}
              <InlineCode>check_ui</InlineCode> on their own output, and the CI check gates whatever
              they wrote. Built for design-system and platform teams with a React design-system
              package; a shadcn/ui app works with no config at all.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              <GetStarted />
              <StarButton />
              <Link
                href="/benchmark"
                className="group inline-flex items-center gap-1.5 text-sm font-medium text-fg-soft transition-colors hover:text-fg"
              >
                {`Rule violations per run: ${result.from} → ${result.to} over ${result.runs} runs`}
                <ArrowRightIcon className="size-4 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-cyan" />
              </Link>
            </div>
          </div>
          <InstallPanel className="lg:mt-2" />
        </div>

        <div className="mt-14 sm:mt-20">
          <LoopDemo
            prompt={demo.prompt}
            file={demo.file}
            draftCode={demo.draft.trimEnd()}
            fixedCode={demo.fixed.trimEnd()}
            findings={demo.findings.map((f) => ({
              ruleId: f.ruleId,
              start: f.start,
              end: f.end,
              severity: f.severity,
              line: f.line,
              column: f.column,
              found: f.found,
              fix: f.fix,
              message: f.message,
            }))}
            changes={demo.changes}
            errorCount={demo.errorCount}
            warningCount={demo.warningCount}
          />
          <p className="mt-4 text-[13px] leading-relaxed text-subtle">
            Real output: the findings and fixes are what <InlineCode>check_ui</InlineCode> returns
            for this file against the{' '}
            <TextLink href={repoLink('examples/shadcn-demo', 'tree')}>demo design system</TextLink>,
            generated when this site was built.{' '}
            <Link
              href="/playground"
              className="group inline-flex items-center gap-1 font-medium text-fg-soft transition-colors hover:text-fg"
            >
              Try it on your own code
              <ArrowRightIcon className="size-3.5 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-cyan" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Problem() {
  const errors = demo.errorCount + demo.warningCount;
  return (
    <Section
      id="problem"
      eyebrow="The problem"
      title="Your agent can't see your Storybook. TypeScript only catches part of it."
      lead={
        <>
          <p>
            Ask for a settings card in a shadcn/ui project and you get{' '}
            <InlineCode>bg-[#ef4444]</InlineCode>, <InlineCode>p-[13px]</InlineCode>, a native{' '}
            <InlineCode>&lt;button&gt;</InlineCode> with hand-rolled classes,{' '}
            <InlineCode>variant=&quot;danger&quot;</InlineCode> on a <InlineCode>Button</InlineCode>{' '}
            that only knows <InlineCode>destructive</InlineCode>, and an icon button nobody can name
            with a screen reader.
          </p>
          <p className="mt-4">
            On the draft above, <InlineCode>tsc</InlineCode> reports 3 of the {errors} problems: the
            invalid variant, the unknown prop and the missing member. It has no opinion on hex
            colors, off-scale spacing, native elements or accessible names. Review catches the rest,
            when someone has the time.
          </p>
        </>
      }
    />
  );
}

// ─── Proof ──────────────────────────────────────────────────────────────────

function Proof() {
  return (
    <Section
      id="benchmark"
      eyebrow="Does it help?"
      title="The same tasks, with and without onsystem."
      lead={
        <p>
          In the benchmark of {benchmark.date}, <Headline benchmark={benchmark} />.
        </p>
      }
    >
      <p className="mb-3 text-[13px] text-muted">
        No onsystem → skill, MCP server and hook, all {benchmark.models.length} models pooled, with
        95% intervals.
      </p>
      <HeadlineStats benchmark={benchmark} />
      <p className="mt-6 text-[15px] leading-relaxed text-muted">
        <Link
          href="/benchmark"
          className="group inline-flex items-center gap-1.5 font-medium text-fg-soft transition-colors hover:text-fg"
        >
          The tables by arm and model, the blind labels, the method and how to reproduce it
          <ArrowRightIcon className="size-4 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-cyan" />
        </Link>
      </p>
    </Section>
  );
}

function RealCodebases() {
  const { intro, rows } = readme.realCodebases;
  return (
    <section
      aria-labelledby="real-codebases-title"
      id="real-codebases"
      className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20"
    >
      <div className="max-w-3xl">
        <h3
          id="real-codebases-title"
          className="text-xl font-semibold tracking-tight text-fg sm:text-2xl"
        >
          On real codebases, with zero config
        </h3>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          <InlineMarkdown text={intro} />
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          How often it is wrong is measured, not guessed: the{' '}
          <TextLink href={repoLink('corpus', 'tree')}>corpus</TextLink> runs{' '}
          <InlineCode>check</InlineCode> on {corpus.repos} public repositories pinned by commit (
          {corpus.runs} runs, {corpus.findings.toLocaleString('en-US')} distinct findings) and
          compares the findings with labels. In a random sample of {corpus.sample},{' '}
          {corpus.truePositives} are clearly right, {corpus.debatable} debatable and{' '}
          {corpus.falsePositives} false positives (
          {((corpus.falsePositives / corpus.sample) * 100).toFixed(1)}%); weighted by run and rule,
          about {(corpus.weightedRate * 100).toFixed(1)}% of all findings are false positives.
        </p>
      </div>
      <ul className="mt-8 grid gap-4 lg:grid-cols-3">
        {rows.map(([project = '', found = '', findings = '']) => (
          <li key={project} className="rounded-2xl border border-line bg-raised p-5">
            <p className="font-mono text-[13px] text-fg-soft">
              <InlineMarkdown text={project} />
            </p>
            <dl className="mt-4 grid gap-3 text-[14px] leading-relaxed">
              <div>
                <dt className="text-[12px] text-subtle">Found with zero config</dt>
                <dd className="mt-0.5 text-fg-soft">
                  <InlineMarkdown text={found} />
                </dd>
              </div>
              <div>
                <dt className="text-[12px] text-subtle">
                  <InlineCode>check</InlineCode> findings
                </dt>
                <dd className="mt-0.5 text-muted">
                  <InlineMarkdown text={findings} />
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─── How it works ───────────────────────────────────────────────────────────

function Card({
  step,
  title,
  children,
}: {
  step: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-line bg-raised p-5 sm:p-6">
      <p className="font-mono text-xs text-subtle">{step}</p>
      <h3 className="mt-2 text-lg font-semibold tracking-tight text-fg">{title}</h3>
      <div className="mt-3 flex-1 text-[14.5px] leading-relaxed text-muted">{children}</div>
    </div>
  );
}

function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="mt-3 grid gap-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="mt-2.25 size-1 shrink-0 rounded-full bg-cyan" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function HowItWorks() {
  return (
    <Section
      id="how-it-works"
      eyebrow="How it works"
      title="Reads your source. Checks every edit. Gates the pull request."
      lead={
        <p>
          Static analysis from start to finish: no model calls, no API key, and it runs offline. One
          check of the demo file takes {demo.checkMs.toFixed(1)} ms, so it can run after every edit.
        </p>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Card step="01" title="Reads your design system">
          <p>
            One TypeScript program over your component files, with your{' '}
            <InlineCode>tsconfig</InlineCode>, so path aliases and dependency types resolve.
          </p>
          <Bullets
            items={[
              'Props, with types, defaults and JSDoc',
              <>
                <InlineCode>cva()</InlineCode> and <InlineCode>tv()</InlineCode> variants, and the
                classes each applies
              </>,
              <>
                Parts: <InlineCode>CardHeader</InlineCode> next to <InlineCode>Card</InlineCode>, or{' '}
                <InlineCode>Card.Header</InlineCode>
              </>,
              'The native element each component wraps',
              <>
                Tokens from CSS variables, Tailwind v4 <InlineCode>@theme</InlineCode> or a v3
                config, and DTCG JSON
              </>,
              'Docs and examples from Markdown next to the components',
            ]}
          />
          <p className="mt-4 border-t border-line pt-4">
            No config for a shadcn/ui <InlineCode>components.json</InlineCode>, an app whose
            components live in a workspace package (<InlineCode>@acme/ui</InlineCode>), or the
            design-system package itself.{' '}
            <TextLink href={docsHref('zero-config')}>How it finds them</TextLink>.
          </p>
        </Card>
        <Card step="02" title="Checks every edit and every pull request">
          <p>
            In Claude Code, the plugin&apos;s hook runs these rules right after each file is written
            and hands the errors back for Claude to fix. In CI, <InlineCode>check</InlineCode> or
            the <TextLink href={docsHref('required-check')}>GitHub Action</TextLink> runs them on
            every pull request, and the <TextLink href={docsHref('eslint')}>ESLint plugin</TextLink>{' '}
            runs them wherever ESLint 9 or 10 runs.
          </p>
          <ul className="mt-3 grid gap-1.5">
            {rules.map((rule) => (
              <li key={rule.id} className="flex items-baseline justify-between gap-3">
                <span className="truncate font-mono text-[12.5px] text-fg-soft">{rule.id}</span>
                <span
                  className={`shrink-0 font-mono text-[11px] ${rule.severity === 'error' ? 'text-magenta-soft' : 'text-cyan'}`}
                >
                  {rule.severity}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-line pt-4">
            Any agent can run them itself as <InlineCode>check_ui</InlineCode>, which parses the
            code on its own, so it works on fragments the agent has not saved.
          </p>
        </Card>
        <Card step="03" title="Answers the agent over MCP">
          <ul className="grid gap-3">
            {tools.tools.map((tool) => (
              <li key={tool.name}>
                <p className="font-mono text-[13px] text-cyan-bright">{tool.name}</p>
                <p className="text-[13.5px]">{tool.title}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-line pt-4">
            Plus{' '}
            {tools.resources.map((r, i) => (
              <span key={r}>
                {i > 0 && ' and '}
                <InlineCode>{r}</InlineCode>
              </span>
            ))}{' '}
            as resources, and a <InlineCode>{tools.prompts[0]?.name}</InlineCode> prompt. Every tool
            is read-only.
          </p>
        </Card>
      </div>
    </Section>
  );
}

/** `{ "name": "Badge" }`, with code arguments shown as code rather than an escaped string. */
function formatCall(tool: string, args: Record<string, unknown>): string {
  const parts = Object.entries(args).map(([key, value]) =>
    typeof value === 'string' && key === 'code'
      ? `${key}:\n${value}`
      : `${key}: ${JSON.stringify(value)}`,
  );
  return `> ${tool} ${parts.join(', ')}`;
}

function AgentView() {
  const sample = (tool: string) => tools.samples.find((s) => s.tool === tool);
  const component = sample('get_component');
  const check = sample('check_ui');
  const hook = `⏺ Write(app/promo/page.tsx)
  ⎿  PostToolUse hook: app/promo/page.tsx breaks the project's design system
     1:58 error [no-hardcoded-color] Hardcoded color \`bg-[#f5f5f5]\` → \`bg-muted\`.
     1:77 error [prefer-design-system-component] Native <button> where the design system has <Button>.
     …
⏺ The hook flagged five issues. Looking up Button and the color tokens before fixing.
⏺ onsystem - get_component (MCP)(name: "Button")
⏺ Write(app/promo/page.tsx)   →   <Button variant="destructive"> on bg-muted, hook passes`;
  return (
    <section
      aria-labelledby="agent-view-title"
      className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20"
    >
      <h3
        id="agent-view-title"
        className="text-xl font-semibold tracking-tight text-fg sm:text-2xl"
      >
        What the agent sees
      </h3>
      <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-muted">
        Compact Markdown for the model, with JSON <InlineCode>structuredContent</InlineCode> for
        programs. These are the server&apos;s responses on the demo design system, captured when
        this site was built.
      </p>
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {component && (
          <div className="relative min-h-104 min-w-0 lg:row-span-2">
            <Code
              code={`${formatCall('get_component', component.args)}\n\n${component.output}`}
              lang="text"
              title="get_component"
              className="flex h-full max-h-120 flex-col lg:absolute lg:inset-0 lg:max-h-none [&>div:last-child]:min-h-0 [&>div:last-child]:flex-1 [&_pre]:h-full [&_pre]:overflow-auto"
            />
          </div>
        )}
        {check && (
          <Code
            code={`${formatCall('check_ui', check.args)}\n\n${check.output}`}
            lang="text"
            title="check_ui"
            wrap
          />
        )}
        <Code code={hook} lang="text" title="Claude Code, with the plugin's hook" wrap />
      </div>
    </section>
  );
}

// ─── Positioning ────────────────────────────────────────────────────────────

function Column({
  title,
  tone,
  items,
}: {
  title: string;
  tone: 'cyan' | 'muted';
  items: React.ReactNode[];
}) {
  return (
    <div className="rounded-2xl border border-line bg-raised p-5 sm:p-6">
      <h3
        className={`text-[15px] font-semibold ${tone === 'cyan' ? 'text-cyan-bright' : 'text-fg'}`}
      >
        {title}
      </h3>
      <ul className="mt-4 grid gap-2.5 text-[14px] leading-relaxed text-muted">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2.5">
            <CheckIcon
              className={`mt-0.75 size-4 shrink-0 ${tone === 'cyan' ? 'text-cyan' : 'text-subtle'}`}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ShadcnLint() {
  return (
    <Section
      id="shadcn-lint"
      eyebrow="Alongside @shadcn/lint"
      title="Different layers. Running both is a sensible setup."
      lead={
        <p>
          <TextLink href="https://github.com/shadcn-ui/lint">@shadcn/lint</TextLink> is a linter: it
          polices the classes written against a component and the theme, in React, Svelte and Vue,
          on Tailwind v4. onsystem checks that the components, props and variant values the agent
          used exist, and in Claude Code has the agent fix them right after the edit.
        </p>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Column
          title="Both"
          tone="muted"
          items={[
            <>
              Read your components and theme through <InlineCode>components.json</InlineCode> in a
              shadcn/ui project
            </>,
            <>
              Flag raw colors in classes (<InlineCode>bg-[#ef4444]</InlineCode>) and inline styles
            </>,
            <>
              Flag arbitrary values (<InlineCode>p-[13px]</InlineCode>,{' '}
              <InlineCode>rounded-[7px]</InlineCode>)
            </>,
            'Run as ESLint rules: onsystem in ESLint 9 and 10, @shadcn/lint in 9.30+',
          ]}
        />
        <Column
          title="onsystem adds"
          tone="cyan"
          items={[
            'A Claude Code hook that checks each file after it is written and has the agent fix what it invented, and the same check in CI',
            <>
              Components, props and variant values that do not exist (
              <InlineCode>&lt;Card.Header&gt;</InlineCode>, <InlineCode>tone</InlineCode>,{' '}
              <InlineCode>&quot;danger&quot;</InlineCode>)
            </>,
            <>
              Native elements the design system wraps (<InlineCode>&lt;button&gt;</InlineCode> →{' '}
              <InlineCode>&lt;Button&gt;</InlineCode>)
            </>,
            'Icon-only buttons without an accessible name',
            'Ground truth before the agent writes, over MCP, and check_ui as a tool for any agent',
            'Tailwind v3 as well as v4, design-system packages, and apps that import one from a workspace package',
          ]}
        />
        <Column
          title="@shadcn/lint adds"
          tone="muted"
          items={[
            'Restyling a component with classes it should not take',
            'Unknown and dynamic classes',
            'Per-component contracts you write',
            'Svelte and Vue, as well as React',
            'Runs as Oxlint rules',
          ]}
        />
      </div>
    </Section>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <li className="rounded-lg border border-line bg-raised px-3 py-2 text-[14px] text-fg-soft">
      {children}
    </li>
  );
}

function WorksWith() {
  const clients = [
    'Claude Code',
    'Cursor',
    'VS Code',
    'Claude Desktop',
    'Codex CLI',
    'GitHub Copilot CLI',
    'Windsurf',
    'JetBrains IDEs',
    'Zed',
    'Gemini CLI',
    'Grok Build',
    'Any stdio MCP client',
  ];
  const stacks = [
    'shadcn/ui',
    'Radix',
    'Base UI',
    'React Aria Components',
    'Tailwind v3 and v4',
    'pnpm, npm, Yarn and Bun workspaces',
    'Design-system packages',
    'W3C DTCG tokens',
  ];
  return (
    <Section
      id="works-with"
      eyebrow="Works with"
      title="Your agent, your stack."
      lead={
        <p>
          React only (<InlineCode>.tsx</InlineCode> and <InlineCode>.jsx</InlineCode>), with Node.js{' '}
          {readme.engines.node.replace('>=', '')} or later. Styling is checked in Tailwind classes,{' '}
          <InlineCode>style</InlineCode> objects and color attributes, not in CSS-in-JS or CSS
          Modules. The full list of <TextLink href={docsHref('limits')}>limits</TextLink> is in the
          docs.
        </p>
      }
    >
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-medium text-fg">Agents and editors</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {clients.map((c) => (
              <Chip key={c}>{c}</Chip>
            ))}
          </ul>
          <p className="mt-4 text-[14px] text-muted">
            Configs for each are in the <TextLink href={docsHref('setup')}>setup guide</TextLink>.
            The same rules run in ESLint 9 and 10 with the{' '}
            <TextLink href={docsHref('eslint')}>ESLint plugin</TextLink>, and on pull requests with
            the <TextLink href={docsHref('required-check')}>GitHub Action</TextLink>.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-fg">Codebases</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {stacks.map((c) => (
              <Chip key={c}>{c}</Chip>
            ))}
          </ul>
          <p className="mt-4 text-[14px] text-muted">
            Other layouts take a <TextLink href={docsHref('configuration')}>config file</TextLink>{' '}
            with a few globs.
          </p>
        </div>
      </div>
    </Section>
  );
}

function Adoption() {
  // midday's dashboard, as the corpus snapshot records it.
  const n = (value: number) => value.toLocaleString('en-US');
  const { findings, flagged, files } = corpus.baseline;
  const baseline = `$ npx -y onsystem check src --update-baseline
Baseline: ${n(findings)} findings in ${n(flagged)} files → onsystem.baseline.json

$ npx -y onsystem check src
No new problems in ${n(files)} files (${n(findings)} in the baseline).`;
  const ci = `- run: npx onsystem check . --format github --require-design-system`;
  return (
    <Section
      id="baseline"
      eyebrow="Adopting it"
      title="An existing codebase fails only on new findings."
      lead={
        <p>
          An established app can start with hundreds of findings: midday&apos;s dashboard has{' '}
          {n(findings)}. Record them once, commit the file, and <InlineCode>check</InlineCode> fails
          only on what is new.
        </p>
      }
    >
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Code code={baseline} lang="sh" title="Baseline" copy="Copy the baseline commands" wrap />
        <div className="grid content-start gap-4">
          <ul className="grid gap-2.5 text-[14.5px] leading-relaxed text-muted">
            {[
              'Entries are keyed by file, rule and the offending text, with a count, not by line: edits elsewhere in a file do not invalidate them.',
              'When findings get fixed, check says so and prints the command that drops them, which locks the progress in.',
              'The baseline is for the CLI: check_ui still shows the agent every finding in the file it is editing.',
            ].map((item) => (
              <li key={item} className="flex gap-2.5">
                <span className="mt-2.5 size-1 shrink-0 rounded-full bg-cyan" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Code
            code={ci}
            lang="yaml"
            title=".github/workflows/ci.yml"
            copy="Copy the CI step"
            wrap
          />
          <p className="text-[14px] leading-relaxed text-muted">
            <InlineCode>--format github</InlineCode> turns findings into pull request annotations.{' '}
            <InlineCode>--require-design-system</InlineCode> fails the job when the globs stop
            matching, so CI cannot pass by checking nothing.{' '}
            <TextLink href={docsHref('ci')}>More on CI</TextLink>.
          </p>
        </div>
      </div>
    </Section>
  );
}

function FinalCta() {
  return (
    <section
      aria-labelledby="start-title"
      className="relative overflow-hidden border-t border-line"
    >
      <div className="glow pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[minmax(0,1fr)_28.5rem] lg:gap-14">
        <div>
          <h2
            id="start-title"
            className="text-[1.75rem] leading-[1.15] font-semibold tracking-[-0.02em] text-balance text-fg sm:text-4xl"
          >
            Hold your agent to the design system you already have.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-[17px]">
            Install it, then run <InlineCode>npx -y onsystem inspect</InlineCode> in your app to see
            what it found. If it gets something wrong on your codebase, an issue with the snippet is
            the most useful thing you can send.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <GetStarted />
            <StarButton />
            <a
              href={`${REPO}/issues/new/choose`}
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-fg-soft transition-colors hover:text-fg"
            >
              Report a false positive
              <ArrowRightIcon className="size-4 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-cyan" />
            </a>
          </div>
        </div>
        <InstallPanel />
      </div>
    </section>
  );
}
