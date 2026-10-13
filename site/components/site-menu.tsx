'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';

import { ArrowUpRightIcon, CloseIcon, MenuIcon } from '@/components/icons';
import { ThemeSwitch } from '@/components/theme-switch';

const row =
  'flex h-12 items-center justify-between rounded-lg px-3 text-[15px] text-muted transition-colors hover:bg-raised hover:text-fg focus-visible:-outline-offset-2 aria-[current=page]:text-fg';

/**
 * The header's menu on phones: every nav item, the theme switch and the project's links, in a
 * native popover, so Escape and a tap outside close it.
 */
export function SiteMenu({
  nav,
  links,
  className = '',
}: {
  nav: { href: string; label: string }[];
  /** Links that leave the site. */
  links: { href: string; label: string }[];
  className?: string;
}) {
  const id = useId();
  const menu = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const element = menu.current;
    const onToggle = (event: Event) => {
      setOpen((event as ToggleEvent).newState === 'open');
    };
    element?.addEventListener('toggle', onToggle);
    return () => element?.removeEventListener('toggle', onToggle);
  }, []);

  // A link followed from the menu: close it on the next page.
  useEffect(() => {
    if (menu.current?.matches(':popover-open')) menu.current.hidePopover();
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        popoverTarget={id}
        aria-label="Menu"
        aria-expanded={open}
        aria-controls={id}
        className={`inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-line text-muted transition-colors hover:border-line-strong hover:text-fg ${className}`}
      >
        {open ? <CloseIcon className="size-4" /> : <MenuIcon className="size-4" />}
      </button>
      <div
        ref={menu}
        id={id}
        popover="auto"
        className="inset-x-0 top-14 bottom-auto m-0 h-auto max-h-[calc(100dvh-3.5rem)] w-full max-w-none overflow-y-auto border-0 border-b border-line bg-ink p-0 text-fg shadow-[0_24px_48px_var(--site-shadow)] backdrop:bg-black/40 md:hidden"
      >
        <nav aria-label="Site">
          <ul className="flex flex-col px-2 py-2">
            {nav.map((item) => {
              const current = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={current ? 'page' : undefined}
                    className={row}
                    onClick={() => menu.current?.hidePopover()}
                  >
                    {item.label}
                    {current && (
                      <span className="size-1.5 rounded-full bg-cyan" aria-hidden="true" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="mx-2 flex items-center justify-between border-t border-line px-3 py-3">
          <span className="text-[15px] text-muted">Theme</span>
          <ThemeSwitch />
        </div>
        <ul className="mx-2 flex flex-col border-t border-line py-2">
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href} className={row}>
                {link.label}
                <ArrowUpRightIcon className="size-4 text-subtle" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
