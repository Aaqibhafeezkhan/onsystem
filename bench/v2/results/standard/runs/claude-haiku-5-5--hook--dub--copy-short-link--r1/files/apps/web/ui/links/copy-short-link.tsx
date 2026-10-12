"use client";

import { Button, Copy, Input, Tick, Tooltip, useCopyToClipboard } from "@dub/ui";
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
    <div className={cn("flex w-full items-center gap-2", className)}>
      <div className="min-w-0 flex-1">
        <Input
          type="text"
          readOnly
          value={shortLink}
          aria-label="Short link"
          onFocus={(e) => e.currentTarget.select()}
          className="h-10 max-w-none"
        />
      </div>
      <Tooltip content={copied ? "Copied" : "Copy short link"}>
        <Button
          variant="secondary"
          onClick={() => copyToClipboard(shortLink)}
          icon={
            copied ? (
              <Tick className="size-4 text-neutral-800" />
            ) : (
              <Copy className="size-4 text-neutral-800" />
            )
          }
          aria-label={copied ? "Copied" : "Copy short link"}
          className="h-10 w-10 shrink-0 px-0"
        />
      </Tooltip>
    </div>
  );
}
