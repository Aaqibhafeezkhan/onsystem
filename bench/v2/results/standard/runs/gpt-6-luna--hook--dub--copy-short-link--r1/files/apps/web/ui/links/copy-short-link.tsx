"use client";

import { Button, Copy, Input, Tick, useCopyToClipboard } from "@dub/ui";

export function CopyShortLink({ shortLink }: { shortLink: string }) {
  const [copied, copyToClipboard] = useCopyToClipboard(2000);

  return (
    <div className="border-border-subtle flex min-w-0 items-center rounded-lg border bg-white">
      <Input
        aria-label="Short link"
        readOnly
        value={shortLink}
        className="!max-w-none !min-w-0 !flex-1 !rounded-none !border-0 !bg-transparent px-3 py-2 font-mono text-sm !text-content-default !shadow-none focus:!ring-0"
      />
      <Button
        variant="outline"
        aria-label={copied ? "Copied" : "Copy short link"}
        title={copied ? "Copied" : "Copy short link"}
        onClick={() => copyToClipboard(shortLink)}
        icon={
          copied ? (
            <Tick className="size-4" />
          ) : (
            <Copy className="size-4" />
          )
        }
        className="!mr-1 !size-8 !shrink-0 !rounded-md !border-0 !p-0"
      />
    </div>
  );
}
