'use client';

import { useEffect, useRef, useState } from 'react';

import { CheckIcon, CopyIcon } from '@/components/icons';

/** Copies `text`, says so in place and to screen readers. */
export function CopyButton({
  text,
  label,
  bare = false,
  className = '',
}: {
  text: string;
  /** What is copied, for the accessible name: "Copy the plugin commands". */
  label: string;
  /** Borderless, for a code block's bar. */
  bare?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );

  return (
    <>
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={() => {
          void navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => {
              setCopied(false);
            }, 1600);
          });
        }}
        className={`inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:text-fg ${bare ? 'size-7 hover:bg-line' : 'size-8 border border-line bg-raised-2 hover:border-line-strong'} ${className}`}
      >
        {copied ? <CheckIcon className="size-4 text-cyan" /> : <CopyIcon className="size-4" />}
      </button>
      <span className="sr-only" role="status">
        {copied ? 'Copied to the clipboard' : ''}
      </span>
    </>
  );
}
