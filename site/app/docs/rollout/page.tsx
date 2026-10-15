import type { Metadata } from 'next';

import { DocPage, docsMetadata } from '@/components/doc-page';
import { MarkdownBlocks } from '@/components/markdown-blocks';
import { docs } from '@/lib/data';

export const metadata: Metadata = docsMetadata('/docs/rollout');

export default function RolloutPage() {
  return (
    <DocPage href="/docs/rollout">
      <MarkdownBlocks markdown={docs.rollout} />
    </DocPage>
  );
}
