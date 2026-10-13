import type { MetadataRoute } from 'next';

import { ruleCatalog } from '@/lib/data';
import { DOCS_PAGES } from '@/lib/docs';
import { lastModified } from '@/lib/git';
import { ruleHref, SITE_URL } from '@/lib/site';

/** The files each page is written from, for its lastmod: their last commit, not the build. */
const RULE_SOURCES = [
  'site/app/rules/[id]/page.tsx',
  'site/scripts/rule-docs.mjs',
  'docs/rules.md',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: { path: string; priority: number; sources: string[] }[] = [
    { path: '/', priority: 1, sources: ['site/app/page.tsx'] },
    { path: '/benchmark', priority: 0.8, sources: ['site/app/benchmark/page.tsx', 'bench/v2'] },
    {
      path: '/playground',
      priority: 0.8,
      sources: ['site/app/playground/page.tsx', 'site/components/playground.tsx'],
    },
    { path: '/rules', priority: 0.8, sources: ['site/app/rules/page.tsx', 'docs/rules.md'] },
    ...ruleCatalog.rules.map((rule) => ({
      path: ruleHref(rule.id),
      priority: 0.6,
      sources: RULE_SOURCES,
    })),
    ...DOCS_PAGES.map((page) => ({
      path: page.href,
      priority: page.href === '/docs' ? 0.8 : 0.6,
      sources: [page.source],
    })),
  ];
  return pages.map(({ path, priority, sources }) => {
    const modified = lastModified(sources);
    return {
      url: `${SITE_URL}${path === '/' ? '' : path}`,
      // Left out when git has no history for it (a shallow clone), rather than the build time.
      ...(modified ? { lastModified: modified } : {}),
      changeFrequency: 'weekly',
      priority,
    };
  });
}
