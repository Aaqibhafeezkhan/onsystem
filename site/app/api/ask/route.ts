import { askEnabled, askHandler } from '@/lib/ask';

// The key is read on each request, so adding or removing it takes effect without a rebuild.
export const dynamic = 'force-dynamic';

/** A question for the docs: ondocs's ask endpoint, or a 404 where Ask has no model key. */
export function POST(request: Request): Promise<Response> {
  if (!askEnabled()) {
    return Promise.resolve(
      Response.json(
        { error: { code: 'not_configured', message: 'Ask is not set up on this site.' } },
        { status: 404 },
      ),
    );
  }
  return askHandler()(request);
}

/** Whether Ask is on, for the header's button. Cached at the edge for a few minutes. */
export function GET(): Response {
  return Response.json(
    { ask: askEnabled() },
    {
      headers: { 'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400' },
    },
  );
}
