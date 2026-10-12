"use client";

import { Copy, Tick, Tooltip, useCopyToClipboard } from "@dub/ui";

const COPIED_STATE_DURATION_MS = 2000;

export function CopyShortLink({
  shortLink,
  className,
}: {
  shortLink: string;
  className?: string;
}) {
  const [copied, copyToClipboard] = useCopyToClipboard(COPIED_STATE_DURATION_MS);

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <input
        type="text"
        readOnly
        value={shortLink}
        aria-label="Short link"
        onFocus={(e) => e.currentTarget.select()}
        className="h-9 min-w-0 grow rounded-lg border border-neutral-200 bg-neutral-50 px-3 font-mono text-sm text-neutral-800 focus:border-neutral-500 focus:outline-none focus:ring-0"
      />
      <Tooltip content={copied ? "Copied" : "Copy short link"}>
        <button
          type="button"
          onClick={() => copyToClipboard(shortLink)}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white transition-colors duration-150 hover:bg-neutral-50 [&_svg]:size-4"
        >
          <span className="sr-only">{copied ? "Copied" : "Copy short link"}</span>
          {copied ? (
            <Tick className="text-neutral-800" />
          ) : (
            <Copy className="text-neutral-800" />
          )}
        </button>
      </Tooltip>
    </div>
  );
}
