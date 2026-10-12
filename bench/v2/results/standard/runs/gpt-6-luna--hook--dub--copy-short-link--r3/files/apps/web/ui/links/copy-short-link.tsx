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
      <div className="min-w-0 flex-1">
        <Input
          aria-label="Short link"
          readOnly
          value={shortLink}
          className="h-10 max-w-none"
        />
      </div>
      <Button
        variant="secondary"
        className="size-10 shrink-0 p-0"
        icon={copied ? <Tick className="size-4" /> : <Copy className="size-4" />}
        aria-label={copied ? "Copied" : "Copy short link"}
        onClick={() => copyToClipboard(shortLink)}
      />
    </div>
  );
}
