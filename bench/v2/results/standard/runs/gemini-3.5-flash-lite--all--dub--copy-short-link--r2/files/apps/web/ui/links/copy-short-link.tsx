"use client";

import { Button, Copy, Input, Tick, useCopyToClipboard } from "@dub/ui";
import { cn } from "@dub/utils";
import { ComponentPropsWithoutRef, forwardRef } from "react";
import { toast } from "sonner";

export interface CopyShortLinkProps
  extends Omit<ComponentPropsWithoutRef<"div">, "onChange"> {
  shortLink?: string;
  value?: string;
  url?: string;
  successMessage?: string;
}

export const CopyShortLink = forwardRef<HTMLDivElement, CopyShortLinkProps>(
  (
    {
      shortLink,
      value,
      url,
      className,
      successMessage = "Copied short link to clipboard!",
      ...props
    },
    ref,
  ) => {
    const linkValue = shortLink || value || url || "";
    const [copied, copyToClipboard] = useCopyToClipboard(2000);

    const handleCopy = () => {
      toast.promise(copyToClipboard(linkValue), {
        success: successMessage,
      });
    };

    return (
      <div
        ref={ref}
        className={cn("relative flex items-center", className)}
        {...props}
      >
        <Input
          type="text"
          readOnly
          value={linkValue}
          className="pr-10 font-mono text-sm"
        />
        <div className="absolute right-1.5 flex items-center">
          <Button
            type="button"
            variant="outline"
            icon={
              copied ? (
                <Tick className="size-4 text-neutral-900" />
              ) : (
                <Copy className="size-4 text-neutral-500" />
              )
            }
            onClick={handleCopy}
            className="h-7 w-7 rounded-md p-0 hover:bg-neutral-100"
            aria-label={copied ? "Copied" : "Copy short link"}
          />
        </div>
      </div>
    );
  },
);

CopyShortLink.displayName = "CopyShortLink";
