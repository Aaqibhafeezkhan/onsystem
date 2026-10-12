"use client";

import { Button, Copy, Input, Tick, useCopyToClipboard } from "@dub/ui";

export function CopyShortLink({ shortLink }: { shortLink: string }) {
  const [copied, copyToClipboard] = useCopyToClipboard(2000);

  return (
    <div className="flex items-center gap-2">
      <Input
        aria-label="Short link"
        readOnly
        value={shortLink}
        className="min-w-0 max-w-none flex-1 font-mono"
      />
      <Button
        aria-label={copied ? "Copied" : "Copy short link"}
        variant="secondary"
        icon={
          copied ? (
            <Tick className="size-4" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )
        }
        onClick={() => copyToClipboard(shortLink)}
        className="size-10 shrink-0 p-0"
      />
    </div>
  );
}
