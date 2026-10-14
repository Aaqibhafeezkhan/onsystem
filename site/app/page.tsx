import type { Metadata } from 'next';
import Link from 'next/link';
import { Fragment, type ReactNode } from 'react';

import { Headline, HeadlineStats } from '@/components/benchmark-summary';
import { CodeBody } from '@/components/code';
import { Line } from '@/components/code-line';
import { CodeScroll } from '@/components/code-scroll';
import { CopyButton } from '@/components/copy-button';
import { ArrowRightIcon, ArrowUpRightIcon, CheckIcon } from '@/components/icons';
import { InstallPanel, StarButton } from '@/components/install';
import { LoopDemo } from '@/components/loop-demo';
import { InlineMarkdown } from '@/components/markdown';
import { InlineCode, Section, SubSection, TextLink } from '@/components/section';
import { Tabs } from '@/components/tabs';
import { count } from '@/lib/benchmark';
import { benchmark, corpus, demo, readme, rules, tools } from '@/lib/data';
import { pageMetadata } from '@/lib/metadata';
import { findingCard, HOME_CARD, TSC_RULES } from '@/lib/og';
import { highlight } from '@/lib/render-code';
import {
  AUTHOR,
  CURSOR_INSTALL,
  docsHref,
  NPM,
  NPX,
  PLUGIN_COMMANDS,
  REGISTRY,
  REPO,
  repoLink,
  SITE_URL,
  VSCODE_INSTALL,
} from '@/lib/site';

const title = 'onsystem: keeps coding agents on your design system';
// 160 characters at most: search results cut longer descriptions off.
const description =
  'Keeps coding agents on your design system: catches palette colors, native elements and APIs your system lacks, at every edit and PR, with the fix. Runs locally.';

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
      <HowItWorks />
      <ShadcnLint />
      <WorksWith />
      <Adoption />
      <FinalCta />
    </main>
  );
}

// ─── The first screen and the loop ─────────────────────────────────────────

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

/** What a visitor runs first: findings with fixes on their own app, nothing installed or written. */
const CHECK = 'npx -y onsystem check .';

/** The commands from docs/clients.md and docs/required-check.md (test/first-screen.test.ts checks). */
const CODEX =
  'codex plugin marketplace add dgesteves/onsystem\ncodex plugin add onsystem@dgesteves';
const ACTION = '- uses: dgesteves/onsystem@v0';
const MARKETPLACE = 'https://github.com/marketplace/actions/onsystem-design-system-check';

function Hero() {
  return (
    <div className="relative">
      <div className="glow pointer-events-none absolute inset-x-0 top-0 h-180" aria-hidden="true" />
      <div
        className="grid-lines pointer-events-none absolute inset-x-0 top-0 h-160"
        aria-hidden="true"
      />
      <div className="relative mx-auto w-full max-w-6xl px-4 pt-12 pb-12 sm:px-6 sm:pt-16 lg:pt-20">
        {/* Wide: the copy and the calls to action on the left, the card on the right. Phones: the
            copy, the card, then the calls to action. */}
        <div className="grid items-start gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_28rem] xl:grid-cols-[minmax(0,1fr)_32rem]">
          <div className="min-w-0">
            <h1 className="text-[2.15rem] leading-[1.08] font-semibold tracking-[-0.03em] text-balance text-fg sm:text-5xl lg:text-[3.15rem]">
              Keeps coding agents on your design system.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-fg-soft sm:text-xl">
              Catches palette colors, native elements and APIs your design system lacks in
              agent-written React, at every edit and pull request, with the fix. Set it up once in
              your design-system package; every app in your monorepo gets it.
            </p>
          </div>
          <FindingCard className="lg:row-span-2 lg:mt-1.5" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <CheckCommand />
              <GetStarted />
            </div>
            <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-muted">
              See what it finds in your app. No install, no config. Items from other shadcn
              registries count as your code until you set them apart:{' '}
              <TextLink href="/docs/configuration#code-from-shadcn-registries">
                Code from shadcn registries
              </TextLink>
              .
            </p>
            <Link
              href="/playground"
              className="group mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-fg-soft transition-colors hover:text-fg"
            >
              Try it in the browser
              <ArrowRightIcon className="size-4 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-cyan" />
            </Link>
            <InstallTabs />
          </div>
        </div>
        <ProofRow />

        <div id="demo" className="mt-14 scroll-mt-20 sm:mt-16">
          <LoopDemo
            prompt={demo.prompt}
            file={demo.file}
            // Highlighted here, on the server, so the browser gets colours and no highlighter.
            draft={
              highlight(demo.draft.trimEnd(), 'tsx', {
                marks: demo.findings.map((f, id) => ({
                  start: f.start,
                  end: f.end,
                  kind: f.severity,
                  id,
                })),
              }).lines
            }
            fixed={
              highlight(demo.fixed.trimEnd(), 'tsx', {
                marks: demo.changes.map((c) => ({ ...c, kind: 'changed' })),
              }).lines
            }
            findings={demo.findings.map((f) => ({
              ruleId: f.ruleId,
              severity: f.severity,
              line: f.line,
              column: f.column,
              found: f.found,
              fix: f.fix,
              message: f.message,
            }))}
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

/** The command to copy, as a terminal line with its copy button. */
function CheckCommand() {
  return (
    <div
      data-hero-command=""
      className="code flex h-9.5 max-w-full min-w-0 items-center gap-2 rounded-lg border border-line-strong bg-code pr-1 pl-3.5 text-[13.5px]"
    >
      <code className="min-w-0 truncate">
        <span className="out-prompt" aria-hidden="true">
          $
        </span>{' '}
        <span className="text-fg">{CHECK}</span>
      </code>
      <CopyButton text={CHECK} label="Copy the check command" bare />
    </div>
  );
}

/**
 * Three of the demo draft's findings as the agent gets them, with the line it wrote, and what
 * `tsc` reports of the whole draft. The social card draws the same card (lib/og.tsx).
 */
function FindingCard({ className = '' }: { className?: string }) {
  const card = findingCard();
  const tsx = (code: string, mark?: { start: number; end: number }) =>
    highlight(code, 'tsx', { marks: mark ? [{ ...mark, kind: 'error' }] : [] }).lines[0] ?? [];
  const row = (line: number, code: ReactNode) => (
    <span className="flex gap-3">
      <span className="w-6 shrink-0 text-right text-subtle select-none" aria-hidden="true">
        {line}
      </span>
      <span>{code}</span>
    </span>
  );
  return (
    <figure
      data-finding-card=""
      className={`code-block min-w-0 shadow-[0_32px_100px_-40px_var(--site-shadow)] ${className}`}
    >
      <div className="code-bar pr-4">
        <span className="code-title">{card.file}</span>
        <span className="shrink-0 out-accent">check_ui</span>
      </div>
      {/* Source code scrolls rather than wraps: a phone shows each finding's span, and the rest
          of a long line is a swipe away. */}
      <CodeScroll className="code code-body p-0 text-[12px] leading-[1.65]">
        <span className="block min-w-max divide-y divide-line/70">
          {card.findings.map((f) => (
            <span key={f.ruleId} className="grid gap-1 px-3.5 py-3.5 sm:px-4">
              <code className="grid gap-0.5">
                {f.ruleId === 'prefer-design-system-component' &&
                  row(card.imports.line, <Line segments={tsx(card.imports.code)} />)}
                {row(f.line, <Line segments={tsx(f.code, f.mark)} />)}
              </code>
              <span className="flex items-baseline gap-x-2 pl-9 text-[11.5px]">
                <span className={f.severity === 'error' ? 'out-error' : 'out-warn'}>
                  {f.severity === 'error' ? 'error' : 'warn'}
                </span>
                <span className="out-accent">{f.ruleId}</span>
              </span>
              <span className="block pl-9">
                <span className="out-string">{f.found}</span>
                <span className="out-dim"> → </span>
                <span className="out-success">{f.fix}</span>
              </span>
            </span>
          ))}
        </span>
      </CodeScroll>
      <figcaption className="flex items-center gap-2 border-t border-line bg-chrome px-4 py-2.5 font-mono text-[12px] text-fg-soft">
        <CheckIcon className="size-4 shrink-0 text-success" aria-hidden="true" />
        <span>
          <span className="text-muted">
            tsc {card.tsc}/{card.total}
          </span>
          {' · '}
          <span className="text-success">
            onsystem {card.total}/{card.total}
          </span>
          {' on this draft'}
        </span>
      </figcaption>
    </figure>
  );
}

/** One command or one-click link per agent, and the CI check. */
function InstallTabs() {
  const note = (children: ReactNode) => (
    <p className="border-b border-line/70 px-4 py-2.5 text-[13px] leading-relaxed text-muted">
      {children}
    </p>
  );
  const oneClick = (href: string, label: string, children: ReactNode) => (
    <div className="grid gap-3 px-4 py-3.5">
      <a
        href={href}
        className="group inline-flex min-h-11 w-fit items-center gap-2 rounded-lg border border-line bg-raised-2 px-3.5 py-2 text-sm font-medium text-fg transition-colors hover:border-line-strong hover:bg-raised-3"
      >
        {label}
        <ArrowUpRightIcon className="size-4 shrink-0 text-subtle transition-colors group-hover:text-cyan" />
      </a>
      <p className="text-[13px] leading-relaxed text-muted">{children}</p>
    </div>
  );
  return (
    <div className="mt-6">
      <Tabs
        label="Install for"
        // No-break spaces keep each label on one line; the row fits beside the card from 1024 px.
        labels={['Claude\u00a0Code', 'Cursor', 'VS\u00a0Code', 'Codex', 'Other\u00a0MCP', 'CI']}
        copies={[PLUGIN_COMMANDS, undefined, undefined, CODEX, NPX, ACTION]}
      >
        {[
          <Fragment key="claude-code">
            {note(
              <>
                Installs the MCP server (shows the agent your components and tokens) and hook
                (checks every edit), with the skill.{' '}
                <TextLink href={docsHref('claude-code-plugin')}>The plugin</TextLink>
              </>,
            )}
            <CodeBody code={PLUGIN_COMMANDS} lang="text" />
          </Fragment>,
          <Fragment key="cursor">
            {oneClick(
              CURSOR_INSTALL,
              'Add the MCP server to Cursor',
              <>
                With your workspace as its root.{' '}
                <TextLink href={docsHref('cursor-and-vs-code')}>The config to commit</TextLink>
              </>,
            )}
          </Fragment>,
          <Fragment key="vs-code">
            {oneClick(
              VSCODE_INSTALL,
              'Add the MCP server to VS Code',
              <>
                With your workspace as its root.{' '}
                <TextLink href={docsHref('cursor-and-vs-code')}>The config to commit</TextLink>
              </>,
            )}
          </Fragment>,
          <Fragment key="codex">
            {note(
              <>
                The MCP server and the skill, from the same marketplace as the Claude Code plugin.{' '}
                <TextLink href={docsHref('setup')}>Other agents</TextLink>
              </>,
            )}
            <CodeBody code={CODEX} lang="sh" />
          </Fragment>,
          <Fragment key="other">
            {note(
              <>
                Any client that starts servers over stdio.{' '}
                <TextLink href={docsHref('other-clients')}>A config for each</TextLink>
              </>,
            )}
            <CodeBody code={`$ ${NPX}`} lang="sh" />
          </Fragment>,
          <Fragment key="action">
            {note(
              <>
                Checks the lines each pull request changes, and fails on errors.{' '}
                <TextLink href={docsHref('required-check')}>The workflow</TextLink>
              </>,
            )}
            <CodeBody code={ACTION} lang="yaml" />
          </Fragment>,
        ]}
      </Tabs>
    </div>
  );
}

/** Measured or checkable items only, from the generated data. */
function ProofRow() {
  const item = 'flex items-start gap-2.5 text-[13.5px] leading-snug text-muted';
  const dot = <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-cyan" aria-hidden="true" />;
  return (
    <ul
      data-proof-row=""
      className="mt-12 grid gap-x-8 gap-y-3 border-t border-line pt-6 sm:grid-cols-2 lg:mt-14 lg:grid-cols-5"
    >
      <li className={item}>
        {dot}
        <span>{demo.checkMs.toFixed(1)} ms to check the demo file. No model calls.</span>
      </li>
      <li className={item}>
        {dot}
        <span>
          Checked nightly on{' '}
          <TextLink href={repoLink('corpus', 'tree')}>{corpus.repos} public repos</TextLink>, pinned
          by commit.
        </span>
      </li>
      <li className={item}>
        {dot}
        <span>
          shadcn/ui, <TextLink href={docsHref('zero-config')}>your own package</TextLink>, or MUI.
        </span>
      </li>
      <li className={item}>
        {dot}
        <span>
          <TextLink href={REGISTRY}>MCP Registry</TextLink> ·{' '}
          <TextLink href={MARKETPLACE}>GitHub Marketplace</TextLink>
        </span>
      </li>
      <li className={item}>
        {dot}
        <Link
          href="/benchmark"
          className="group font-medium text-fg-soft transition-colors hover:text-fg"
        >
          Benchmark: {count(benchmark.runs)} agent runs, {benchmark.models.length} models
          <ArrowRightIcon className="ml-1 inline size-4 -translate-y-px text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-cyan" />
        </Link>
      </li>
    </ul>
  );
}

function Problem() {
  const errors = demo.errorCount + demo.warningCount;
  const tsc = demo.findings.filter((f) => TSC_RULES.has(f.ruleId)).length;
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
            On the draft above, <InlineCode>tsc</InlineCode> reports {tsc} of the {errors} problems:
            the invalid variant, the unknown prop and the missing member. It has no opinion on hex
            colors, off-scale spacing, native elements or accessible names. Review catches the rest,
            when someone has the time.
          </p>
        </>
      }
      aside={<CaughtBy tsc={tsc} />}
    />
  );
}

/** The demo draft's findings, and which of them `tsc` reports as well as `check_ui`. */
function CaughtBy({ tsc }: { tsc: number }) {
  const mark = (caught: boolean, who: string) =>
    caught ? (
      <>
        <CheckIcon className="mx-auto size-4 text-success" aria-hidden="true" />
        <span className="sr-only">{who} reports it</span>
      </>
    ) : (
      <>
        <span className="text-subtle" aria-hidden="true">
          –
        </span>
        <span className="sr-only">{who} misses it</span>
      </>
    );
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-raised">
      <table className="w-full text-left text-[13px]">
        <caption className="border-b border-line px-4 py-3 text-left text-[13px] font-medium text-fg">
          The draft, checked by each
        </caption>
        <thead className="font-mono text-[11px] tracking-[0.12em] text-subtle uppercase">
          <tr className="border-b border-line">
            <th scope="col" className="px-4 py-2 font-medium">
              In the draft
            </th>
            <th scope="col" className="w-16 px-2 py-2 text-center font-medium normal-case">
              tsc
            </th>
            <th scope="col" className="w-20 px-2 py-2 pr-4 text-center font-medium normal-case">
              check_ui
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line/60">
          {demo.findings.map((f, i) => (
            <tr key={i}>
              <th scope="row" className="px-4 py-1.5 font-normal">
                <span className="block font-mono text-[12.5px] out-string">{f.found}</span>
                <span className="block font-mono text-[11px] out-accent">{f.ruleId}</span>
              </th>
              <td className="px-2 py-1.5 text-center">{mark(TSC_RULES.has(f.ruleId), 'tsc')}</td>
              <td className="px-2 py-1.5 pr-4 text-center">{mark(true, 'check_ui')}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t border-line font-mono text-[12px]">
          <tr>
            <th scope="row" className="px-4 py-2.5 text-left font-medium text-fg-soft">
              Reported
            </th>
            <td className="px-2 py-2.5 text-center text-muted">
              {tsc}/{demo.findings.length}
            </td>
            <td className="px-2 py-2.5 pr-4 text-center text-success">
              {demo.findings.length}/{demo.findings.length}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
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
          className="group font-medium text-fg-soft transition-colors hover:text-fg"
        >
          The tables by arm and model, the blind labels, the method and how to reproduce{' '}
          <span className="whitespace-nowrap">
            it
            <ArrowRightIcon className="ml-1.5 inline size-4 -translate-y-px text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-cyan" />
          </span>
        </Link>
      </p>
      <RealCodebases />
    </Section>
  );
}

function RealCodebases() {
  const { intro, rows } = readme.realCodebases;
  return (
    <SubSection
      id="real-codebases"
      title="On real codebases, with zero config"
      lead={
        <>
          <p>
            <InlineMarkdown text={intro} />
          </p>
          {/* No false-positive rate until a sample can give one: test/claims.test.ts checks. */}
          <p className="mt-3">
            How often it is wrong: the <TextLink href={repoLink('corpus', 'tree')}>corpus</TextLink>{' '}
            runs <InlineCode>check</InlineCode> on {corpus.repos} public repositories pinned by
            commit ({corpus.runs} runs, {corpus.findings.toLocaleString('en-US')} distinct findings)
            and compares the findings with labels made by an AI reviewer. Those labels do not give a
            false-positive rate for all findings yet: the runs and rules they cover hold under half
            of the findings, and most of the false positives they found have been fixed, so what is
            left under-counts them. The rate will come from a fresh seeded sample, published with
            its confidence interval and who labelled it.
          </p>
        </>
      }
    >
      <ul className="grid gap-4 lg:grid-cols-3">
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
    </SubSection>
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
                  className={`shrink-0 font-mono text-[11px] ${rule.severity === 'error' ? 'text-error' : 'text-warn'}`}
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
      {/* The tools' responses on the demo design system are on /docs/tools. */}
      <p className="mt-6 text-[15px] leading-relaxed text-muted">
        <Link
          href={docsHref('tools')}
          className="group font-medium text-fg-soft transition-colors hover:text-fg"
        >
          What the agent sees: each tool&apos;s response on the demo design{' '}
          <span className="whitespace-nowrap">
            system
            <ArrowRightIcon className="ml-1.5 inline size-4 -translate-y-px text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-cyan" />
          </span>
        </Link>
      </p>
    </Section>
  );
}

// ─── Positioning ────────────────────────────────────────────────────────────

/** A check mark, or a dash, with what it means for screen readers. */
function Has({ yes, who }: { yes: boolean; who: string }) {
  return yes ? (
    <>
      <CheckIcon className="mx-auto size-4 text-success" aria-hidden="true" />
      <span className="sr-only">{who}: yes</span>
    </>
  ) : (
    <>
      <span className="text-subtle" aria-hidden="true">
        –
      </span>
      <span className="sr-only">{who}: no</span>
    </>
  );
}

function ShadcnLint() {
  // [what, onsystem, @shadcn/lint]: a check mark, a dash, or what to say in the cell.
  const rows: [React.ReactNode, boolean | string, boolean | string][] = [
    [
      <>
        Raw colors in classes and inline styles (<InlineCode>bg-[#ef4444]</InlineCode>)
      </>,
      true,
      true,
    ],
    [
      <>
        Arbitrary values (<InlineCode>p-[13px]</InlineCode>, <InlineCode>rounded-[7px]</InlineCode>)
      </>,
      true,
      true,
    ],
    [
      <>
        Native elements the design system wraps (<InlineCode>&lt;button&gt;</InlineCode> →{' '}
        <InlineCode>&lt;Button&gt;</InlineCode>)
      </>,
      true,
      false,
    ],
    [
      <>
        Components, props and variant values your design system lacks (
        <InlineCode>&lt;Card.Header&gt;</InlineCode>, <InlineCode>tone</InlineCode>,{' '}
        <InlineCode>&quot;danger&quot;</InlineCode>)
      </>,
      true,
      false,
    ],
    ['Icon-only buttons without an accessible name', true, false],
    ['Restyling a component with classes it should not take', false, true],
    ['Unknown and dynamic classes', false, true],
    ['Per-component contracts you write', false, true],
    [
      'Each edit in Claude Code, and your components and tokens for the agent over MCP',
      true,
      false,
    ],
    [
      'Tailwind v3, design-system packages, and apps that import one from a workspace package',
      true,
      false,
    ],
    ['Svelte and Vue', false, true],
    [
      <>
        Reads a shadcn/ui project through <InlineCode>components.json</InlineCode>
      </>,
      true,
      true,
    ],
    ['Runs as', 'ESLint 9 and 10', 'ESLint 9.30+, Oxlint'],
  ];
  const cell = (value: boolean | string, who: string) =>
    typeof value === 'string' ? (
      <span className="text-[12.5px] text-fg-soft">{value}</span>
    ) : (
      <Has yes={value} who={who} />
    );
  return (
    <Section
      id="shadcn-lint"
      eyebrow="Alongside @shadcn/lint"
      title="Different layers. Run both."
      lead={
        <p>
          <TextLink href="https://github.com/shadcn-ui/lint">@shadcn/lint</TextLink> is a linter: it
          polices the classes written against a component and the theme, in React, Svelte and Vue,
          on Tailwind v4. onsystem checks agent-written React against your design system at the edit
          and in CI, and hands the agent the fix.
        </p>
      }
    >
      <div className="overflow-hidden rounded-xl border border-line bg-raised">
        <table className="w-full text-left text-[14px] leading-relaxed">
          <caption className="sr-only">What onsystem and @shadcn/lint each check</caption>
          <thead className="font-mono text-[11px] tracking-[0.12em] text-subtle uppercase">
            <tr className="border-b border-line">
              <th scope="col" className="px-4 py-2.5 font-medium">
                Check
              </th>
              <th
                scope="col"
                className="w-24 px-2 py-2.5 text-center font-medium normal-case sm:w-36"
              >
                onsystem
              </th>
              <th
                scope="col"
                className="w-24 px-2 py-2.5 pr-4 text-center font-medium normal-case sm:w-36"
              >
                @shadcn/lint
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {rows.map(([what, ours, theirs], i) => (
              <tr key={i}>
                <th scope="row" className="px-4 py-2 font-normal text-muted">
                  {what}
                </th>
                <td className="px-2 py-2 text-center">{cell(ours, 'onsystem')}</td>
                <td className="px-2 py-2 pr-4 text-center">{cell(theirs, '@shadcn/lint')}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
  const { findings } = corpus.baseline;
  return (
    <Section
      id="baseline"
      eyebrow="Adopting it"
      title="An existing codebase fails only on new findings."
      lead={
        <p>
          Record the findings already there in a baseline once (midday&apos;s dashboard has{' '}
          {findings.toLocaleString('en-US')}), and <InlineCode>check</InlineCode> fails only on new
          ones:{' '}
          <TextLink href={docsHref('adopting-it-in-an-existing-codebase')}>
            adopting it in an existing codebase
          </TextLink>
          .
        </p>
      }
    />
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
            Run <InlineCode>{CHECK}</InlineCode> in your app to see what it finds, with no install
            and no config. If it gets something wrong on your codebase, an issue with the snippet is
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
