"use client";

import { Copy, Tick, Tooltip, useCopyToClipboard } from "@dub/ui";
import { cn } from "@dub/utils";
import { ComponentPropsWithoutRef, forwardRef } from "react";
import { toast } from "sonner";

export interface CopyShortLinkProps
  extends Omit<ComponentPropsWithoutRef<"div">, "value"> {
  value?: string;
  shortLink?: string;
  url?: string;
  successMessage?: string;
  inputClassName?: string;
  buttonClassName?: string;
}

export const CopyShortLink = forwardRef<HTMLDivElement, CopyShortLinkProps>(
  (
    {
      value,
      shortLink,
      url,
      successMessage,
      className,
      inputClassName,
      buttonClassName,
      ...rest
    },
    ref,
  ) => {
    const linkValue = value || shortLink || url || "";
    const [copied, copyToClipboard] = useCopyToClipboard(2000);

    const handleCopy = () => {
      toast.promise(copyToClipboard(linkValue), {
        success: successMessage || "Copied to clipboard!",
      });
    };

    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-2", className)}
        {...rest}
      >
        <input
          type="text"
          readOnly
          value={linkValue}
          className={cn(
            "h-9 w-full min-w-0 grow rounded-md border border-neutral-300 bg-neutral-100 px-3 text-sm text-neutral-700 read-only:bg-neutral-100 read-only:text-neutral-700 focus:outline-none",
            inputClassName,
          )}
        />
        <Tooltip content={copied ? "Copied" : "Copy"}>
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-700 transition-colors hover:bg-neutral-50 active:bg-neutral-100",
              buttonClassName,
            )}
          >
            <span className="sr-only">Copy short link</span>
            {copied ? (
              <Tick className="size-4 text-neutral-800" />
            ) : (
              <Copy className="size-4 text-neutral-800" />
            )}
          </button>
        </Tooltip>
      </div>
    );
  },
);

CopyShortLink.displayName = "CopyShortLink";
