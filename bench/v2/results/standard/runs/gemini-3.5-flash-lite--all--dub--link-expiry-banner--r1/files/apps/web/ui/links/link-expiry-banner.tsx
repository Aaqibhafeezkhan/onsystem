"use client";

import { Button, TriangleWarning } from "@dub/ui";
import { Xmark } from "@dub/ui/icons";
import { cn } from "@dub/utils";
import { differenceInHours, isAfter } from "date-fns";
import { useState } from "react";

export interface LinkExpiryBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  expiresAt?: Date | string | null;
  link?: { expiresAt?: Date | string | null; [key: string]: any };
  onExtend?: () => void;
  onDismiss?: () => void;
}

export function LinkExpiryBanner({
  expiresAt,
  link,
  onExtend,
  onDismiss,
  className,
  ...props
}: LinkExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const expiryDate = expiresAt
    ? new Date(expiresAt)
    : link?.expiresAt
    ? new Date(link.expiresAt)
    : null;

  const now = new Date();
  const isExpiringWithin24Hours = expiryDate
    ? isAfter(expiryDate, now) && differenceInHours(expiryDate, now) <= 24
    : false;

  if (dismissed || !isExpiringWithin24Hours) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      className={cn(
        "relative isolate flex flex-col justify-between gap-3 overflow-hidden rounded-lg border border-amber-500/20 bg-amber-50/80 px-4 py-3 sm:flex-row sm:items-center",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        <div className="rounded-full border border-amber-500/40 bg-white/60 p-1 shadow-sm">
          <TriangleWarning className="size-4 text-amber-600" variant="fill" />
        </div>
        <p className="text-sm text-neutral-900">
          This short link expires within 24 hours. Extend its expiration time to keep it active.
        </p>
      </div>

      <div className="flex items-center gap-2 sm:-my-1">
        <Button
          type="button"
          variant="outline"
          className="h-8 px-3 text-xs border-amber-500/40 text-neutral-900 hover:bg-amber-100/60"
          onClick={onExtend}
        >
          Extend expiration
        </Button>
        <Button
          type="button"
          variant="outline"
          aria-label="Close banner"
          className="h-8 w-8 p-0 text-neutral-500 hover:bg-amber-200/50 hover:text-neutral-900 sm:absolute sm:right-2.5 sm:top-1/2 sm:-translate-y-1/2"
          icon={<Xmark className="size-4" />}
          onClick={handleDismiss}
        />
      </div>
    </div>
  );
}
