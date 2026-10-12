"use client";

import { Button, Copy, Input, Tick, useCopyToClipboard } from "@dub/ui";

export function CopyShortLink({ shortLink }: { shortLink: string }) {
  const [copied, copyToClipboard] = useCopyToClipboard(2000);

  return (
    <div className="flex items-center gap-2">
      <Input
        aria-label="Short link"
        className="min-w-0 max-w-none flex-1"
        readOnly
        value={shortLink}
      />
      <Button
        aria-label={copied ? "Copied" : "Copy short link"}
        className="size-10 shrink-0 p-0"
        icon={
          copied ? (
            <Tick aria-hidden="true" className="size-4" />
          ) : (
            <Copy aria-hidden="true" className="size-4" />
          )
        }
        onClick={() => copyToClipboard(shortLink)}
        title={copied ? "Copied" : "Copy short link"}
        variant="secondary"
      />
      {copied && (
        <span aria-live="polite" className="text-sm text-neutral-500" role="status">
          Copied
        </span>
      )}
    </div>
  );
}
