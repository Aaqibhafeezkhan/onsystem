import type { Metadata } from 'next';

/**
 * A page's metadata. Next.js replaces nested objects such as `openGraph` rather than merging
 * them with the layout's, so every page sets the whole set here.
 */
export function pageMetadata({
  title,
  socialTitle = `${title} · onsystem`,
  description,
  path,
  image,
  imageAlt,
  imageSize = { width: 1200, height: 630 },
}: {
  title: string;
  socialTitle?: string;
  description: string;
  path: string;
  /** An image route, such as a docs card from app/og; a segment's own image is used anyway. */
  image?: string | undefined;
  imageAlt?: string | undefined;
  imageSize?: { width: number; height: number };
}): Metadata {
  const images = image
    ? [{ url: image, ...imageSize, ...(imageAlt ? { alt: imageAlt } : {}) }]
    : undefined;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: 'onsystem',
      title: socialTitle,
      description,
      url: path,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      ...(images ? { images } : {}),
    },
  };
}
