"use client";

import { Button, Check, Copy, Input, useCopyToClipboard } from "@dub/ui";
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
    <div className={cn("flex w-full items-center", className)}>
      <Input
        aria-label="Short link"
        className="min-w-0 max-w-none flex-1 rounded-r-none"
        readOnly
        value={shortLink}
      />
      <Button
        aria-label={copied ? "Copied" : "Copy short link"}
        className="h-10 w-10 shrink-0 rounded-l-none p-0"
        icon={
          copied ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )
        }
        onClick={() => copyToClipboard(shortLink)}
        type="button"
        variant="secondary"
      />
    </div>
  );
}
