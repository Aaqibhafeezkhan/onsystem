import { ImageResponse } from 'next/og';

import { HOME_CARD, HomeCard, ogFonts } from '@/lib/og';

// The home page's card. A route rather than app/opengraph-image.tsx, which every page without
// a card of its own (the 404 page) would inherit.
export const dynamic = 'force-static';

export async function GET() {
  return new ImageResponse(<HomeCard {...HOME_CARD.size} footer="onsystem.vercel.app" />, {
    ...HOME_CARD.size,
    fonts: await ogFonts(),
  });
}
