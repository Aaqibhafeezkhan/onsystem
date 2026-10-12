"use client";

import {
  Button,
  Copy,
  Input,
  Tick,
  Tooltip,
  useCopyToClipboard,
} from "@dub/ui";

const COPIED_STATE_DURATION_MS = 2000;

export function CopyShortLink({ shortLink }: { shortLink: string }) {
  const [copied, copyToClipboard] = useCopyToClipboard(
    COPIED_STATE_DURATION_MS,
  );

  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <Input
          type="text"
          value={shortLink}
          readOnly
          aria-label="Short link"
          className="max-w-none font-mono"
          onFocus={(e) => e.currentTarget.select()}
        />
      </div>
      <Tooltip content={copied ? "Copied" : "Copy short link"}>
        <Button
          variant="secondary"
          aria-label={copied ? "Copied" : "Copy short link"}
          icon={
            copied ? (
              <Tick className="size-4 text-content-emphasis" />
            ) : (
              <Copy className="size-4 text-content-emphasis" />
            )
          }
          onClick={() => copyToClipboard(shortLink)}
          className="size-10 w-10 shrink-0 px-0"
        />
      </Tooltip>
    </div>
  );
}
