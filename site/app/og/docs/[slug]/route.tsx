import { ImageResponse } from 'next/og';

import { DOCS_PAGES, docsHeadings, docsMarkdown, docsSlug } from '@/lib/docs';
import { C, ogFonts, PageCard, Panel } from '@/lib/og';

// One card per docs page, drawn at build time: the page's title and description, and its
// sections on the right, so a shared /docs/eslint link previews as that page.
export const dynamic = 'force-static';
export const dynamicParams = false;

const size = { width: 1200, height: 630 };

export function generateStaticParams(): { slug: string }[] {
  return DOCS_PAGES.map((page) => ({ slug: docsSlug(page.href) }));
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = DOCS_PAGES.find((p) => docsSlug(p.href) === slug);
  if (!page) return new Response('Not found', { status: 404 });
  const markdown = docsMarkdown(page);
  const headings = markdown ? docsHeadings(markdown).slice(0, 7) : [];
  return new ImageResponse(
    <PageCard
      {...size}
      eyebrow="Docs"
      title={page.title}
      lead={page.description}
      aside={
        headings.length > 0 ? (
          <Panel>
            <span style={{ color: C.subtle, fontSize: 14 }}>On this page</span>
            {headings.map((heading) => (
              <div
                key={heading}
                style={{
                  display: 'block',
                  color: C.fgSoft,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {heading}
              </div>
            ))}
          </Panel>
        ) : undefined
      }
    />,
    { ...size, fonts: await ogFonts() },
  );
}
