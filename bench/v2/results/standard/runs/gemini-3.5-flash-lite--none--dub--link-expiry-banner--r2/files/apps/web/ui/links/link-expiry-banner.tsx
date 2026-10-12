"use client";

import { Button } from "@dub/ui";
import { CircleHalfDottedClock } from "@dub/ui/icons";
import { X } from "@/ui/shared/icons";
import { cn } from "@dub/utils";
import { useMemo, useState } from "react";

export interface LinkExpiryBannerProps {
  expiresAt?: Date | string | null;
  link?: { expiresAt?: Date | string | null };
  onExtend?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function LinkExpiryBanner({
  expiresAt: expiresAtProp,
  link,
  onExtend,
  onDismiss,
  className,
}: LinkExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const expiresAt = expiresAtProp ?? link?.expiresAt;

  const isExpiringWithin24Hours = useMemo(() => {
    if (!expiresAt) return true;
    const date = new Date(expiresAt);
    if (isNaN(date.getTime())) return false;
    const now = new Date();
    const diffHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 24;
  }, [expiresAt]);

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
        "relative flex flex-col justify-between gap-3 overflow-hidden rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center",
        className,
      )}
    >
      <div className="flex items-center gap-3 pr-8 sm:pr-0">
        <div className="rounded-full border border-amber-200 bg-white/50 p-1 shadow-[inset_0_0_1px_1px_#fff]">
          <CircleHalfDottedClock className="size-4 text-amber-600" />
        </div>
        <p className="text-sm text-amber-900">
          This short link expires within 24 hours.{" "}
          <span className="font-medium">Extend expiration to avoid disruption.</span>
        </p>
      </div>

      <div className="flex items-center gap-2 sm:shrink-0">
        <Button
          text="Extend expiration"
          variant="secondary"
          onClick={onExtend}
          className="h-8 px-3 text-xs font-medium sm:text-sm"
        />
        <button
          type="button"
          aria-label="Close"
          className="absolute right-2.5 top-2.5 rounded-md p-1 text-amber-700 transition-colors hover:bg-amber-100 hover:text-amber-950 sm:static sm:right-auto sm:top-auto"
          onClick={handleDismiss}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
