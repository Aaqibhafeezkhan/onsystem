'use client';

import { useRouter } from 'next/navigation';
import { AskDialog } from 'ondocs/react';

import 'ondocs/react/styles.css';

const SUGGESTIONS = [
  'How do I install the Claude Code plugin?',
  'How do I adopt it in a codebase that already has findings?',
  'Why does inspect find nothing?',
  'What does no-unknown-variant catch?',
];

/**
 * ondocs's footer, with a line that says ondocs answers here and serves these docs to agents
 * (app/api/mcp/route.ts).
 */
function AskFooter() {
  return (
    <div className="ask-footer">
      <span>
        Answers can be wrong: check the sources. Answers and docs MCP by{' '}
        <a
          className="underline decoration-[var(--ask-border-strong)] underline-offset-2 hover:text-[var(--ask-fg)]"
          href="https://ondocs.vercel.app"
          // A new tab, so the answer stays open here.
          target="_blank"
          rel="noopener noreferrer"
        >
          ondocs
        </a>
        .
      </span>
      <span className="ask-footer-keys" aria-hidden="true">
        <kbd className="ask-kbd">↵</kbd> ask <kbd className="ask-kbd">esc</kbd> close
      </span>
    </div>
  );
}

/** ondocs's dialog, in the page's theme, routing citations through the Next.js router. */
export function SiteAskDialog({
  open,
  onOpenChange,
  theme,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme: 'light' | 'dark';
}) {
  const router = useRouter();
  return (
    <AskDialog
      endpoint="/api/ask"
      open={open}
      onOpenChange={onOpenChange}
      // components/ask.tsx handles ⌘K, so it works before this component has loaded.
      shortcut={false}
      theme={theme}
      title="Ask the onsystem docs"
      placeholder="Ask the docs a question…"
      suggestions={SUGGESTIONS}
      footer={<AskFooter />}
      onNavigate={(url, event) => {
        if (url.startsWith('/')) {
          event.preventDefault();
          router.push(url);
        }
      }}
    />
  );
}
