"use client";

import { Button, Input, Tooltip, useCopyToClipboard } from "@dub/ui";
import { Copy, Tick } from "@dub/ui/icons";

export function CopyShortLink({ shortLink }: { shortLink: string }) {
  const [copied, copyToClipboard] = useCopyToClipboard(2000);

  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <Input
          type="text"
          aria-label="Short link"
          value={shortLink}
          readOnly
          className="h-10 max-w-none border-border-default read-only:bg-bg-subtle read-only:text-content-default focus:border-border-emphasis focus:ring-border-emphasis"
        />
      </div>
      <Tooltip content={copied ? "Copied" : "Copy short link"}>
        <Button
          type="button"
          variant="secondary"
          className="w-10 shrink-0 px-0"
          aria-label={copied ? "Copied" : "Copy short link"}
          onClick={() => void copyToClipboard(shortLink)}
          icon={
            <span aria-hidden="true">
              {copied ? (
                <Tick className="size-4 text-content-success" />
              ) : (
                <Copy className="size-4" />
              )}
            </span>
          }
        />
      </Tooltip>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}
