"use client";

import { Button, Copy, Input, Tick, useCopyToClipboard } from "@dub/ui";

export function CopyShortLink({ shortLink }: { shortLink: string }) {
  const [copied, copyToClipboard] = useCopyToClipboard(2000);

  const copyShortLink = () => {
    void copyToClipboard(shortLink);
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        aria-label="Short link"
        className="max-w-none"
        readOnly
        value={shortLink}
      />
      <Button
        aria-label={copied ? "Copied" : "Copy short link"}
        className="size-10 shrink-0 p-0"
        icon={copied ? <Tick className="size-4" /> : <Copy className="size-4" />}
        onClick={copyShortLink}
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
