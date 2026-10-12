"use client";

import { Button, Copy, Input, Tick, useCopyToClipboard } from "@dub/ui";

export function CopyShortLink({
  shortLink,
  className,
}: {
  shortLink: string;
  className?: string;
}) {
  const [copied, copyToClipboard] = useCopyToClipboard(2000);

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={shortLink}
          readOnly
          aria-label="Short link"
          className="min-w-0 flex-1"
        />
        <Button
          type="button"
          variant="secondary"
          icon={
            copied ? <Tick className="size-4" /> : <Copy className="size-4" />
          }
          onClick={() => copyToClipboard(shortLink)}
          aria-label={copied ? "Copied" : "Copy short link"}
          className="w-fit shrink-0 px-2.5"
        />
      </div>
    </div>
  );
}
