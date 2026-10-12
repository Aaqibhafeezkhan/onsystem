"use client";

import { ButtonTooltip, Copy, Input, Tick, useCopyToClipboard } from "@dub/ui";
import { cn } from "@dub/utils";
import { ComponentPropsWithoutRef, forwardRef } from "react";

export type CopyShortLinkProps = {
  value?: string;
  shortLink?: string;
  url?: string;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"div">, "value">;

export const CopyShortLink = forwardRef<HTMLDivElement, CopyShortLinkProps>(
  ({ value, shortLink, url, className, ...props }, ref) => {
    const linkValue = value || shortLink || url || "";
    const [copied, copyToClipboard] = useCopyToClipboard(2000);

    return (
      <div ref={ref} className={cn("flex items-center gap-2", className)} {...props}>
        <Input
          type="text"
          readOnly
          value={linkValue}
          onClick={(e) => e.currentTarget.select()}
          className="w-full min-w-0"
        />
        <ButtonTooltip
          tooltipProps={{
            content: copied ? "Copied" : "Copy link",
          }}
          onClick={() => copyToClipboard(linkValue)}
        >
          <span className="sr-only">{copied ? "Copied" : "Copy link"}</span>
          {copied ? <Tick className="size-3.5" /> : <Copy className="size-3.5" />}
        </ButtonTooltip>
      </div>
    );
  },
);

CopyShortLink.displayName = "CopyShortLink";
