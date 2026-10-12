import type { ReactNode } from 'react';

import { DocsNav, type DocsNavLink } from '@/components/docs-nav';
import { DOCS_PAGES } from '@/lib/docs';
import { REPO } from '@/lib/site';

const LINKS: DocsNavLink[] = [
  ...DOCS_PAGES.map((page) => ({ href: page.href, title: page.title, page: true })),
  { href: '/rules', title: 'Rules', group: true },
  { href: '/playground', title: 'Playground' },
  { href: `${REPO}#readme`, title: 'README', external: true },
];

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <div className="glow pointer-events-none absolute inset-x-0 top-0 h-120" aria-hidden="true" />
      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)] gap-8 px-4 pt-10 pb-16 sm:px-6 sm:pt-14 sm:pb-24 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-14">
        <DocsNav links={LINKS} />
        {children}
      </div>
    </div>
  );
}
