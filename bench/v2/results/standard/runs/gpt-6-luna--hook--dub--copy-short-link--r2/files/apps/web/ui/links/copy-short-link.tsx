"use client";

import { Button, Input, useCopyToClipboard } from "@dub/ui";
import { Copy, Tick } from "@dub/ui/icons";

export function CopyShortLink({ shortLink }: { shortLink: string }) {
  const [copied, copyToClipboard] = useCopyToClipboard(2000);

  return (
    <div className="flex min-w-0 items-center">
      <Input
        value={shortLink}
        readOnly
        aria-label="Short link"
        className="h-9 min-w-0 max-w-none rounded-r-none border-r-0 bg-white text-sm"
      />
      <Button
        variant="secondary"
        onClick={() => copyToClipboard(shortLink)}
        aria-label={copied ? "Copied" : "Copy short link"}
        title={copied ? "Copied" : "Copy short link"}
        icon={
          copied ? (
            <Tick className="size-4" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )
        }
        className="h-9 w-10 shrink-0 rounded-l-none rounded-r-md px-0"
      />
    </div>
  );
}
