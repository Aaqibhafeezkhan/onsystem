'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { ChevronDownIcon, MenuIcon } from '@/components/icons';
import { OnThisPageMenu } from '@/components/on-this-page';

export interface DocsNavGroup {
  group: string;
  items: { href: string; label: string }[];
}

const item =
  'block rounded-md px-2.5 py-1.5 text-[13.5px] text-muted transition-colors hover:text-fg aria-[current=page]:bg-cyan/10 aria-[current=page]:text-fg';

function Groups({ groups, onFollow }: { groups: DocsNavGroup[]; onFollow?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="grid gap-6">
      {groups.map(({ group, items }) => (
        <div key={group}>
          <p className="px-2.5 font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">
            {group}
          </p>
          <ul className="mt-2 grid gap-0.5">
            {items.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={link.href === pathname ? 'page' : undefined}
                  className={item}
                  onClick={onFollow}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** The docs sidebar from 1024px: the pages in their groups, the open one marked. */
export function DocsSidebar({ groups }: { groups: DocsNavGroup[] }) {
  return (
    <nav
      aria-label="Docs"
      className="sticky top-20 hidden max-h-[calc(100dvh-6rem)] self-start overflow-y-auto pb-6 lg:block"
    >
      <Groups groups={groups} />
    </nav>
  );
}

/**
 * Below 1024px, a bar under the site header that stays in view: the docs pages in a menu that
 * names the page you are on, and the page's sections in "On this page".
 */
export function DocsBar({ groups }: { groups: DocsNavGroup[] }) {
  const pathname = usePathname();
  // Open on the page it was opened on: following a link to another page closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (value: boolean) => {
    setOpenOn(value ? pathname : null);
  };
  const root = useRef<HTMLDivElement>(null);
  const current = groups.flatMap((g) => g.items).find((link) => link.href === pathname);

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

  return (
    <div className="sticky top-14 z-30 border-b border-line/80 bg-ink/95 backdrop-blur-md lg:hidden">
      <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div ref={root} className="min-w-0">
          <button
            type="button"
            aria-expanded={open}
            aria-label={`Docs pages${current ? `, on ${current.label}` : ''}`}
            onClick={() => {
              setOpen(!open);
            }}
            className="flex h-11 min-w-0 cursor-pointer items-center gap-2 text-[14px] text-fg"
          >
            <MenuIcon className="size-4 shrink-0 text-muted" />
            <span className="truncate">{current?.label ?? 'All pages'}</span>
            <ChevronDownIcon
              className={`size-4 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </button>
          {open && (
            <nav
              aria-label="Docs"
              className="absolute inset-x-0 top-full max-h-[min(75dvh,40rem)] overflow-y-auto border-b border-line bg-ink px-2 py-4 shadow-[0_24px_48px_var(--site-shadow)] sm:px-4"
            >
              <Groups
                groups={groups}
                onFollow={() => {
                  setOpen(false);
                }}
              />
            </nav>
          )}
        </div>
        <OnThisPageMenu />
      </div>
    </div>
  );
}
