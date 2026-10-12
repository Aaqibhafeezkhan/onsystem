"use client";

import { Button, Input, useCopyToClipboard } from "@dub/ui";
import { Copy, Tick } from "@dub/ui/icons";

export function CopyShortLink({ shortLink }: { shortLink: string }) {
  const [copied, copyToClipboard] = useCopyToClipboard(2000);

  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <Input
          aria-label="Short link"
          className="min-w-0"
          readOnly
          value={shortLink}
        />
      </div>
      <Button
        aria-label={copied ? "Copied" : "Copy short link"}
        className="shrink-0"
        icon={
          copied ? <Tick className="size-4" /> : <Copy className="size-4" />
        }
        onClick={() => void copyToClipboard(shortLink)}
        title={copied ? "Copied" : "Copy short link"}
        type="button"
        variant="secondary"
      />
      <span aria-live="polite" className="min-w-12 text-sm">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}
