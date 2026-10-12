"use client";

import { Button, Copy, Input, Tick, useCopyToClipboard } from "@dub/ui";

const COPIED_STATE_DURATION_MS = 2000;

export function CopyShortLink({ shortLink }: { shortLink: string }) {
  const [copied, copyToClipboard] = useCopyToClipboard(
    COPIED_STATE_DURATION_MS,
  );

  return (
    <div className="flex items-center gap-2">
      <Input
        type="text"
        value={shortLink}
        readOnly
        aria-label="Short link"
        className="min-w-0 max-w-none flex-1"
      />
      <Button
        type="button"
        variant="secondary"
        className="w-10 flex-none px-0"
        onClick={() => copyToClipboard(shortLink)}
        aria-label={copied ? "Copied" : "Copy short link"}
        icon={
          copied ? (
            <Tick className="size-4" aria-hidden />
          ) : (
            <Copy className="size-4" aria-hidden />
          )
        }
      />
    </div>
  );
}
