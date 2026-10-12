import type { MetadataRoute } from 'next';

import { ruleCatalog } from '@/lib/data';
import { DOCS_PAGES } from '@/lib/docs';
import { ruleHref, SITE_URL } from '@/lib/site';

// Every page is static, so "modified" is when the site was last built.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const pages: { path: string; priority: number }[] = [
    { path: '/', priority: 1 },
    { path: '/benchmark', priority: 0.8 },
    { path: '/playground', priority: 0.8 },
    { path: '/rules', priority: 0.8 },
    ...ruleCatalog.rules.map((rule) => ({ path: ruleHref(rule.id), priority: 0.6 })),
    ...DOCS_PAGES.map((page) => ({ path: page.href, priority: page.href === '/docs' ? 0.8 : 0.6 })),
  ];
  return pages.map(({ path, priority }) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    lastModified,
    changeFrequency: 'weekly',
    priority,
  }));
}
