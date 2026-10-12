"use client";

import { Copy, Tick, useCopyToClipboard } from "@dub/ui";

export function CopyShortLink({ shortLink }: { shortLink: string }) {
  const [copied, copyToClipboard] = useCopyToClipboard(2000);

  return (
    <div className="flex w-full items-center">
      <input
        aria-label="Short link"
        className="min-w-0 flex-1 rounded-l-md border border-r-0 border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 read-only:bg-neutral-50 read-only:text-neutral-600 focus:outline-none"
        readOnly
        value={shortLink}
      />
      <button
        type="button"
        aria-label={copied ? "Copied" : "Copy short link"}
        title={copied ? "Copied" : "Copy short link"}
        onClick={() => copyToClipboard(shortLink)}
        className="flex size-10 flex-none items-center justify-center rounded-r-md border border-neutral-300 bg-white text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-700 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500"
      >
        {copied ? (
          <Tick className="size-4" />
        ) : (
          <Copy className="size-4" />
        )}
      </button>
    </div>
  );
}
