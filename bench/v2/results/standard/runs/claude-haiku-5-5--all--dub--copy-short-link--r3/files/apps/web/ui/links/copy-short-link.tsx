"use client";

import { Button, Copy, Input, Tick, useCopyToClipboard } from "@dub/ui";

const COPIED_STATE_DURATION_MS = 2000;

export function CopyShortLink({ shortLink }: { shortLink: string }) {
  const [copied, copyToClipboard] = useCopyToClipboard(COPIED_STATE_DURATION_MS);

  return (
    <div className="flex items-center gap-2">
      <Input
        type="text"
        value={shortLink}
        readOnly
        aria-label="Short link"
        className="min-w-0 flex-1"
      />
      <Button
        variant="outline"
        className="w-auto flex-none px-2"
        icon={copied ? <Tick className="size-4" /> : <Copy className="size-4" />}
        aria-label={copied ? "Copied" : "Copy short link"}
        onClick={() => copyToClipboard(shortLink)}
      />
    </div>
  );
}
