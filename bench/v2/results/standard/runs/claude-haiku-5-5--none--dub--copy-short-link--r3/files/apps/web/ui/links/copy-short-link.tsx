"use client";

import { Copy, Input, Tick, Tooltip, useCopyToClipboard } from "@dub/ui";
import { cn } from "@dub/utils";

const COPIED_STATE_DURATION_MS = 2000;

export function CopyShortLink({
  shortLink,
  className,
}: {
  shortLink: string;
  className?: string;
}) {
  const [copied, copyToClipboard] = useCopyToClipboard(
    COPIED_STATE_DURATION_MS,
  );

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Input
        type="text"
        readOnly
        value={shortLink}
        aria-label="Short link"
        onFocus={(e) => e.currentTarget.select()}
        className="min-w-0 flex-1 max-w-none px-3 py-2 font-mono text-sm"
      />
      <Tooltip content={copied ? "Copied" : "Copy short link"}>
        <button
          type="button"
          onClick={() => copyToClipboard(shortLink)}
          aria-label={copied ? "Copied" : "Copy short link"}
          className="flex size-9 shrink-0 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-700 transition-colors duration-150 hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-1 active:bg-neutral-100 [&_svg]:size-4"
        >
          {copied ? (
            <Tick className="text-green-600" aria-hidden />
          ) : (
            <Copy className="text-neutral-700" aria-hidden />
          )}
        </button>
      </Tooltip>
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}
