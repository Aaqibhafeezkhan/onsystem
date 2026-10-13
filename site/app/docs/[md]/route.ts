import { DOCS_PAGES } from '@/lib/docs';
import { markdownPath, pageMarkdown } from '@/lib/page-markdown';

// Each docs page as Markdown, at its own path plus .md (/docs/ci.md), written at build time.
export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams(): { md: string }[] {
  return DOCS_PAGES.map((page) => ({ md: markdownPath(page).slice('/docs/'.length) }));
}

export async function GET(_: Request, { params }: { params: Promise<{ md: string }> }) {
  const { md } = await params;
  const page = DOCS_PAGES.find((p) => markdownPath(p) === `/docs/${md}`);
  if (!page) return new Response('Not found', { status: 404 });
  return new Response(pageMarkdown(page), {
    headers: { 'content-type': 'text/markdown; charset=utf-8' },
  });
}
