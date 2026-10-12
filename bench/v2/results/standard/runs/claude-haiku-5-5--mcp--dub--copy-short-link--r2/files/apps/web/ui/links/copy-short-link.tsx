"use client";

import {
  ButtonTooltip,
  Copy,
  Input,
  Tick,
  useCopyToClipboard,
} from "@dub/ui";
import { cn } from "@dub/utils";
import { toast } from "sonner";

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
        className="flex-1"
      />
      <ButtonTooltip
        type="button"
        variant="outline"
        tooltipProps={{
          content: copied ? "Copied" : "Copy short link",
        }}
        onClick={() => {
          toast.promise(copyToClipboard(shortLink), {
            success: "Short link copied to clipboard",
          });
        }}
      >
        <span className="sr-only">{copied ? "Copied" : "Copy short link"}</span>
        {copied ? (
          <Tick className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </ButtonTooltip>
    </div>
  );
}
