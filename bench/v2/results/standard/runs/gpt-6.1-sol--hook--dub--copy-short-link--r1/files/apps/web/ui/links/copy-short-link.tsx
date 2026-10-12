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
  const label = copied ? "Copied" : "Copy short link";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="min-w-0 flex-1">
        <Input
          type="text"
          aria-label="Short link"
          value={shortLink}
          readOnly
          className="h-10 max-w-none border-border-subtle read-only:bg-bg-subtle read-only:text-content-default focus:border-border-emphasis focus:ring-border-emphasis"
          onFocus={(event) => event.currentTarget.select()}
        />
      </div>
      <Tooltip content={label}>
        <Button
          type="button"
          variant="secondary"
          aria-label={label}
          className="size-10 shrink-0 px-0"
          disabled={!shortLink}
          onClick={() => copyToClipboard(shortLink)}
          icon={
            copied ? (
              <Tick className="size-4" aria-hidden="true" />
            ) : (
              <Copy className="size-4" aria-hidden="true" />
            )
          }
        />
      </Tooltip>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}
