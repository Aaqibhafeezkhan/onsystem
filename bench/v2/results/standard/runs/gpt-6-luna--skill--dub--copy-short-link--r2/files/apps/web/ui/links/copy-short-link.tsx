"use client";

import { Button, Input, useCopyToClipboard } from "@dub/ui";
import { Check, Copy } from "@dub/ui/icons";

export function CopyShortLink({ shortLink }: { shortLink: string }) {
  const [copied, copyToClipboard] = useCopyToClipboard(2000);

  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <Input
          aria-label="Short link"
          className="h-10 max-w-none min-w-0 font-mono"
          readOnly
          value={shortLink}
        />
      </div>
      <Button
        aria-label={copied ? "Copied" : "Copy short link"}
        title={copied ? "Copied" : "Copy short link"}
        variant="secondary"
        icon={
          copied ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )
        }
        onClick={() => void copyToClipboard(shortLink)}
        className="size-10 w-10 shrink-0 px-0"
      />
    </div>
  );
}
