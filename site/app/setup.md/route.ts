import { setupMd } from '@/lib/llms';

// The steps an agent follows to set onsystem up, written once per build from the docs.
export const dynamic = 'force-static';

export function GET() {
  return new Response(setupMd(), { headers: { 'content-type': 'text/markdown; charset=utf-8' } });
}
