import type { Metadata } from 'next';

import { DocPage, docsMetadata } from '@/components/doc-page';
import { MarkdownBlocks } from '@/components/markdown-blocks';
import { docs } from '@/lib/data';

export const metadata: Metadata = docsMetadata('/docs/ci');

export default function CiPage() {
  return (
    <DocPage href="/docs/ci">
      <MarkdownBlocks markdown={docs.ci} />
    </DocPage>
  );
}
