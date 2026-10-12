"use client";

import { Button, Copy, Input, Tick, useCopyToClipboard } from "@dub/ui";

type CopyShortLinkProps = {
  shortLink: string;
};

export function CopyShortLink({ shortLink }: CopyShortLinkProps) {
  const [copied, copyToClipboard] = useCopyToClipboard(2000);

  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <Input
          type="text"
          value={shortLink}
          readOnly
          aria-label="Short link"
          className="!max-w-none"
        />
      </div>
      <Button
        variant="outline"
        icon={
          copied ? (
            <Tick className="size-4" />
          ) : (
            <Copy className="size-4" />
          )
        }
        className="w-10 shrink-0 px-0"
        aria-label={copied ? "Copied" : "Copy short link"}
        title={copied ? "Copied" : "Copy short link"}
        disabled={!shortLink}
        onClick={() => copyToClipboard(shortLink)}
      />
      <span className="min-w-12 text-sm text-neutral-500" aria-live="polite">
        {copied ? "Copied" : null}
      </span>
    </div>
  );
}
