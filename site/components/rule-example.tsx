import Link from 'next/link';

import { Line } from '@/components/code';
import { CheckIcon } from '@/components/icons';
import { InlineMarkdown } from '@/components/markdown';
import type { RuleEntry } from '@/lib/data';
import { highlightLines, type Mark } from '@/lib/highlight';
import { ruleHref } from '@/lib/site';

/** A titled code panel, as the rules pages show examples and findings. */
export function Panel({
  title,
  note,
  children,
}: {
  title: string;
  note?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-line bg-[#101317]">
      <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-2">
        <span className="font-mono text-xs text-fg-soft">{title}</span>
        {note && <span className="text-right font-mono text-[11px] text-subtle">{note}</span>}
      </div>
      {children}
    </div>
  );
}

export function MarkedCode({ code, marks }: { code: string; marks: Mark[] }) {
  return (
    <pre
      tabIndex={0}
      className="code overflow-x-auto px-4 py-3 text-[12.5px] leading-[1.7] whitespace-pre-wrap [overflow-wrap:anywhere]"
    >
      <code>
        {highlightLines(code.trimEnd(), 'tsx', marks).map((segments, i) => (
          <span key={i} className="block min-h-[1lh]">
            <Line segments={segments} />
          </span>
        ))}
      </code>
    </pre>
  );
}

export function Severity({ severity }: { severity: RuleEntry['severity'] }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[11px] ${severity === 'error' ? 'border-magenta/40 text-magenta-soft' : 'border-cyan/40 text-cyan'}`}
    >
      <span
        className={`size-1.5 rounded-full ${severity === 'error' ? 'bg-magenta' : 'bg-cyan'}`}
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
                  <span className={f.severity === 'error' ? 'text-magenta-soft' : 'text-cyan'}>
                    {f.severity}
                  </span>
                  <span className="text-subtle">
                    {f.line}:{f.column}
                  </span>
                  {f.fixable && (
                    <span className="inline-flex items-center gap-1 text-subtle">
                      <CheckIcon className="size-3 text-cyan" />
                      fix included
                    </span>
                  )}
                </p>
                <p className="mt-1 text-fg-soft">
                  <InlineMarkdown text={f.message} />
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
    <div className="relative h-full rounded-xl border border-line bg-raised/60 p-4 transition-colors hover:border-line-strong">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <Heading className="font-mono text-[15px] font-medium tracking-tight text-fg">
          <Link
            href={ruleHref(rule.id)}
            className="after:absolute after:inset-0 after:rounded-xl hover:text-cyan-bright"
          >
            {rule.id}
          </Link>
        </Heading>
        <Severity severity={rule.severity} />
      </div>
      <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
        <InlineMarkdown text={rule.description} />
      </p>
    </div>
  );
}
