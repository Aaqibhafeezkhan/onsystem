"use client";

import { Button, Copy, Input, Tick, Tooltip, useCopyToClipboard } from "@dub/ui";
import { cn } from "@dub/utils";

export function CopyShortLink({
  shortLink,
  className,
}: {
  shortLink: string;
  className?: string;
}) {
  const [copied, copyToClipboard] = useCopyToClipboard(2000);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Input
        type="text"
        readOnly
        value={shortLink}
        aria-label="Short link"
        onFocus={(e) => e.currentTarget.select()}
        className="text-content-default h-10 min-w-0 max-w-none flex-1 truncate"
      />
      <Tooltip content={copied ? "Copied" : "Copy"}>
        <div>
          <Button
            type="button"
            variant="secondary"
            aria-label={copied ? "Copied" : "Copy short link"}
            onClick={() => copyToClipboard(shortLink)}
            className="size-10 shrink-0 p-0"
            icon={
              copied ? (
                <Tick className="text-content-emphasis size-4" />
              ) : (
                <Copy className="text-content-emphasis size-4" />
              )
            }
          />
        </div>
      </Tooltip>
      <span className="sr-only" role="status">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}
