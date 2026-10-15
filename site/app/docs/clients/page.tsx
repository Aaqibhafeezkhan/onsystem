import type { Metadata } from 'next';

import { DocPage, docsMetadata } from '@/components/doc-page';
import { DocsForAgents } from '@/components/docs-for-agents';
import { EditorInstallButtons } from '@/components/install';
import { MarkdownBlocks } from '@/components/markdown-blocks';
import { docs } from '@/lib/data';

export const metadata: Metadata = docsMetadata('/docs/clients');

// onsystem's own installs come first; the docs search server, which is optional, comes last.
export default function ClientsPage() {
  return (
    <DocPage href="/docs/clients">
      <EditorInstallButtons className="mb-10" />
      <MarkdownBlocks markdown={docs.clients} />
      <DocsForAgents />
    </DocPage>
  );
}
