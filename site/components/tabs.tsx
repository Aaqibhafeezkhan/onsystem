'use client';

import { useId, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';

import { CopyButton } from '@/components/copy-button';

/*
 * Tabs over alternative code blocks, such as one command for each package manager, in the shared
 * code frame: the tabs sit in its bar, with the copy button for the code shown. Tabs of the same
 * `group` share the choice, across the page and later visits (localStorage), so picking pnpm
 * once shows pnpm everywhere.
 */

const listeners = new Set<() => void>();

function storageKey(group: string) {
  return `onsystem-tab-${group}`;
}

/** Choices made while storage is unavailable, for this page only. */
const fallback = new Map<string, string>();

function readChoice(group: string | undefined): string | null {
  if (!group) return null;
  try {
    return localStorage.getItem(storageKey(group)) ?? fallback.get(group) ?? null;
  } catch {
    return fallback.get(group) ?? null;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function Tabs({
  label,
  labels,
  group,
  copies = [],
  children,
}: {
  /** What the tabs choose between, for screen readers: "Package manager". */
  label: string;
  labels: string[];
  /** Tabs with the same group share the chosen label. */
  group?: string | undefined;
  /** What the copy button copies for each panel; no button for a panel without one. */
  copies?: (string | undefined)[];
  /** One panel per label, in the same order: the code, without a frame of its own. */
  children: ReactNode[];
}) {
  const id = useId();
  const list = useRef<HTMLDivElement>(null);
  const stored = useSyncExternalStore(
    subscribe,
    () => readChoice(group),
    () => null,
  );
  // Ungrouped tabs keep their choice to themselves.
  const [local, setLocal] = useState<string | null>(null);
  const chosen = group ? stored : local;
  const active = Math.max(0, chosen ? labels.indexOf(chosen) : 0);

  const choose = (index: number) => {
    const label = labels[index];
    if (label === undefined) return;
    if (!group) {
      setLocal(label);
      return;
    }
    try {
      localStorage.setItem(storageKey(group), label);
    } catch {
      // Not remembered: switch this page's tabs anyway.
      fallback.set(group, label);
    }
    for (const listener of listeners) listener();
  };

  const copy = copies[active];
  return (
    <div data-code-block="" className="code-block">
      <div className="code-bar py-0 pl-2">
        <div
          ref={list}
          role="tablist"
          aria-label={label}
          className="-mb-px flex min-w-0 gap-0.5 self-stretch overflow-x-auto"
        >
          {labels.map((label, i) => (
            <button
              key={label}
              type="button"
              role="tab"
              id={`${id}-tab-${String(i)}`}
              aria-selected={i === active}
              aria-controls={`${id}-panel-${String(i)}`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => {
                choose(i);
              }}
              onKeyDown={(event) => {
                const step =
                  event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : undefined;
                if (step === undefined) return;
                event.preventDefault();
                const next = (i + step + labels.length) % labels.length;
                choose(next);
                list.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
              }}
              className="tap cursor-pointer border-b-2 border-transparent px-2.5 font-mono text-[12px] text-subtle transition-colors hover:text-fg focus-visible:-outline-offset-2 aria-selected:border-cyan aria-selected:text-fg"
            >
              {label}
            </button>
          ))}
        </div>
        {copy !== undefined && (
          <CopyButton text={copy} label={`Copy the ${labels[active] ?? ''} command`} bare />
        )}
      </div>
      {children.map((panel, i) => (
        <div
          key={labels[i] ?? i}
          role="tabpanel"
          id={`${id}-panel-${String(i)}`}
          aria-labelledby={`${id}-tab-${String(i)}`}
          hidden={i !== active}
        >
          {panel}
        </div>
      ))}
    </div>
  );
}
