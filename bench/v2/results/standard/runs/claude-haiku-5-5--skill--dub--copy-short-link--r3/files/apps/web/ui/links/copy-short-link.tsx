"use client";

import {
  ButtonTooltip,
  Copy,
  Input,
  Tick,
  useCopyToClipboard,
} from "@dub/ui";
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
        value={shortLink}
        readOnly
        aria-label="Short link"
        className="max-w-none"
        onFocus={(e) => e.currentTarget.select()}
      />
      <ButtonTooltip
        tooltipProps={{
          content: copied ? "Copied" : "Copy link",
        }}
        onClick={() => copyToClipboard(shortLink)}
        disabled={!shortLink}
        aria-live="polite"
      >
        <span className="sr-only">{copied ? "Copied" : "Copy link"}</span>
        {copied ? (
          <Tick className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </ButtonTooltip>
    </div>
  );
}
