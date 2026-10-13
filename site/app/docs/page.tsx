import type { Metadata } from 'next';

import { DocPage, docsMetadata } from '@/components/doc-page';
import { DocsForAgents } from '@/components/docs-for-agents';
import { MarkdownBlocks } from '@/components/markdown-blocks';
import { docs } from '@/lib/data';

export const metadata: Metadata = docsMetadata('/docs');

// The steps carry the plugin commands and the install links, so there is no install panel above
// them repeating the commands.
export default function QuickstartPage() {
  return (
    <DocPage
      href="/docs"
      lead={
        <p>
          From nothing to an agent that is held to your design system, and pull requests that are
          checked against it. Four steps, a couple of minutes.
        </p>
      }
    >
      <MarkdownBlocks markdown={docs.quickstart} />
      <DocsForAgents />
    </DocPage>
  );
}
