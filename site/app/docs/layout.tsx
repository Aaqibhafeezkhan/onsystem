import type { ReactNode } from 'react';

import { DocsBar, DocsSidebar } from '@/components/docs-nav';
import { OnThisPageRail } from '@/components/on-this-page';
import { DOCS_NAV } from '@/lib/docs';

/**
 * The docs shell shared with ondocs and signoff-ui: the grouped pages on the left and "On this
 * page" on the right from 1024px; below that, a bar under the header with both as menus.
 */
export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <div className="glow pointer-events-none absolute inset-x-0 top-0 h-120" aria-hidden="true" />
      <DocsBar groups={DOCS_NAV} />
      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)] gap-8 px-4 pt-8 pb-16 sm:px-6 sm:pt-12 sm:pb-24 lg:grid-cols-[11.5rem_minmax(0,1fr)_10.5rem] lg:gap-10 lg:pt-14 xl:grid-cols-[12.5rem_minmax(0,1fr)_12rem] xl:gap-12">
        <DocsSidebar groups={DOCS_NAV} />
        {children}
        <OnThisPageRail className="hidden lg:block" />
      </div>
    </div>
  );
}
