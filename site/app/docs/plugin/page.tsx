import type { Metadata } from 'next';

import { DocPage, docsMetadata } from '@/components/doc-page';
import { AnchorHeading } from '@/components/heading';
import { MarkdownBlocks } from '@/components/markdown-blocks';
import { InlineCode } from '@/components/section';
import { docs } from '@/lib/data';
import { repoLink } from '@/lib/site';

export const metadata: Metadata = docsMetadata('/docs/plugin');

// The skill's own title is the page's; its sections become this page's.
const skill = docs.skill.replace(/^# .*\n+/, '');

export default function PluginPage() {
  return (
    <DocPage href="/docs/plugin">
      <MarkdownBlocks markdown={docs.plugin} />
      <AnchorHeading level={2} id="the-skill" label="What the skill tells Claude">
        What the skill tells Claude
      </AnchorHeading>
      <p className="mt-4 leading-relaxed text-muted">
        Claude loads it by itself for UI work, or with <InlineCode>/onsystem:onsystem</InlineCode>.
        This is its text, from{' '}
        <a
          href={repoLink('plugins/onsystem/skills/onsystem/SKILL.md')}
          className="text-fg underline decoration-line-strong underline-offset-4 hover:decoration-cyan"
        >
          SKILL.md
        </a>
        :
      </p>
      {/* Quoted, so its own headings are set small and stay out of this page's outline. */}
      <blockquote className="mt-6 rounded-2xl border border-line bg-raised p-5 sm:p-6">
        <MarkdownBlocks markdown={skill} shift={-2} />
      </blockquote>
    </DocPage>
  );
}
