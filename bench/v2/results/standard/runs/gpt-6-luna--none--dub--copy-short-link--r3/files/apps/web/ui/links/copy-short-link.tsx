"use client";

import { Copy, Input, Tick, useCopyToClipboard } from "@dub/ui";

export function CopyShortLink({ shortLink }: { shortLink: string }) {
  const [copied, copyToClipboard] = useCopyToClipboard(2000);

  return (
    <div className="flex items-center gap-2">
      <Input
        value={shortLink}
        readOnly
        aria-label="Short link"
        className="h-10 w-full max-w-none"
      />
      <button
        type="button"
        aria-label={copied ? "Copied" : "Copy short link"}
        title={copied ? "Copied" : "Copy short link"}
        onClick={() => copyToClipboard(shortLink)}
        disabled={!shortLink}
        className="flex size-10 shrink-0 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {copied ? (
          <Tick className="size-4" aria-hidden="true" />
        ) : (
          <Copy className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
