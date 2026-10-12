"use client";

import { Button, Copy, Input, Tick, useCopyToClipboard } from "@dub/ui";
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
        className="min-w-0 flex-1 truncate"
      />
      <Button
        type="button"
        variant="secondary"
        className="w-auto flex-none px-2.5"
        icon={
          copied ? (
            <Tick className="size-4 text-green-600" />
          ) : (
            <Copy className="size-4" />
          )
        }
        aria-label={copied ? "Copied" : "Copy short link"}
        onClick={() => copyToClipboard(shortLink)}
      />
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}
