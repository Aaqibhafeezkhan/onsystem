"use client";

import { Button, Input, useCopyToClipboard } from "@dub/ui";
import { Copy, Tick } from "@dub/ui";
import { cn } from "@dub/utils";
import { ComponentPropsWithoutRef } from "react";

export type CopyShortLinkProps = {
  value?: string;
  shortLink?: string;
  className?: string;
} & Omit<ComponentPropsWithoutRef<typeof Input>, "value" | "readOnly">;

export function CopyShortLink({
  value,
  shortLink,
  className,
  ...props
}: CopyShortLinkProps) {
  const linkValue = value || shortLink || "";
  const [copied, copyToClipboard] = useCopyToClipboard(2000);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Input
        readOnly
        value={linkValue}
        className="font-mono text-sm"
        {...props}
      />
      <Button
        variant="secondary"
        className="h-9 w-9 shrink-0 p-0"
        onClick={(e) => {
          e.stopPropagation();
          copyToClipboard(linkValue);
        }}
        icon={
          copied ? (
            <Tick className="size-4 text-neutral-800" />
          ) : (
            <Copy className="size-4 text-neutral-800" />
          )
        }
      />
    </div>
  );
}
