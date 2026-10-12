"use client";

import { useCopyToClipboard } from "@dub/ui";
import { Copy, Tick } from "@dub/ui/icons";
import { cn } from "@dub/utils";
import { HTMLAttributes, ReactNode, useId } from "react";
import { toast } from "sonner";

export type CopyShortLinkProps = {
  shortLink?: string;
  value?: string;
  url?: string;
  children?: ReactNode;
  successMessage?: string;
  className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "onChange">;

export function CopyShortLink({
  shortLink,
  value,
  url,
  children,
  successMessage,
  className,
  ...props
}: CopyShortLinkProps) {
  const linkValue =
    shortLink ||
    value ||
    url ||
    (typeof children === "string" ? children : "");

  const [copied, copyToClipboard] = useCopyToClipboard(2000);
  const inputId = useId();

  const handleCopy = () => {
    if (!linkValue) return;
    toast.promise(copyToClipboard(linkValue), {
      success: successMessage || "Copied to clipboard!",
    });
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-md border border-neutral-300 bg-white px-3 py-1.5",
        className,
      )}
      {...props}
    >
      <input
        id={inputId}
        type="text"
        readOnly
        value={linkValue}
        className="w-full truncate border-0 bg-transparent p-0 font-mono text-xs text-neutral-500 focus:outline-none focus:ring-0 sm:text-sm"
      />
      <button
        type="button"
        onClick={handleCopy}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-900 active:bg-neutral-100"
        aria-label="Copy short link"
      >
        <span className="sr-only">Copy</span>
        {copied ? (
          <Tick className="h-3.5 w-3.5 text-neutral-900" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

export default CopyShortLink;
