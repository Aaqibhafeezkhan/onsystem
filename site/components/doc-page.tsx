import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { ArrowRightIcon } from '@/components/icons';
import { PageActions } from '@/components/page-actions';
import { Eyebrow } from '@/components/section';
import { docsPage, docsSlug, type DocsHref, type DocsPage } from '@/lib/docs';
import { lastModified } from '@/lib/git';
import { pageMetadata } from '@/lib/metadata';
import { markdownPath, markdownUrl } from '@/lib/page-markdown';
import { AUTHOR, repoLink, SITE_URL } from '@/lib/site';

/** "Oct 12, 2026", in UTC so the build's time zone does not move it. */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * The frame of a docs page: its group, title and lead, the page actions, the content, when it
 * last changed and where to edit it, and the pages before and after it.
 */
export function DocPage({
  href,
  lead,
  children,
}: {
  href: DocsHref;
  lead?: ReactNode;
  children: ReactNode;
}) {
  const { page, previous, next } = docsPage(href);
  const modified = lastModified([page.source]);
  return (
    <main id="main" className="min-w-0">
      <script
        type="application/ld+json"
        // Static data from lib/docs.ts; nothing user-supplied.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(docsJsonLd(page)).replace(/</g, '\\u003c'),
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Eyebrow>{page.group}</Eyebrow>
        <PageActions markdownPath={markdownPath(page)} markdownUrl={markdownUrl(page)} />
      </div>
      <h1 className="mt-3 text-[2rem] leading-[1.1] font-semibold tracking-[-0.025em] text-balance text-fg sm:text-[2.4rem]">
        {page.title}
      </h1>
      {(lead ?? page.lead) && (
        <div className="mt-4 max-w-3xl text-base leading-relaxed text-muted sm:text-[17px]">
          {lead ?? <p>{page.lead}</p>}
        </div>
      )}
      <div className="mt-10 max-w-3xl">{children}</div>

      <div className="mt-12 flex max-w-3xl flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-line pt-5 text-[13px] text-subtle">
        <a
          href={repoLink(page.source, 'edit')}
          className="text-muted underline decoration-line-strong underline-offset-4 hover:text-fg"
        >
          Edit this page on GitHub
        </a>
        {modified && (
          <p>
            Last updated <time dateTime={modified.toISOString()}>{formatDate(modified)}</time>
          </p>
        )}
      </div>

      <nav aria-label="Previous and next" className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
        {previous ? (
          <Link
            href={previous.href}
            className="group rounded-xl border border-line bg-raised px-4 py-3 transition-colors hover:border-line-strong"
          >
            <span className="block text-[12px] text-subtle">Previous</span>
            <span className="inline-flex items-center gap-1.5 text-[15px] font-medium text-fg">
              <ArrowRightIcon className="size-4 rotate-180 text-subtle transition-transform group-hover:-translate-x-0.5 group-hover:text-cyan" />
              {previous.label ?? previous.title}
            </span>
          </Link>
        ) : (
          <span className="hidden sm:block" />
        )}
        {next && (
          <Link
            href={next.href}
            className="group rounded-xl border border-line bg-raised px-4 py-3 text-right transition-colors hover:border-line-strong"
          >
            <span className="block text-[12px] text-subtle">Next</span>
            <span className="inline-flex items-center gap-1.5 text-[15px] font-medium text-fg">
              {next.label ?? next.title}
              <ArrowRightIcon className="size-4 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-cyan" />
            </span>
          </Link>
        )}
      </nav>
    </main>
  );
}

/** Structured data for search engines: the page as an article, and where it sits in the docs. */
export function docsJsonLd(page: DocsPage) {
  const url = `${SITE_URL}${page.href}`;
  const modified = lastModified([page.source]);
  const crumbs = [
    { name: 'Docs', url: `${SITE_URL}/docs` },
    ...(page.href === '/docs' ? [] : [{ name: page.title, url }]),
  ];
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        headline: page.title,
        description: page.description,
        url,
        ...(modified ? { dateModified: modified.toISOString() } : {}),
        author: { '@type': 'Person', name: AUTHOR.name, url: AUTHOR.url },
        isPartOf: { '@type': 'WebSite', name: 'onsystem', url: SITE_URL },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((crumb, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: crumb.name,
          item: crumb.url,
        })),
      },
    ],
  };
}

export function docsMetadata(href: DocsHref): Metadata {
  const { page } = docsPage(href);
  return pageMetadata({
    title: page.href === '/docs' ? 'Docs: quickstart' : page.title,
    description: page.description,
    path: page.href,
    // Each page's own card, from app/og/docs/[slug]/route.tsx.
    image: `/og/docs/${docsSlug(page.href)}`,
    imageAlt: `onsystem docs: ${page.title}. ${page.description}`,
  });
}
