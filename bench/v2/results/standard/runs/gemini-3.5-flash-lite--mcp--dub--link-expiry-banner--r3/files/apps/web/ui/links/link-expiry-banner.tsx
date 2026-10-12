"use client";

import { Button, TriangleWarning, Xmark } from "@dub/ui";
import { cn } from "@dub/utils";
import { useMemo, useState } from "react";

export interface LinkExpiryBannerProps {
  expiresAt?: Date | string | number | null;
  onExtend?: () => void;
  onClose?: () => void;
  className?: string;
}

export function LinkExpiryBanner({
  expiresAt,
  onExtend,
  onClose,
  className,
}: LinkExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const isExpiringWithin24Hours = useMemo(() => {
    if (!expiresAt) return true;
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return diffTime > 0 && diffTime <= twentyFourHours;
  }, [expiresAt]);

  if (dismissed || !isExpiringWithin24Hours) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onClose?.();
  };

  return (
    <div
      className={cn(
        "relative isolate flex flex-col justify-between gap-3 overflow-hidden rounded-lg border border-amber-500/20 bg-amber-50/90 px-4 py-3 pr-10 dark:border-amber-500/30 dark:bg-amber-950/40 sm:flex-row sm:items-center sm:pr-12",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="rounded-full border border-amber-500/30 bg-white/60 p-1 shadow-sm dark:bg-amber-900/40">
          <TriangleWarning className="size-4 text-amber-600 dark:text-amber-400" />
        </div>
        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
          This short link expires within 24 hours.
        </p>
      </div>

      <div className="flex items-center gap-2 sm:-my-1">
        <Button
          type="button"
          variant="secondary"
          className="h-7 px-3 text-xs font-medium"
          onClick={onExtend}
        >
          Extend expiration
        </Button>
      </div>

      <Button
        type="button"
        variant="outline"
        aria-label="Close banner"
        className="absolute right-2.5 top-2.5 h-7 w-7 p-0 text-amber-700 hover:bg-amber-500/10 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200 sm:top-1/2 sm:-translate-y-1/2"
        icon={<Xmark className="size-4" />}
        onClick={handleDismiss}
      />
    </div>
  );
}
