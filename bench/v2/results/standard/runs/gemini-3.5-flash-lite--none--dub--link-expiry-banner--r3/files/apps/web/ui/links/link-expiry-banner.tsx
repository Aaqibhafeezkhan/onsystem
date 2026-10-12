"use client";

import { Button } from "@dub/ui";
import { CircleHalfDottedClock, Xmark } from "@dub/ui/icons";
import { cn } from "@dub/utils";
import { useState, useMemo } from "react";

export interface LinkExpiryBannerProps {
  expiresAt?: Date | string | null;
  link?: { expiresAt?: Date | string | null };
  onExtend?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function LinkExpiryBanner({
  expiresAt,
  link,
  onExtend,
  onDismiss,
  className,
}: LinkExpiryBannerProps) {
  const [show, setShow] = useState(true);

  const expiryDate = useMemo(() => {
    const val = expiresAt ?? link?.expiresAt;
    if (!val) return null;
    const date = new Date(val);
    return isNaN(date.getTime()) ? null : date;
  }, [expiresAt, link?.expiresAt]);

  const isExpiringWithin24Hours = useMemo(() => {
    if (!expiryDate) {
      return true;
    }
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    return diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000;
  }, [expiryDate]);

  if (!show || !isExpiringWithin24Hours) {
    return null;
  }

  const handleDismiss = () => {
    setShow(false);
    onDismiss?.();
  };

  return (
    <div
      className={cn(
        "relative isolate flex flex-col justify-between gap-3 overflow-hidden rounded-lg border border-amber-200 bg-amber-50 py-3 pl-4 pr-12 text-amber-900 shadow-sm sm:flex-row sm:items-center sm:py-2.5 sm:pr-4",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="hidden rounded-full border border-amber-300 bg-white/60 p-1 shadow-[inset_0_0_1px_1px_#fff] sm:block text-amber-600">
          <CircleHalfDottedClock className="size-4" />
        </div>
        <p className="text-sm font-medium text-amber-900">
          This short link expires within 24 hours.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          className="h-7 px-3 text-xs font-medium"
          text="Extend expiration"
          onClick={onExtend}
        />
        <Button
          type="button"
          variant="outline"
          className="size-7 rounded-md border-amber-300 bg-white/60 p-0 text-amber-700 hover:bg-amber-100 hover:text-amber-900"
          icon={<Xmark className="size-4" />}
          aria-label="Close"
          onClick={handleDismiss}
        />
      </div>
    </div>
  );
}
