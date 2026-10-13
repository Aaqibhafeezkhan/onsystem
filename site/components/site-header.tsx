import Link from 'next/link';

import { GitHubIcon } from '@/components/icons';
import { LogoMark } from '@/components/logo';
import { NavLink } from '@/components/nav-link';
import { SiteMenu } from '@/components/site-menu';
import { ThemeSwitch } from '@/components/theme-switch';
import { compactNumber, NPM, REPO, STARS, VERSION } from '@/lib/site';

export interface NavItem {
  href: string;
  label: string;
}

/** The primary nav: the docs, then the site's key pages. */
export const NAV: NavItem[] = [
  { href: '/docs', label: 'Docs' },
  { href: '/playground', label: 'Playground' },
  { href: '/rules', label: 'Rules' },
  { href: '/benchmark', label: 'Benchmark' },
];

/**
 * The header shared with ondocs and signoff-ui: the logo, name and version on the left; the
 * nav, the theme switch and GitHub on the right. On phones the nav, the theme switch and the
 * links move into a menu.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-ink/95 backdrop-blur-md">
      <a
        href="#main"
        className="sr-only rounded-md bg-cyan px-3 py-2 font-medium text-ink focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-50"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2.5 rounded-md">
          <LogoMark className="size-7" />
          <span className="font-mono text-[13px] font-semibold tracking-tight text-fg">
            onsystem
          </span>
          <span className="rounded-full border border-line px-1.5 py-px font-mono text-[11px] text-muted">
            v{VERSION}
          </span>
        </Link>
        <nav aria-label="Site" className="ml-auto hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              className="rounded-md px-2 py-1.5 text-[13px] text-muted transition-colors hover:text-fg aria-[current=page]:text-fg"
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-1">
          <ThemeSwitch className="hidden md:flex" />
          <a
            href={REPO}
            className="hidden h-8 min-w-8 items-center justify-center gap-1.5 rounded-lg border border-line px-2 text-muted transition-colors hover:border-line-strong hover:text-fg md:inline-flex"
            aria-label={
              STARS === null ? 'onsystem on GitHub' : `onsystem on GitHub, ${String(STARS)} stars`
            }
          >
            <GitHubIcon className="size-4" />
            {STARS !== null && (
              <span className="font-mono text-[12px] tabular-nums">{compactNumber(STARS)}</span>
            )}
          </a>
          <SiteMenu
            nav={NAV}
            links={[
              { href: REPO, label: 'GitHub' },
              { href: NPM, label: 'npm' },
            ]}
            className="md:hidden"
          />
        </div>
      </div>
    </header>
  );
}
