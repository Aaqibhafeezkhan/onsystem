"use client";

import { ButtonTooltip, Copy, Tick, useCopyToClipboard } from "@dub/ui";
import { cn, linkConstructor } from "@dub/utils";
import { forwardRef, HTMLAttributes } from "react";
import { toast } from "sonner";

export type CopyShortLinkProps = {
  value?: string;
  shortLink?: string;
  url?: string;
  link?: string;
  domain?: string;
  key?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "value">;

export const CopyShortLink = forwardRef<HTMLDivElement, CopyShortLinkProps>(
  (
    {
      value,
      shortLink,
      url,
      link,
      domain,
      key,
      className,
      ...props
    },
    ref,
  ) => {
    const finalValue =
      value ||
      shortLink ||
      url ||
      link ||
      (domain && key ? linkConstructor({ domain, key, pretty: true }) : "");

    const copyValue =
      value ||
      shortLink ||
      url ||
      link ||
      (domain && key ? linkConstructor({ domain, key }) : "");

    const [copied, copyToClipboard] = useCopyToClipboard(2000);

    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-2", className)}
        {...props}
      >
        <div className="relative flex w-full rounded-md shadow-sm">
          <input
            type="text"
            readOnly
            value={finalValue}
            className="block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-neutral-500"
          />
        </div>
        <ButtonTooltip
          tooltipProps={{
            content: copied ? "Copied" : "Copy link",
          }}
          onClick={() => {
            toast.promise(copyToClipboard(copyValue), {
              success: "Link copied to clipboard",
            });
          }}
          disabled={!copyValue}
          className={cn(
            "h-9 w-9 shrink-0 rounded-md border border-neutral-300 bg-white hover:bg-neutral-50",
            copied && "border-green-300 bg-green-50 text-green-600",
          )}
        >
          {copied ? <Tick className="size-4" /> : <Copy className="size-4" />}
        </ButtonTooltip>
      </div>
    );
  },
);

CopyShortLink.displayName = "CopyShortLink";
