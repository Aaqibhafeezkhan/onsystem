import type { Metadata } from 'next';
import Link from 'next/link';

import { Code } from '@/components/code';
import { OnThisPageRail, type TocItem } from '@/components/on-this-page';
import { MarkdownBlocks } from '@/components/markdown-blocks';
import { RuleCard } from '@/components/rule-example';
import { RuleHashRedirect } from '@/components/rule-hash-redirect';
import { SentenceList } from '@/components/sentence-list';
import { Eyebrow, InlineCode, TextLink } from '@/components/section';
import { ruleCatalog } from '@/lib/data';
import { pageMetadata } from '@/lib/metadata';
import { repoLink } from '@/lib/site';

const description =
  'Every check_ui and check rule, with its default severity. Each rule has a page: what it catches, why it matters, the fix it suggests, and a real example.';

export const metadata: Metadata = pageMetadata({
  title: 'Rules',
  socialTitle: 'onsystem rules',
  description,
  path: '/rules',
});

const RULES_CONFIG = `{
  "rules": {
    "no-hardcoded-spacing": "error",
    "no-hardcoded-color": ["error", { "allow": ["#fff"] }],
    "icon-button-accessible-name": "off"
  }
}`;

/** "On this page": each rule's card, then the sections under the list. */
const TOC: TocItem[] = [
  ...ruleCatalog.rules.map((rule) => ({ id: rule.id, label: rule.id, level: 2 })),
  { id: 'known-limits', label: 'Known limits', level: 2 },
  { id: 'configure', label: 'Configuring the rules', level: 2 },
  { id: 'suppressing-findings', label: 'Suppressing findings', level: 2 },
  { id: 'fixes', label: 'How fixes are chosen', level: 2 },
];

export default function RulesPage() {
  const { rules, version, limits, details, suppression } = ruleCatalog;
  return (
    <main id="main" className="relative">
      <div className="glow pointer-events-none absolute inset-x-0 top-0 h-140" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-6xl px-4 pt-12 pb-16 sm:px-6 sm:pt-16 sm:pb-24">
        <div className="max-w-3xl">
          <Eyebrow>Rules</Eyebrow>
          <h1 className="mt-3 text-[2rem] leading-[1.1] font-semibold tracking-[-0.025em] text-balance text-fg sm:text-[2.6rem]">
            Eight rules. Every finding says what to write instead.
          </h1>
          <p className="measure mt-4 text-base leading-relaxed text-muted sm:text-[17px]">
            <InlineCode>check_ui</InlineCode> for the agent, and <InlineCode>check</InlineCode> for
            CI and the Claude Code hook, run the same rules against the design system read from your
            source. Each rule has a page with an example that went through the real linter on the{' '}
            <TextLink href={repoLink('examples/shadcn-demo', 'tree')}>demo design system</TextLink>{' '}
            when the site was built, from version {version}. Try your own in the{' '}
            <Link
              href="/playground"
              className="text-fg underline decoration-line-strong underline-offset-4 hover:decoration-cyan"
            >
              playground
            </Link>
            .
          </p>
        </div>

        <RuleHashRedirect ids={rules.map((rule) => rule.id)} />
        <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-10 lg:mt-14 lg:grid-cols-[minmax(0,1fr)_10.5rem] xl:grid-cols-[minmax(0,1fr)_12rem] xl:gap-12">
          <div className="min-w-0">
            <ul aria-label="Rules" className="grid gap-3 md:grid-cols-2">
              {rules.map((rule) => (
                // The id keeps old links to a rule's section (/rules#no-unknown-prop) landing on it.
                <li key={rule.id} id={rule.id} className="scroll-mt-20">
                  <RuleCard rule={rule} />
                </li>
              ))}
            </ul>

            <div className="mt-14 max-w-3xl">
              <section
                id="known-limits"
                aria-labelledby="known-limits-title"
                className="scroll-mt-20 border-t border-line pt-10 pb-12"
              >
                <h2
                  id="known-limits-title"
                  className="text-xl font-semibold tracking-tight text-fg"
                >
                  Known limits
                </h2>
                <div className="mt-3">
                  <MarkdownBlocks markdown={limits} />
                </div>
              </section>

              <section
                id="configure"
                aria-labelledby="configure-title"
                className="scroll-mt-20 border-t border-line pt-10 pb-12"
              >
                <h2 id="configure-title" className="text-xl font-semibold tracking-tight text-fg">
                  Configuring the rules
                </h2>
                <p className="measure mt-3 text-[15px] leading-relaxed text-muted">
                  Set a rule to <InlineCode>&quot;off&quot;</InlineCode>,{' '}
                  <InlineCode>&quot;warn&quot;</InlineCode> or{' '}
                  <InlineCode>&quot;error&quot;</InlineCode>, or give it values to accept with{' '}
                  <InlineCode>
                    [severity, {'{'} &quot;allow&quot;: [...] {'}'}]
                  </InlineCode>
                  , in <InlineCode>onsystem.config.json</InlineCode>. Rules that need tokens skip
                  themselves when the design system has none of that kind, and code that does not
                  parse is reported under <InlineCode>syntax</InlineCode>.{' '}
                  <Link
                    href="/docs/configuration#config-file"
                    className="text-fg underline decoration-line-strong underline-offset-4 hover:decoration-cyan"
                  >
                    The config file
                  </Link>{' '}
                  covers the rest.
                </p>
                <Code
                  code={RULES_CONFIG}
                  lang="json"
                  title="onsystem.config.json"
                  copy="Copy the config"
                  className="mt-4"
                />
              </section>

              <section
                id="suppressing-findings"
                aria-labelledby="suppressing-findings-title"
                className="scroll-mt-20 border-t border-line pt-10 pb-12"
              >
                <h2
                  id="suppressing-findings-title"
                  className="text-xl font-semibold tracking-tight text-fg"
                >
                  Suppressing findings
                </h2>
                <div className="mt-3">
                  <MarkdownBlocks markdown={suppression} />
                </div>
              </section>

              <section
                id="fixes"
                aria-labelledby="fixes-title"
                className="scroll-mt-20 border-t border-line pt-10"
              >
                <h2 id="fixes-title" className="text-xl font-semibold tracking-tight text-fg">
                  How fixes are chosen
                </h2>
                <SentenceList
                  text={details}
                  className="mt-4 text-[15px] leading-relaxed text-muted"
                />
              </section>
            </div>
          </div>
          <OnThisPageRail items={TOC} className="hidden lg:block" />
        </div>
      </div>
    </main>
  );
}
