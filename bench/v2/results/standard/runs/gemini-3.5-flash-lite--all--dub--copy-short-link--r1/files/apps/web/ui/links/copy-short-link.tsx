"use client";

import { Button, Input, useCopyToClipboard } from "@dub/ui";
import { Copy, Tick } from "@dub/ui";
import { cn } from "@dub/utils";
import React from "react";
import { toast } from "sonner";

export type CopyShortLinkProps = {
  value?: string;
  shortLink?: string;
  url?: string;
  className?: string;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "value">;

export function CopyShortLink({
  value,
  shortLink,
  url,
  className,
  ...props
}: CopyShortLinkProps) {
  const linkValue = value || shortLink || url || "";
  const [copied, copyToClipboard] = useCopyToClipboard(2000);

  const handleCopy = async () => {
    try {
      await copyToClipboard(linkValue);
      toast.success("Copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <Input
        type="text"
        readOnly
        value={linkValue}
        className="w-full bg-neutral-100 font-mono text-sm text-neutral-900"
      />
      <Button
        type="button"
        variant="secondary"
        onClick={handleCopy}
        icon={
          copied ? (
            <Tick className="size-4 text-neutral-700" />
          ) : (
            <Copy className="size-4 text-neutral-700" />
          )
        }
        className="h-9 w-9 p-0"
        aria-label={copied ? "Copied" : "Copy"}
      />
    </div>
  );
}

CopyShortLink.displayName = "CopyShortLink";
