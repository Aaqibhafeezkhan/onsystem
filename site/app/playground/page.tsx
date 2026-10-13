import type { Metadata } from 'next';

import { InlineMarkdown } from '@/components/markdown';
import { Playground } from '@/components/playground';
import { Eyebrow, InlineCode, TextLink } from '@/components/section';
import { designSystem } from '@/lib/data';
import { PLAYGROUND_LIMITS, playground } from '@/lib/playground';
import { pageMetadata } from '@/lib/metadata';
import { repoLink } from '@/lib/site';

const description =
  'Run check_ui in the browser: edit a component or pick an agent draft, and see the findings and fixes against a demo design system. Parsed, never run.';

export const metadata: Metadata = pageMetadata({
  title: 'Playground: try check_ui',
  socialTitle: 'Try check_ui in the browser',
  description,
  path: '/playground',
});

export default function PlaygroundPage() {
  const colors = designSystem.tokens.color ?? 0;
  const radius = designSystem.tokens.radius ?? 0;
  return (
    <main id="main" className="relative">
      <div className="glow pointer-events-none absolute inset-x-0 top-0 h-140" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-6xl px-4 pt-12 pb-16 sm:px-6 sm:pt-16 sm:pb-24">
        <div className="max-w-3xl">
          <Eyebrow>Playground</Eyebrow>
          <h1 className="mt-3 text-[2rem] leading-[1.1] font-semibold tracking-[-0.025em] text-balance text-fg sm:text-[2.6rem]">
            Try <span className="font-mono text-[0.9em] tracking-[-0.04em]">check_ui</span> on a
            real design system.
          </h1>
          <p className="measure mt-4 text-base leading-relaxed text-muted sm:text-[17px]">
            Edit the code or pick a draft. It is checked against the{' '}
            <TextLink href={repoLink('examples/shadcn-demo', 'tree')}>demo design system</TextLink>{' '}
            by the same rules the MCP server and the CLI run, on a server that parses the code and
            never runs it.
          </p>
        </div>

        <div className="mt-8 sm:mt-10">
          <Playground presets={playground.presets} maxBytes={PLAYGROUND_LIMITS.maxBytes} />
        </div>

        <section
          aria-labelledby="demo-ds-title"
          className="mt-14 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-10"
        >
          <div>
            <h2 id="demo-ds-title" className="text-lg font-semibold tracking-tight text-fg">
              What the demo design system has
            </h2>
            <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
              Five shadcn/ui-style components built with <InlineCode>cva</InlineCode> and Radix, and
              Tailwind v4 tokens: {colors} colors and {radius} radius steps on Tailwind&apos;s
              spacing scale. Anything else is unknown to the checker, as it would be in your
              project.
            </p>
            <p className="mt-3 text-[14.5px] leading-relaxed text-muted">
              Import from <InlineCode>@/components/ui/…</InlineCode>, or leave imports out: names
              resolve either way.
            </p>
          </div>
          {/* One row per component, so no count of components leaves a card alone in a grid. */}
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-raised">
            {designSystem.components.map((c) => (
              <li
                key={c.name}
                className="grid gap-x-6 gap-y-1.5 px-4 py-4 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:px-5"
              >
                <p className="font-mono text-[13px]">
                  <span className="out-tag">&lt;{c.name}&gt;</span>
                  {c.element && (
                    <span className="block text-[12px] text-subtle">
                      renders &lt;{c.element}&gt;
                    </span>
                  )}
                </p>
                <div className="min-w-0">
                  {c.description && (
                    <p className="text-[14px] leading-relaxed text-muted">
                      <InlineMarkdown text={c.description} />
                    </p>
                  )}
                  {Object.entries(c.variants).map(([name, values]) => (
                    <p
                      key={name}
                      className="mt-2 font-mono text-[12px] leading-relaxed text-fg-soft"
                    >
                      <span className="text-subtle">{name}: </span>
                      {values.map((value, i) => (
                        <span key={value}>
                          {i > 0 && <span className="text-subtle"> · </span>}
                          <span className="out-string">{value}</span>
                        </span>
                      ))}
                    </p>
                  ))}
                  {c.parts.length > 0 && (
                    <p className="mt-2 font-mono text-[12px] leading-relaxed text-fg-soft">
                      <span className="text-subtle">parts: </span>
                      {c.parts.map((part, i) => (
                        <span key={part}>
                          {i > 0 && <span className="text-subtle">, </span>}
                          <span className="out-tag">{part}</span>
                        </span>
                      ))}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
