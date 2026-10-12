"use client";

import { Button, Copy, Input, Tick, useCopyToClipboard } from "@dub/ui";

export function CopyShortLink({ shortLink }: { shortLink: string }) {
  const [copied, copyToClipboard] = useCopyToClipboard(2000);

  return (
    <div className="flex items-center">
      <div className="min-w-0 flex-1">
        <Input
          type="text"
          value={shortLink}
          readOnly
          aria-label="Short link"
          onFocus={(event) => event.currentTarget.select()}
        />
      </div>
      <Button
        type="button"
        variant="secondary"
        className="w-auto shrink-0"
        icon={copied ? <Tick className="size-full" /> : <Copy className="size-full" />}
        aria-label={copied ? "Copied" : "Copy short link"}
        title={copied ? "Copied" : "Copy short link"}
        disabled={!shortLink || copied}
        onClick={() => void copyToClipboard(shortLink)}
      />
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}
