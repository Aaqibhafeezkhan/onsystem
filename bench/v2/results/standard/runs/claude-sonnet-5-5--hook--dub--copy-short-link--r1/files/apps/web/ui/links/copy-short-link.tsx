"use client";

import { Button, Copy, Input, Tick, useCopyToClipboard } from "@dub/ui";

export function CopyShortLink({ shortLink }: { shortLink: string }) {
  const [copied, copyToClipboard] = useCopyToClipboard(2000);

  return (
    <div className="flex items-center gap-2">
      <Input
        readOnly
        value={shortLink}
        onFocus={(e) => e.currentTarget.select()}
        aria-label="Short link"
        className="h-9 min-w-0 flex-1 font-mono"
      />
      <Button
        type="button"
        variant="secondary"
        className="h-9 w-9 shrink-0 px-0"
        aria-label={copied ? "Copied" : "Copy short link"}
        title={copied ? "Copied" : "Copy short link"}
        onClick={() => copyToClipboard(shortLink)}
        icon={
          copied ? (
            <Tick className="size-4 text-green-600" />
          ) : (
            <Copy className="size-4" />
          )
        }
      />
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}
