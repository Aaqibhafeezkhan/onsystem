"use client";

import { Button, Copy, Input, Tick, useCopyToClipboard } from "@dub/ui";

export function CopyShortLink({ shortLink }: { shortLink: string }) {
  const [copied, copyToClipboard] = useCopyToClipboard(2000);

  return (
    <div className="flex w-full items-center">
      <div className="min-w-0 flex-1">
        <Input
          type="text"
          value={shortLink}
          readOnly
          aria-label="Short link"
          className="max-w-none border-border-default read-only:bg-bg-muted read-only:text-content-default focus:border-border-emphasis focus:ring-border-emphasis"
        />
      </div>
      <Button
        type="button"
        variant="secondary"
        className="w-auto shrink-0"
        aria-label={copied ? "Copied" : "Copy short link"}
        title={copied ? "Copied" : "Copy short link"}
        onClick={(event) => {
          event.stopPropagation();
          void copyToClipboard(shortLink);
        }}
        icon={
          <span aria-hidden="true">
            {copied ? <Tick className="text-content-success" /> : <Copy />}
          </span>
        }
      />
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}
