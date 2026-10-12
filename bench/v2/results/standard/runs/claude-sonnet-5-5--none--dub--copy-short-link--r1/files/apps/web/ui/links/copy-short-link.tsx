"use client";

import { Button, Copy, Input, Tick, useCopyToClipboard } from "@dub/ui";
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
        className="h-9 flex-1"
      />
      <Button
        type="button"
        variant="secondary"
        className="size-9 shrink-0 p-0"
        aria-label={copied ? "Copied" : "Copy short link"}
        title={copied ? "Copied" : "Copy short link"}
        icon={
          copied ? (
            <Tick className="size-4 text-green-600" />
          ) : (
            <Copy className="size-4 text-neutral-600" />
          )
        }
        onClick={() => copyToClipboard(shortLink)}
      />
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}
