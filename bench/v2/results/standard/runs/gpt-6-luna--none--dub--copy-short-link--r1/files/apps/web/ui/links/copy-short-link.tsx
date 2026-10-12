"use client";

import { ButtonTooltip, Copy, Tick, useCopyToClipboard } from "@dub/ui";

export function CopyShortLink({ shortLink }: { shortLink: string }) {
  const [copied, copyToClipboard] = useCopyToClipboard(2000);

  return (
    <div className="flex min-w-0 items-stretch">
      <input
        type="text"
        readOnly
        value={shortLink}
        aria-label="Short link"
        className="min-w-0 flex-1 rounded-l-md border border-r-0 border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none"
      />
      <div className="flex items-center rounded-r-md border border-neutral-300 bg-white px-1">
        <ButtonTooltip
          tooltipProps={{ content: copied ? "Copied" : "Copy short link" }}
          aria-label={copied ? "Copied" : "Copy short link"}
          onClick={() => copyToClipboard(shortLink)}
          className="text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
        >
          {copied ? (
            <Tick className="size-3.5" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </ButtonTooltip>
      </div>
    </div>
  );
}
