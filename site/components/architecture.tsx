import type { ReactNode } from 'react';

import { rules, tools } from '@/lib/data';

/*
 * How onsystem is put together, as HTML rather than the README's SVG: the same four stages
 * (scripts/build-assets.mjs draws them for GitHub), in the site's theme tokens and at reading
 * sizes, so it is legible in a docs column and on a phone, and right in both themes. The tool
 * list and the rule count come from the build's data.
 */

function Stage({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Box({
  title,
  lines,
  accent = false,
  children,
}: {
  title: string;
  lines?: string[];
  accent?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={`h-full rounded-xl border bg-raised px-3.5 py-3 ${accent ? 'border-cyan/40' : 'border-line'}`}
    >
      <p className={`text-[14px] font-semibold ${accent ? 'text-cyan-bright' : 'text-fg'}`}>
        {title}
      </p>
      {lines && (
        <ul className="mt-1 font-mono text-[12px] leading-relaxed text-muted">
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      {children}
    </div>
  );
}

/** The arrow from one stage to the next. */
function Down() {
  return (
    <div className="flex justify-center py-1.5" aria-hidden="true">
      <svg viewBox="0 0 12 24" className="h-6 w-3 text-line-strong">
        <path d="M6 0v19" stroke="currentColor" strokeWidth="1.5" />
        <path d="M1.5 15.5 6 21l4.5-5.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

export function Architecture({ alt }: { alt: string }) {
  return (
    <figure className="my-8 rounded-2xl border border-line bg-raised/40 p-4 sm:p-5">
      <figcaption className="sr-only">{alt}</figcaption>
      <Stage label="Your design system">
        <div className="grid grid-cols-2 gap-2.5">
          <Box title="Components" lines={['components/ui/*.tsx']} />
          <Box title="Tokens" lines={['globals.css', '*.tokens.json (DTCG)']} />
          <Box title="Docs" lines={['docs/*.md, *.mdx']} />
          <Box title="Config (optional)" lines={['onsystem.config']} />
        </div>
      </Stage>
      <Down />
      <Stage label="Extract">
        <div className="grid grid-cols-2 gap-2.5">
          <Box title="TypeScript checker" lines={['props, defaults, JSDoc']} />
          <Box title="cva() / tv() parser" lines={['variants and classes']} />
          <Box title="Token parsers" lines={['DTCG · CSS vars · @theme']} />
          <Box title="Docs parser" lines={['guidelines, examples']} />
        </div>
      </Stage>
      <Down />
      <Stage label="Model">
        <Box
          title="Design-system model"
          lines={['components, tokens, docs; cached on disk, rebuilt on change']}
          accent
        >
          <ul className="mt-3 grid gap-2 sm:grid-cols-3">
            {[
              ['BM25 index', 'intent search'],
              ['Token index', 'nearest color, OKLCH'],
              ['Lint rules', `${String(rules.length)} rules, with fixes`],
            ].map(([title = '', sub = '']) => (
              <li key={title} className="rounded-lg border border-line bg-ink px-3 py-2">
                <p className="text-[13px] font-medium text-fg-soft">{title}</p>
                <p className="font-mono text-[12px] text-subtle">{sub}</p>
              </li>
            ))}
          </ul>
        </Box>
      </Stage>
      <Down />
      <Stage label="Interfaces">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <Box
            title="MCP server · stdio"
            lines={[...tools.tools.map((t) => t.name), ...tools.resources]}
            accent
          />
          <Box
            title="Hook · CLI · CI"
            lines={['Claude Code hook', 'onsystem check', '--format github']}
          />
        </div>
      </Stage>
      <p className="mt-4 border-t border-line pt-3 text-[13px] leading-relaxed text-muted">
        <span className="font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">
          Used by
        </span>{' '}
        Claude Code · Cursor · VS Code · any MCP client, and CI (GitHub annotations, exit codes)
      </p>
    </figure>
  );
}
