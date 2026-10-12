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

/** A page section with an eyebrow, a heading and an optional lead paragraph. */
export function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
  className = '',
}: {
  id?: string;
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={`mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20 ${className}`}
    >
      <div className="max-w-3xl">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2
          id={headingId}
          className="mt-3 text-[1.75rem] leading-[1.15] font-semibold tracking-[-0.02em] text-balance text-fg sm:text-4xl"
        >
          {title}
        </h2>
        {lead && (
          <div className="mt-4 text-base leading-relaxed text-muted sm:text-[17px]">{lead}</div>
        )}
      </div>
      {children && <div className="mt-10 sm:mt-12">{children}</div>}
    </section>
  );
}

/**
 * How inline code wraps: up to 30 characters stays on one line, which fits the narrowest text
 * column on a phone; longer code wraps with the text, inside a long token too, so it never
 * runs past the column.
 */
export function codeWrap(text: string): string {
  return text.length <= 30 ? 'whitespace-nowrap' : 'break-words';
}

export function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code
      className={`rounded bg-white/[0.06] px-1 py-px font-mono text-[0.88em] text-fg-soft ${codeWrap(typeof children === 'string' ? children : '')}`}
    >
      {children}
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
