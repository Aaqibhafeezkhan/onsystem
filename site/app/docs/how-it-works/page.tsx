import type { Metadata } from 'next';

import { Architecture } from '@/components/architecture';
import { DocPage, docsMetadata } from '@/components/doc-page';
import { MarkdownBlocks } from '@/components/markdown-blocks';
import { docs } from '@/lib/data';

export const metadata: Metadata = docsMetadata('/docs/how-it-works');

// The diagram is a Markdown image in the file (the repository's SVG, for GitHub); here it is drawn
// in HTML, legible at the docs column's width and in both themes, with the image's alt text.
const IMAGE = /^!\[([^\]]*)\]\([^)]*architecture\.svg\)$/m;
const alt = IMAGE.exec(docs.howItWorks)?.[1] ?? '';
const markdown = docs.howItWorks.replace(IMAGE, '');

export default function HowItWorksPage() {
  return (
    <DocPage href="/docs/how-it-works">
      <MarkdownBlocks markdown={markdown.slice(0, markdown.indexOf('\n\n'))} />
      <Architecture alt={alt} />
      <MarkdownBlocks markdown={markdown.slice(markdown.indexOf('\n\n'))} />
    </DocPage>
  );
}
