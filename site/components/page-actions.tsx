'use client';

import { useEffect, useRef, useState } from 'react';

import {
  ArrowUpRightIcon,
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  FileTextIcon,
  SparkIcon,
} from '@/components/icons';

/** The prompt an assistant opens with: read the page's Markdown, then take questions. */
export function askPrompt(markdownUrl: string): string {
  return `Read ${markdownUrl} so I can ask questions about it.`;
}

export function assistantLinks(markdownUrl: string) {
  const q = encodeURIComponent(askPrompt(markdownUrl));
  return [
    { label: 'Open in ChatGPT', href: `https://chatgpt.com/?hints=search&q=${q}` },
    { label: 'Open in Claude', href: `https://claude.ai/new?q=${q}` },
  ];
}

/** Copies the Markdown at `url`, fetched on click; the clipboard item keeps Safari's user gesture. */
async function copyMarkdown(url: string): Promise<void> {
  const text = fetch(url).then(async (response) => {
    if (!response.ok) throw new Error(`${url}: ${String(response.status)}`);
    return new Blob([await response.text()], { type: 'text/plain' });
  });
  if (typeof ClipboardItem !== 'undefined' && 'write' in navigator.clipboard) {
    await navigator.clipboard.write([new ClipboardItem({ 'text/plain': text })]);
  } else {
    await navigator.clipboard.writeText(await (await text).text());
  }
}

const row =
  'flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13.5px] text-fg-soft transition-colors hover:bg-raised-2 hover:text-fg focus-visible:-outline-offset-2';

/**
 * The page's actions: copy it as Markdown, view the Markdown, or open it in ChatGPT or Claude
 * with a prompt that points at the Markdown.
 */
export function PageActions({
  markdownPath,
  markdownUrl,
}: {
  /** The page's Markdown on this site, `/docs/ci.md`. */
  markdownPath: string;
  /** The same, as an absolute URL for the assistants. */
  markdownUrl: string;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const root = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );

  const copy = () => {
    copyMarkdown(markdownPath).then(
      () => {
        setStatus('copied');
      },
      () => {
        setStatus('failed');
      },
    );
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setStatus('idle');
    }, 1800);
    setOpen(false);
  };

  return (
    <div ref={root} className="relative flex shrink-0 items-stretch">
      <button
        type="button"
        onClick={copy}
        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-l-lg border border-line bg-raised px-2.5 text-[12.5px] text-fg-soft transition-colors hover:border-line-strong hover:text-fg"
      >
        {status === 'copied' ? (
          <CheckIcon className="size-3.5 text-cyan" />
        ) : (
          <CopyIcon className="size-3.5" />
        )}
        Copy page
      </button>
      <button
        type="button"
        aria-expanded={open}
        aria-label="More page actions"
        onClick={() => {
          setOpen(!open);
        }}
        className="-ml-px inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-r-lg border border-line bg-raised text-muted transition-colors hover:border-line-strong hover:text-fg"
      >
        <ChevronDownIcon className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <span className="sr-only" role="status">
        {status === 'copied'
          ? 'Copied the page as Markdown'
          : status === 'failed'
            ? 'Could not copy the page'
            : ''}
      </span>
      {open && (
        <div className="absolute top-full right-0 z-20 mt-1.5 w-60 rounded-xl border border-line bg-ink p-1.5 shadow-[0_16px_40px_var(--site-shadow)]">
          <ul className="grid gap-0.5">
            <li>
              <button type="button" onClick={copy} className={row}>
                <CopyIcon className="size-4 text-subtle" />
                Copy page as Markdown
              </button>
            </li>
            <li>
              <a href={markdownPath} className={row}>
                <FileTextIcon className="size-4 text-subtle" />
                View as Markdown
              </a>
            </li>
            {assistantLinks(markdownUrl).map((link) => (
              <li key={link.label}>
                <a href={link.href} target="_blank" rel="noopener noreferrer" className={row}>
                  <SparkIcon className="size-4 text-subtle" />
                  <span className="flex-1">{link.label}</span>
                  <ArrowUpRightIcon className="size-3.5 text-subtle" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
