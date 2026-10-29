import type { Metadata } from 'next';

import { DocPage, docsMetadata } from '@/components/doc-page';
import { MarkdownBlocks } from '@/components/markdown-blocks';
import { docs } from '@/lib/data';

export const metadata: Metadata = docsMetadata('/docs/cli');

export default function CliPage() {
  return (
    <DocPage href="/docs/cli">
      <MarkdownBlocks markdown={docs.cli} />
    </DocPage>
  );
}
