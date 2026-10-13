import Link from 'next/link';
import type { ReactNode } from 'react';

import { CodeBody } from '@/components/code';
import { CodeFrame } from '@/components/code-frame';
import { FindingMessage } from '@/components/finding-message';
import { ArrowRightIcon, CheckIcon } from '@/components/icons';
import { InlineMarkdown } from '@/components/markdown';
import type { RuleEntry } from '@/lib/data';
import type { Mark } from '@/lib/segments';
import { ruleHref } from '@/lib/site';

/** A titled panel in the shared code frame, as the rules pages show examples and findings. */
export function Panel({
  title,
  note,
  children,
}: {
  title: string;
  note?: ReactNode;
  children: ReactNode;
}) {
  return (
    <CodeFrame
      title={title}
      note={note && <span className="pr-2.5 text-right text-[11px] text-subtle">{note}</span>}
    >
      {children}
    </CodeFrame>
  );
}

/**
 * TSX with findings or changes marked, highlighted by Shiki on the server. Source code scrolls,
 * as every code block does, its right edge faded while more is out of view.
 */
export function MarkedCode({ code, marks }: { code: string; marks: Mark[] }) {
  return <CodeBody code={code.trimEnd()} lang="tsx" marks={marks} />;
}

export function Severity({ severity }: { severity: RuleEntry['severity'] }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[11px] ${severity === 'error' ? 'border-error/40 text-error' : 'border-warn/40 text-warn'}`}
    >
      <span
        className={`size-1.5 rounded-full ${severity === 'error' ? 'bg-error' : 'bg-warn'}`}
        aria-hidden="true"
      />
      {severity === 'error' ? 'error' : 'warning'} by default
    </span>
  );
}

/** The example the rule trips on, the same code after the fix, and what check_ui said. */
export function RuleExample({ rule }: { rule: RuleEntry }) {
  const bad: Mark[] = rule.findings.map((f, id) => ({
    start: f.start,
    end: f.end,
    kind: f.severity,
    id,
  }));
  const good: Mark[] = rule.changes.map((c) => ({ ...c, kind: 'changed' }));
  return (
    <>
      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="What the agent wrote">
          <MarkedCode code={rule.bad} marks={bad} />
        </Panel>
        <Panel
          title="After the fix"
          note={rule.fixedBy === 'rule' ? 'the rule’s own fixes' : 'fixed by hand'}
        >
          <MarkedCode code={rule.good} marks={good} />
        </Panel>
      </div>
      <div className="mt-3">
        <Panel title="check_ui">
          <ol className="grid divide-y divide-line/70">
            {rule.findings.map((f, i) => (
              <li key={i} className="px-4 py-3 text-[14px] leading-relaxed">
                <p className="flex flex-wrap items-baseline gap-x-2 font-mono text-[11.5px]">
                  <span className="out-dim">
                    {f.line}:{f.column}
                  </span>
                  <span className={f.severity === 'error' ? 'out-error' : 'out-warn'}>
                    {f.severity}
                  </span>
                  <span className="out-accent">{rule.id}</span>
                  {f.fixable && (
                    <span className="inline-flex items-center gap-1 out-success">
                      <CheckIcon className="size-3" />
                      fix included
                    </span>
                  )}
                </p>
                <p className="mt-1 text-fg-soft">
                  <FindingMessage text={f.message} />
                </p>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </>
  );
}

/** A rule in a list: its name, linking to its page, its default severity and one line. */
export function RuleCard({ rule, heading = 'h2' }: { rule: RuleEntry; heading?: 'h2' | 'h3' }) {
  const Heading = heading;
  return (
    // The same layout for every rule, whatever the length of its name: name, severity, one line.
    <div className="group relative flex h-full flex-col rounded-xl border border-line bg-raised/60 p-4 transition-colors hover:border-line-strong sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <Heading className="min-w-0 font-mono text-[15px] font-medium tracking-tight break-words text-fg">
          <Link
            href={ruleHref(rule.id)}
            className="after:absolute after:inset-0 after:rounded-xl group-hover:text-cyan-bright"
          >
            {rule.id}
          </Link>
        </Heading>
        <ArrowRightIcon
          className="mt-0.5 size-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-cyan"
          aria-hidden="true"
        />
      </div>
      <div className="mt-2.5">
        <Severity severity={rule.severity} />
      </div>
      <p className="mt-3 text-[14.5px] leading-relaxed text-muted">
        <InlineMarkdown text={rule.description} />
      </p>
    </div>
  );
}
