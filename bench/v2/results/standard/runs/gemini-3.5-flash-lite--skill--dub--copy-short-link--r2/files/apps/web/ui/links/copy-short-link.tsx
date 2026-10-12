"use client";

import { Input, useCopyToClipboard } from "@dub/ui";
import { Copy, Tick } from "@dub/ui/icons";
import { linkConstructor, cn } from "@dub/utils";
import { ComponentPropsWithoutRef, forwardRef } from "react";
import { toast } from "sonner";

export interface CopyShortLinkProps
  extends Omit<
    ComponentPropsWithoutRef<typeof Input>,
    "value" | "readOnly" | "defaultValue"
  > {
  value?: string;
  shortLink?: string;
  domain?: string;
  key?: string;
  inputClassName?: string;
  copyButtonClassName?: string;
  successMessage?: string;
}

export const CopyShortLink = forwardRef<HTMLInputElement, CopyShortLinkProps>(
  (
    {
      value,
      shortLink,
      domain,
      key,
      className,
      inputClassName,
      copyButtonClassName,
      successMessage,
      ...inputProps
    },
    ref,
  ) => {
    const linkValue =
      value ||
      shortLink ||
      (domain && key ? linkConstructor({ domain, key }) : "") ||
      "";

    const displayValue =
      value ||
      shortLink ||
      (domain && key ? linkConstructor({ domain, key, pretty: true }) : "") ||
      "";

    const [copied, copyToClipboard] = useCopyToClipboard(2000);

    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Input
          ref={ref}
          type="text"
          readOnly
          value={displayValue}
          className={cn(
            "w-full rounded-md border border-neutral-300 bg-neutral-100 text-neutral-900 placeholder-neutral-400 read-only:bg-neutral-100 read-only:text-neutral-500 sm:text-sm",
            inputClassName,
          )}
          {...inputProps}
        />
        <button
          type="button"
          onClick={async (e) => {
            e.stopPropagation();
            toast.promise(copyToClipboard(linkValue), {
              success: successMessage || "Copied to clipboard!",
            });
          }}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-700 transition-all hover:bg-neutral-100 active:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-400",
            copyButtonClassName,
          )}
          aria-label={copied ? "Copied" : "Copy short link"}
        >
          <span className="sr-only">{copied ? "Copied" : "Copy"}</span>
          {copied ? (
            <Tick className="size-4 text-neutral-900" />
          ) : (
            <Copy className="size-4 text-neutral-500" />
          )}
        </button>
      </div>
    );
  },
);

CopyShortLink.displayName = "CopyShortLink";

export default CopyShortLink;
