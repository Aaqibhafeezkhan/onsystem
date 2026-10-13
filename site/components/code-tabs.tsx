'use client';

import { useId, useRef, useState, type ReactNode } from 'react';

/**
 * Two or more views of one thing in the shared code frame, switched from its bar: the Markdown a
 * tool returns and the JSON beside it. The panels are rendered on the server.
 */
export function CodeTabs({
  title,
  label,
  labels,
  className = '',
  children,
}: {
  title: string;
  /** What the tabs choose between, for screen readers. */
  label: string;
  labels: string[];
  className?: string;
  /** One panel per label, in the same order. */
  children: ReactNode[];
}) {
  const id = useId();
  const list = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  return (
    <div data-code-block="" className={`code-block ${className}`}>
      <div className="code-bar">
        <span className="code-title">{title}</span>
        <div ref={list} role="tablist" aria-label={label} className="flex shrink-0 gap-0.5">
          {labels.map((name, i) => (
            <button
              key={name}
              type="button"
              role="tab"
              id={`${id}-tab-${String(i)}`}
              aria-selected={i === active}
              aria-controls={`${id}-panel-${String(i)}`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => {
                setActive(i);
              }}
              onKeyDown={(event) => {
                const step =
                  event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : undefined;
                if (step === undefined) return;
                event.preventDefault();
                const next = (i + step + labels.length) % labels.length;
                setActive(next);
                list.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
              }}
              className="cursor-pointer rounded-md px-2 py-1 text-[11.5px] text-subtle transition-colors hover:text-fg aria-selected:bg-raised-2 aria-selected:text-fg"
            >
              {name}
            </button>
          ))}
        </div>
      </div>
      {children.map((panel, i) => (
        <div
          key={labels[i] ?? i}
          role="tabpanel"
          id={`${id}-panel-${String(i)}`}
          aria-labelledby={`${id}-tab-${String(i)}`}
          hidden={i !== active}
          className="flex min-h-0 flex-1 flex-col"
        >
          {panel}
        </div>
      ))}
    </div>
  );
}
