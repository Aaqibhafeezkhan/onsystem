import { InlineCode } from '@/components/section';
import {
  delta,
  headline,
  perRun,
  perRunInterval,
  percent,
  points,
  pointsInterval,
  row,
  signedPerRun,
  signedPerRunInterval,
  usd,
} from '@/lib/benchmark';
import type { Benchmark } from '@/lib/data';

/**
 * The headline sentence, starting lower case so it can follow a lead-in. The same words as
 * headlineText() in lib/benchmark.ts, with `tsc` as code.
 */
export function Headline({ benchmark }: { benchmark: Benchmark }) {
  const h = headline(benchmark);
  return (
    <>
      design-system rule violations per run, as onsystem {h.version}&apos;s own check counts them,
      went from <strong className="font-semibold text-fg">{h.from}</strong> to{' '}
      <strong className="font-semibold text-cyan">{h.to}</strong> with onsystem&apos;s skill, MCP
      server and hook, with no measurable change in <InlineCode>tsc</InlineCode> pass rate or cost
      per run ({h.perArm} runs per arm, {h.models} models, {h.providers} providers, {h.repos}{' '}
      repositories)
    </>
  );
}

function Stat({
  id,
  label,
  before,
  after,
  note,
}: {
  id: string;
  label: React.ReactNode;
  before: string;
  after: string;
  note: string;
}) {
  return (
    <div data-stat={id} className="rounded-2xl border border-line bg-raised p-5">
      <dt className="text-[13px] font-medium text-fg-soft">{label}</dt>
      <dd className="mt-3 flex flex-wrap items-baseline gap-x-2.5 font-mono tabular-nums">
        <span data-value="before" className="text-2xl text-muted">
          {before}
        </span>
        <span className="text-subtle" aria-label="to">
          →
        </span>
        <span data-value="after" className="text-[1.75rem] font-medium text-fg">
          {after}
        </span>
      </dd>
      <dd data-value="note" className="mt-2 font-mono text-[11.5px] leading-relaxed text-subtle">
        {note}
      </dd>
    </div>
  );
}

/** Without onsystem → with all three parts, pooled over every model. */
export function HeadlineStats({ benchmark }: { benchmark: Benchmark }) {
  const none = row(benchmark, 'all models', 'none');
  const all = row(benchmark, 'all models', 'all');
  const d = delta(benchmark, 'all models', 'all');
  return (
    <dl className="grid gap-4 md:grid-cols-3">
      <Stat
        id="violations"
        // The scorer's name, as tsc's is on the next card: the tool under test counts these.
        label={`onsystem ${benchmark.onsystem} errors per run`}
        before={perRun(none.onsystemErrors.value)}
        after={perRun(all.onsystemErrors.value)}
        note={`difference ${signedPerRun(d.onsystemErrors.value)} ${signedPerRunInterval(d.onsystemErrors)}; without onsystem ${perRunInterval(none.onsystemErrors)}`}
      />
      <Stat
        id="tsc"
        label={
          <>
            <InlineCode>tsc</InlineCode> passes
          </>
        }
        before={percent(none.tscPass.value)}
        after={percent(all.tscPass.value)}
        note={`difference ${points(d.tscPass.value)} points ${pointsInterval(d.tscPass)}`}
      />
      <Stat
        id="cost"
        label="Cost per run"
        before={usd(none.cost.value)}
        after={usd(all.cost.value)}
        note={`without onsystem [${usd(none.cost.low)}, ${usd(none.cost.high)}]`}
      />
    </dl>
  );
}
