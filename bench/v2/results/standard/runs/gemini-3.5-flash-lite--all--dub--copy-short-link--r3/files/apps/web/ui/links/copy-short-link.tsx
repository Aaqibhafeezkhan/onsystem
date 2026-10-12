"use client";

import { CopyButton } from "@dub/ui";
import { cn } from "@dub/utils";
import { useId } from "react";

export type CopyShortLinkProps = {
  shortLink?: string;
  url?: string;
  value?: string;
  className?: string;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "value">;

export function CopyShortLink({
  shortLink,
  url,
  value,
  className,
  ...props
}: CopyShortLinkProps) {
  const linkValue = shortLink || value || url || "";
  const inputId = useId();

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm",
        className,
      )}
      {...props}
    >
      <span
        id={inputId}
        className="truncate font-mono text-neutral-600 select-all"
      >
        {linkValue}
      </span>
      <CopyButton
        value={linkValue}
        variant="neutral"
        className="rounded-md border border-neutral-200 bg-white p-1.5 hover:bg-neutral-50 active:bg-neutral-100"
      />
    </div>
  );
}
