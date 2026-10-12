"use client";

import { Copy, Tick, useCopyToClipboard } from "@dub/ui";
import { cn, linkConstructor } from "@dub/utils";
import { HTMLProps } from "react";
import { toast } from "sonner";

type CopyShortLinkProps = {
  value?: string;
  url?: string;
  href?: string;
  domain?: string;
  key?: string;
  successMessage?: string;
} & Omit<HTMLProps<HTMLDivElement>, "value" | "onChange">;

export function CopyShortLink({
  value,
  url,
  href,
  domain,
  key,
  className,
  successMessage,
  ...divProps
}: CopyShortLinkProps) {
  const shortLink =
    value ||
    url ||
    href ||
    (domain && key ? linkConstructor({ domain, key, pretty: false }) : "") ||
    "";

  const [copied, copyToClipboard] = useCopyToClipboard(2000);

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-md border border-neutral-300 bg-white p-2 text-sm",
        className,
      )}
      {...divProps}
    >
      <input
        type="text"
        readOnly
        value={shortLink}
        onClick={(e) => e.currentTarget.select()}
        className="w-full bg-transparent border-0 text-sm text-neutral-900 focus:outline-none focus:ring-0 truncate font-mono select-all"
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toast.promise(copyToClipboard(shortLink), {
            success: successMessage || "Copied to clipboard!",
          });
        }}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-900 transition-colors hover:bg-neutral-50 active:bg-neutral-100"
      >
        <span className="sr-only">Copy short link</span>
        {copied ? (
          <Tick className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}
