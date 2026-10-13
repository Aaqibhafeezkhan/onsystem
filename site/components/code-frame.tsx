import type { ReactNode } from 'react';

import { CopyButton } from '@/components/copy-button';

/**
 * The one frame every code surface shares (docs, the home page's demos, the playground, the rules
 * pages, the install panel): a bordered block with a slim bar that names it (a file name, or the
 * language in a quieter colour), an optional note, and the copy button, so the button never
 * covers the code. The styles are `.code-block` and `.code-bar` in app/globals.css.
 */
export function CodeFrame({
  title,
  label,
  note,
  copy,
  className = '',
  children,
}: {
  /** A file name or a caption. */
  title?: ReactNode;
  /** What the bar says without a title: the language. */
  label?: string | undefined;
  /** Something to say at the bar's right edge, such as a status. */
  note?: ReactNode;
  copy?: { text: string; label: string } | undefined;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div data-code-block="" className={`code-block ${className}`}>
      <div className="code-bar">
        <span className={`code-title ${title ? '' : 'code-title-language'}`}>{title ?? label}</span>
        {(note ?? copy) && (
          <span className="flex shrink-0 items-center gap-2">
            {note}
            {copy && <CopyButton text={copy.text} label={copy.label} bare />}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
