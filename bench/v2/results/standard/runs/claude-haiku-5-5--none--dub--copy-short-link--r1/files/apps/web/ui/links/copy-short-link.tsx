"use client";

import { Button, Copy, Input, Tick, Tooltip, useCopyToClipboard } from "@dub/ui";

const COPIED_STATE_DURATION_MS = 2000;

export function CopyShortLink({
  shortLink,
  className,
}: {
  shortLink: string;
  className?: string;
}) {
  const [copied, copyToClipboard] = useCopyToClipboard(
    COPIED_STATE_DURATION_MS,
  );

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={shortLink}
          readOnly
          aria-label="Short link"
          className="h-10 min-w-0 flex-1 max-w-none rounded-lg border-border-subtle bg-bg-muted font-mono text-sm text-content-emphasis"
        />
        <Tooltip content={copied ? "Copied" : "Copy short link"}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => copyToClipboard(shortLink)}
            icon={
              copied ? (
                <Tick className="size-4 text-content-emphasis" />
              ) : (
                <Copy className="size-4 text-content-emphasis" />
              )
            }
            aria-label={copied ? "Copied" : "Copy short link"}
            className="size-10 w-10 shrink-0 p-0"
          />
        </Tooltip>
      </div>
    </div>
  );
}
