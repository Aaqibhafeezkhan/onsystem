'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { ChevronDownIcon } from '@/components/icons';

export interface TocItem {
  id: string;
  label: string;
  level: number;
}

/** Below the sticky header (and the docs bar on narrow screens): where a section counts as read. */
const READ_LINE = 128;

/**
 * The page's sections: the headings rendered with `data-toc` (components/heading.tsx), read from
 * the page once it is on screen and again after each navigation, unless `items` lists them.
 */
function useSections(items: TocItem[] | undefined): TocItem[] {
  const pathname = usePathname();
  const [found, setFound] = useState<TocItem[]>([]);
  useEffect(() => {
    if (items) return;
    const read = () => {
      setFound(
        [...document.querySelectorAll<HTMLElement>('#main [data-toc]')].map((heading) => ({
          id: heading.id,
          label: heading.dataset.toc ?? '',
          level: Number(heading.dataset.level ?? 2),
        })),
      );
    };
    read();
    // The new page's content can land after this layout's effect on a client navigation.
    const frame = requestAnimationFrame(read);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [items, pathname]);
  return items ?? found;
}

/** The section being read: the last one whose heading has scrolled past the read line. */
function useActive(sections: TocItem[]): string | undefined {
  const [active, setActive] = useState<string>();
  useEffect(() => {
    if (sections.length === 0) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const atEnd =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      let current = sections[0]?.id;
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element && element.getBoundingClientRect().top <= READ_LINE) current = section.id;
      }
      setActive(atEnd ? sections.at(-1)?.id : current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [sections]);
  return active;
}

function SectionLinks({
  sections,
  active,
  onFollow,
  compact = false,
}: {
  sections: TocItem[];
  active: string | undefined;
  onFollow?: () => void;
  compact?: boolean;
}) {
  return (
    <ul className={compact ? 'grid gap-0.5' : 'grid gap-1 border-l border-line'}>
      {sections.map((section) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            aria-current={section.id === active ? 'location' : undefined}
            onClick={onFollow}
            className={
              compact
                ? `block rounded-md px-3 py-2 text-[14px] text-muted transition-colors hover:bg-raised hover:text-fg aria-[current=location]:text-fg ${section.level > 2 ? 'pl-6' : ''}`
                : `-ml-px block border-l border-transparent py-1 text-[13px] leading-snug text-muted transition-colors hover:text-fg aria-[current=location]:border-cyan aria-[current=location]:text-fg ${section.level > 2 ? 'pl-6' : 'pl-3'}`
            }
          >
            {section.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

/** "On this page" beside the content, from 1024px: the page's sections, the one being read marked. */
export function OnThisPageRail({
  items,
  className = '',
}: {
  items?: TocItem[];
  className?: string;
}) {
  const sections = useSections(items);
  const active = useActive(sections);
  if (sections.length === 0) return <div className={className} />;
  return (
    <nav
      aria-label="On this page"
      className={`sticky top-20 max-h-[calc(100dvh-6rem)] self-start overflow-y-auto ${className}`}
    >
      <p className="font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">On this page</p>
      <div className="mt-3">
        <SectionLinks sections={sections} active={active} />
      </div>
    </nav>
  );
}

/** "On this page" as a dropdown, for the docs bar below 1024px. */
export function OnThisPageMenu({ items }: { items?: TocItem[] }) {
  const sections = useSections(items);
  const active = useActive(sections);
  const pathname = usePathname();
  // Open on the page it was opened on: following a link to another page closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (value: boolean) => {
    setOpenOn(value ? pathname : null);
  };
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpenOn(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenOn(null);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (sections.length === 0) return null;
  const current = sections.find((section) => section.id === active);
  return (
    <div ref={root} className="min-w-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
        }}
        className="flex h-11 max-w-full min-w-0 cursor-pointer items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-fg"
      >
        <span className="shrink-0">On this page</span>
        {current && (
          <span className="hidden min-w-0 truncate text-fg-soft sm:inline">· {current.label}</span>
        )}
        <ChevronDownIcon
          className={`size-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <nav
          aria-label="On this page"
          className="absolute inset-x-0 top-full max-h-[min(70dvh,32rem)] overflow-y-auto border-b border-line bg-ink px-2 py-2 shadow-[0_24px_48px_var(--site-shadow)]"
        >
          <SectionLinks
            sections={sections}
            active={active}
            compact
            onFollow={() => {
              setOpen(false);
            }}
          />
        </nav>
      )}
    </div>
  );
}
