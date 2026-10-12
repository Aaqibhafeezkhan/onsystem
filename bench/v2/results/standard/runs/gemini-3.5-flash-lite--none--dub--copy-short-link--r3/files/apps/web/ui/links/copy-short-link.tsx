"use client";

import { Copy, Input, Tick, useCopyToClipboard } from "@dub/ui";
import { cn, linkConstructor } from "@dub/utils";
import { toast } from "sonner";

export interface CopyShortLinkProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  url?: string;
  shortLink?: string;
  domain?: string;
  key?: string;
  successMessage?: string;
}

export function CopyShortLink({
  value,
  url,
  shortLink: shortLinkProp,
  domain,
  key,
  successMessage,
  className,
  ...props
}: CopyShortLinkProps) {
  const [copied, copyToClipboard] = useCopyToClipboard(2000);

  const displayValue =
    value ||
    shortLinkProp ||
    url ||
    (domain && key ? linkConstructor({ domain, key, pretty: true }) : "");

  const copyValue =
    value ||
    shortLinkProp ||
    url ||
    (domain && key ? linkConstructor({ domain, key }) : "");

  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <Input
        type="text"
        readOnly
        value={displayValue}
        className="font-mono text-sm"
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toast.promise(copyToClipboard(copyValue), {
            success: successMessage || "Copied to clipboard!",
          });
        }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-700 transition-all hover:bg-neutral-50 active:bg-neutral-100"
      >
        <span className="sr-only">Copy</span>
        {copied ? (
          <Tick className="size-4 text-neutral-900" />
        ) : (
          <Copy className="size-4 text-neutral-500" />
        )}
      </button>
    </div>
  );
}
