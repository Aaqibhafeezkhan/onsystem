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
      onNavigate={(url, event) => {
        if (url.startsWith('/')) {
          event.preventDefault();
          router.push(url);
        }
      }}
    />
  );
}
