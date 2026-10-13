import type { ReactNode } from 'react';

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={`font-mono text-[11.5px] font-medium tracking-[0.16em] text-cyan uppercase ${className}`}
    >
      {children}
    </p>
  );
}

/**
 * A page section with an eyebrow, a heading and an optional lead paragraph. `aside` sits beside
 * the heading and lead on wide screens (below them on phones), so a section of text still has
 * something to look at. The home page's sections share this one spacing scale: 128 px between
 * sections on wide screens, sub-sections (`SubSection`) 80 px below what comes before them.
 */
export function Section({
  id,
  eyebrow,
  title,
  lead,
  aside,
  children,
  className = '',
}: {
  id?: string;
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const headingId = id ? `${id}-title` : undefined;
  const intro = (
    <div className="max-w-3xl">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2
        id={headingId}
        className="mt-3 text-[1.75rem] leading-[1.15] font-semibold tracking-[-0.02em] text-balance text-fg sm:text-4xl"
      >
        {title}
      </h2>
      {lead && (
        <div className="measure mt-4 text-base leading-relaxed text-muted sm:text-[17px]">
          {lead}
        </div>
      )}
    </div>
  );
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={`mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 ${className}`}
    >
      {aside ? (
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] lg:gap-14">
          {intro}
          {aside}
        </div>
      ) : (
        intro
      )}
      {children && <div className="mt-10 sm:mt-12">{children}</div>}
    </section>
  );
}

/** A titled part of a section: an h3 and a lead, then its content. */
export function SubSection({
  id,
  title,
  lead,
  children,
}: {
  id: string;
  title: ReactNode;
  lead: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mt-16 sm:mt-20">
      <h3
        id={`${id}-title`}
        className="text-xl font-semibold tracking-tight text-balance text-fg sm:text-2xl"
      >
        {title}
      </h3>
      <div className="measure mt-3 text-[15px] leading-relaxed text-muted">{lead}</div>
      <div className="mt-8">{children}</div>
    </section>
  );
}

/** Code spans longer than this may wrap; shorter ones stay on one line, as a phone's column fits them. */
const SHORT_CODE = 28;

/**
 * Inline code that never breaks inside a flag or a class name (`--root`, `border-destructive`):
 * short code stays on one line, longer code wraps only between its words, and a single word
 * longer than {@link SHORT_CODE} characters breaks anywhere below 40rem, where it would not fit.
 */
export function CodeText({ text }: { text: string }) {
  if (text.length <= SHORT_CODE) return <span className="whitespace-nowrap">{text}</span>;
  return text.split(/( +)/).map((part, i) =>
    /^ +$/.test(part) ? (
      part
    ) : (
      <span
        key={i}
        className={
          part.length > SHORT_CODE
            ? 'max-sm:[overflow-wrap:anywhere] sm:whitespace-nowrap'
            : 'whitespace-nowrap'
        }
      >
        {part}
      </span>
    ),
  );
}

/**
 * The one inline code style, shared with the Markdown renderer and the sibling sites: a hairline
 * border on a raised fill, a little smaller than the text around it.
 */
export const INLINE_CODE =
  'rounded-[5px] border border-line bg-raised px-[0.35em] py-[0.05em] font-mono text-[0.86em] text-fg box-decoration-clone';

export function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className={INLINE_CODE}>
      {typeof children === 'string' ? (
        <CodeText text={children} />
      ) : (
        <span className="whitespace-nowrap">{children}</span>
      )}
    </code>
  );
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="text-fg underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-cyan"
    >
      {children}
    </a>
  );
}
