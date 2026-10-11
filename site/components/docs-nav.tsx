'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { ArrowUpRightIcon, ChevronDownIcon } from '@/components/icons';

export interface DocsNavLink {
  href: string;
  title: string;
  /** A docs page, marked when it is the one open. */
  page?: boolean;
  /** Leaves the site. */
  external?: boolean;
  /** Starts the group after the docs pages. */
  group?: boolean;
}

const item =
  'block rounded-md border border-transparent px-2.5 py-1.5 text-[13.5px] text-muted transition-colors hover:text-fg aria-[current=page]:bg-cyan/10 aria-[current=page]:text-fg';

/**
 * The docs navigation: a list beside the page on wide screens, and on phones one menu that
 * names the page you are on, so the page starts right below it rather than below every link.
 */
export function DocsNav({ links }: { links: DocsNavLink[] }) {
  const pathname = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);
  // A link followed from the open menu: close it on the next page.
  useEffect(() => {
    menu.current?.removeAttribute('open');
  }, [pathname]);
  const current = links.find((link) => link.page && link.href === pathname);

  const list = (
    <ul className="grid gap-0.5">
      {links.map((link) => (
        <li key={link.href} className={link.group ? 'mt-3' : undefined}>
          {link.external ? (
            <a href={link.href} className={`${item} inline-flex items-center gap-1`}>
              {link.title}
              <ArrowUpRightIcon className="size-3.5 text-subtle" />
            </a>
          ) : (
            <Link
              href={link.href}
              aria-current={link.page && link.href === pathname ? 'page' : undefined}
              className={item}
            >
              {link.title}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <nav aria-label="Docs" className="lg:sticky lg:top-20 lg:self-start">
      <details ref={menu} className="group rounded-xl border border-line bg-raised lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-2.5 [&::-webkit-details-marker]:hidden">
          <span className="min-w-0">
            <span className="block font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">
              Docs
            </span>
            <span className="block truncate text-[15px] text-fg">
              {current?.title ?? 'All pages'}
            </span>
          </span>
          <ChevronDownIcon className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-line p-2">{list}</div>
      </details>
      <div className="hidden lg:block">
        <p className="font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">Docs</p>
        <div className="mt-3">{list}</div>
      </div>
    </nav>
  );
}
