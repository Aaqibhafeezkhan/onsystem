import type { Metadata } from 'next';

import { DocPage, docsMetadata } from '@/components/doc-page';
import { EditorInstallButtons } from '@/components/install';
import { MarkdownBlocks } from '@/components/markdown-blocks';
import { docs } from '@/lib/data';

export const metadata: Metadata = docsMetadata('/docs');

// The steps carry the plugin commands, and step 2 the Cursor and VS Code install buttons, so
// there is no install panel above them repeating the commands. The docs search server is offered
// at the end of /docs/clients.
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
      <MarkdownBlocks
        markdown={docs.quickstart}
        inSteps={{ 'hold-your-agent-to-it': <EditorInstallButtons className="mt-4" /> }}
      />
    </DocPage>
  );
}
