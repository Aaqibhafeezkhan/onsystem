"use client";

import { ButtonTooltip, Copy, Input, Tick, useCopyToClipboard } from "@dub/ui";
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
      <div className="min-w-0 flex-1">
        <Input
          type="text"
          readOnly
          value={shortLink}
          aria-label="Short link"
          onFocus={(e) => e.currentTarget.select()}
          className="max-w-none truncate font-mono"
        />
      </div>
      <ButtonTooltip
        tooltipProps={{ content: copied ? "Copied" : "Copy link" }}
        onClick={() => copyToClipboard(shortLink)}
        aria-label={copied ? "Copied" : "Copy short link"}
        className="size-10 shrink-0 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
      >
        {copied ? (
          <Tick className="size-4 text-green-600" />
        ) : (
          <Copy className="size-4" />
        )}
      </ButtonTooltip>
    </div>
  );
}
