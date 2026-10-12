import type { Metadata } from 'next';

import { DocPage, docsMetadata } from '@/components/doc-page';
import { MarkdownBlocks } from '@/components/markdown-blocks';
import { docs } from '@/lib/data';

export const metadata: Metadata = docsMetadata('/docs/design-system-packages');

export default function DesignSystemPackagesPage() {
  return (
    <DocPage href="/docs/design-system-packages" file="docs/design-system-packages.md">
      <MarkdownBlocks markdown={docs.designSystemPackages} />
    </DocPage>
  );
}
