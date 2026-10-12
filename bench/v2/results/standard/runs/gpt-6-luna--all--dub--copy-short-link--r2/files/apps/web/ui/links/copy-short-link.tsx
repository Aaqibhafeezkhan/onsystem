"use client";

import { Button, Input, useCopyToClipboard } from "@dub/ui";
import { Copy, Tick } from "@dub/ui/icons";

export function CopyShortLink({ shortLink }: { shortLink: string }) {
  const [copied, copyToClipboard] = useCopyToClipboard(2000);

  return (
    <div className="flex w-full items-center gap-2">
      <Input
        aria-label="Short link"
        className="max-w-none"
        readOnly
        value={shortLink}
      />
      <Button
        aria-label={copied ? "Copied" : "Copy short link"}
        className="size-10 shrink-0 !p-0"
        icon={
          copied ? (
            <Tick className="size-4" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )
        }
        onClick={() => copyToClipboard(shortLink)}
        variant="outline"
      />
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}
