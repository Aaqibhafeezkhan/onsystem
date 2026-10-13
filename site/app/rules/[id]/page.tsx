import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { Code } from '@/components/code';
import { ArrowRightIcon } from '@/components/icons';
import { InlineMarkdown } from '@/components/markdown';
import { MarkedCode, Panel, RuleCard, RuleExample, Severity } from '@/components/rule-example';
import { Eyebrow, InlineCode, TextLink } from '@/components/section';
import { SentenceList } from '@/components/sentence-list';
import { ruleCatalog, type RuleEntry } from '@/lib/data';
import { pageMetadata } from '@/lib/metadata';
import { plainText, repoLink, ruleHref } from '@/lib/site';

// One page per rule, all built ahead of time; any other id is a 404.
export const dynamicParams = false;

export function generateStaticParams(): { id: string }[] {
  return ruleCatalog.rules.map((rule) => ({ id: rule.id }));
}

function findRule(id: string): RuleEntry | undefined {
  return ruleCatalog.rules.find((rule) => rule.id === id);
}

/** The rule's description, and its default and example when that still fits a search result. */
function ruleDescription(rule: { description: string; severity: string }): string {
  const description = plainText(rule.description);
  const more = `${description} ${rule.severity === 'error' ? 'An error' : 'A warning'} by default, with an example and its fix.`;
  return more.length <= 160 ? more : description;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const rule = findRule((await params).id);
  if (!rule) return {};
  return pageMetadata({
    title: rule.id,
    socialTitle: `${rule.id} · onsystem rules`,
    description: ruleDescription(rule),
    path: ruleHref(rule.id),
  });
}

function Block({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-20 border-t border-line pt-9 pb-10"
    >
      <h2 id={`${id}-title`} className="text-xl font-semibold tracking-tight text-fg">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const prose = 'measure text-[15.5px] leading-relaxed text-muted';

export default async function RulePage({ params }: { params: Promise<{ id: string }> }) {
  const rule = findRule((await params).id);
  if (!rule) notFound();
  const { rules, version, details, suppressionScope } = ruleCatalog;
  const index = rules.indexOf(rule);
  const previous = rules[index - 1];
  const next = rules[index + 1];
  const related = rule.related
    .map((id) => rules.find((r) => r.id === id))
    .filter((r): r is RuleEntry => r !== undefined);
  const fixable = rule.findings.filter((f) => f.fixable).length;
  const other = rule.severity === 'error' ? 'warn' : 'error';
  const config = `{
  "rules": {
    "${rule.id}": "${other}"
  }
}`;
  const comment = rule.suppressed.code.split('\n')[rule.suppressed.line - 1] ?? '';
  const commentStart = rule.suppressed.code.indexOf(comment) + comment.search(/\S/);

  return (
    <main id="main" className="relative">
      <div className="glow pointer-events-none absolute inset-x-0 top-0 h-140" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-6xl px-4 pt-12 pb-16 sm:px-6 sm:pt-16 sm:pb-24">
        <nav aria-label="Breadcrumb" className="text-[13px] text-muted">
          <Link href="/rules" className="hover:text-fg">
            Rules
          </Link>
          <span className="px-2 text-subtle" aria-hidden="true">
            /
          </span>
          <span className="font-mono text-fg-soft" aria-current="page">
            {rule.id}
          </span>
        </nav>

        <div className="mt-6 max-w-3xl">
          <Eyebrow>Rule</Eyebrow>
          <h1 className="mt-3 font-mono text-[1.6rem] leading-[1.15] font-medium tracking-tight break-words text-fg sm:text-[2.2rem]">
            {rule.id}
          </h1>
          <div className="mt-4">
            <Severity severity={rule.severity} />
          </div>
          <p className="measure mt-4 text-base leading-relaxed text-fg-soft sm:text-[17px]">
            <InlineMarkdown text={rule.description} />
          </p>
        </div>

        <dl className="mt-8 grid max-w-4xl gap-5 text-[15px] leading-relaxed md:grid-cols-2">
          <div>
            <dt className="font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">
              What it catches
            </dt>
            <dd className="mt-1.5 text-muted">
              <InlineMarkdown text={rule.catches} />
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">
              Why it matters
            </dt>
            <dd className="mt-1.5 text-muted">
              <InlineMarkdown text={rule.why} />
            </dd>
          </div>
        </dl>

        <div className="mt-10">
          <Block id="example" title="Example">
            <p className={`${prose} mb-5`}>
              What <InlineCode>check_ui</InlineCode> returned for this code against the{' '}
              <TextLink href={repoLink('examples/shadcn-demo', 'tree')}>
                demo design system
              </TextLink>{' '}
              when the site was built, from version {version}.
            </p>
            <RuleExample rule={rule} />
          </Block>

          <Block id="fixes" title="How the fix is chosen">
            <div className={prose}>
              <p>
                <InlineMarkdown text={rule.suggests} />.
              </p>
              <p className="mt-3">
                {fixable === rule.findings.length ? (
                  <>
                    Every finding in the example carries its fix as text edits, which the agent
                    applies, and so does <InlineCode>eslint --fix</InlineCode>.
                  </>
                ) : (
                  `${String(fixable)} of the ${String(rule.findings.length)} findings in the example carry a fix as text edits; the others say what to write instead.`
                )}{' '}
                {rule.fixedBy === 'rule'
                  ? 'The code after the fix is those edits, applied.'
                  : 'The code after the fix needed a decision, so it was written by hand and checked clean.'}
              </p>
              {rule.id.startsWith('no-hardcoded-') && (
                <SentenceList text={details} className="mt-4" />
              )}
            </div>
          </Block>

          <Block id="options" title="Options">
            <div className={prose}>
              <p>
                Its default severity is{' '}
                <InlineCode>&quot;{rule.severity === 'error' ? 'error' : 'warn'}&quot;</InlineCode>.
                Set it to <InlineCode>&quot;off&quot;</InlineCode>,{' '}
                <InlineCode>&quot;warn&quot;</InlineCode> or{' '}
                <InlineCode>&quot;error&quot;</InlineCode> in{' '}
                <InlineCode>onsystem.config.json</InlineCode>, or as{' '}
                <InlineCode>onsystem/{rule.id}</InlineCode> in the{' '}
                <TextLink href="/docs/eslint">ESLint plugin</TextLink>.
              </p>
              {rule.allow && (
                <p className="mt-3">
                  <InlineMarkdown text={rule.allow} />
                </p>
              )}
            </div>
            <Code
              code={config}
              lang="json"
              title="onsystem.config.json"
              copy="Copy the config"
              className="mt-4 max-w-xl"
            />
            <p className="mt-4 text-[14px] text-muted">
              <TextLink href="/docs/configuration#config-file">The config file</TextLink> covers the
              rest, including <InlineCode>overrides</InlineCode> for folders.
            </p>
          </Block>

          <Block id="suppressing" title="Suppressing a finding">
            <p className={prose}>
              When a finding is intended, a comment turns the rule off for the next line and says
              why after <InlineCode>--</InlineCode>. Checked when the site was built: the comment
              hides the finding on the line below it, and the others stay.
            </p>
            <div className="mt-4 max-w-3xl">
              <Panel title="With the comment">
                <MarkedCode
                  code={rule.suppressed.code}
                  marks={[
                    {
                      start: commentStart,
                      end: rule.suppressed.code.indexOf(comment) + comment.length,
                      kind: 'changed',
                    },
                  ]}
                />
              </Panel>
            </div>
            <p className={`${prose} mt-4`}>
              <InlineMarkdown text={suppressionScope} />
            </p>
          </Block>

          {related.length > 0 && (
            <Block id="related" title="Related rules">
              <ul className="grid gap-3 md:grid-cols-2">
                {related.map((r) => (
                  <li key={r.id}>
                    <RuleCard rule={r} heading="h3" />
                  </li>
                ))}
              </ul>
            </Block>
          )}
        </div>

        <nav
          aria-label="Previous and next rule"
          className="mt-4 grid gap-3 border-t border-line pt-8 sm:grid-cols-2"
        >
          {previous ? (
            <Link
              href={ruleHref(previous.id)}
              className="rounded-xl border border-line bg-raised px-4 py-3 transition-colors hover:border-line-strong"
            >
              <span className="block text-[12px] text-subtle">Previous</span>
              <span className="font-mono text-[14px] font-medium break-words text-fg">
                {previous.id}
              </span>
            </Link>
          ) : (
            <Link
              href="/rules"
              className="rounded-xl border border-line bg-raised px-4 py-3 transition-colors hover:border-line-strong"
            >
              <span className="block text-[12px] text-subtle">Back to</span>
              <span className="text-[14px] font-medium text-fg">All rules</span>
            </Link>
          )}
          {next && (
            <Link
              href={ruleHref(next.id)}
              className="group rounded-xl border border-line bg-raised px-4 py-3 text-right transition-colors hover:border-line-strong"
            >
              <span className="block text-[12px] text-subtle">Next</span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[14px] font-medium break-all text-fg">
                {next.id}
                <ArrowRightIcon className="size-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-cyan" />
              </span>
            </Link>
          )}
        </nav>
      </div>
    </main>
  );
}
