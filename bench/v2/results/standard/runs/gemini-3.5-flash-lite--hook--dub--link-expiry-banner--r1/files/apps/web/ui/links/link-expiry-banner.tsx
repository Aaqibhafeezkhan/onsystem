"use client";

import { Button, TriangleWarning } from "@dub/ui";
import { Xmark } from "@dub/ui/icons";
import { cn } from "@dub/utils";
import { useState } from "react";

export interface LinkExpiryBannerProps {
  expiresAt?: string | Date | number | null;
  link?: {
    expiresAt?: string | Date | number | null;
  };
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
  const [dismissed, setDismissed] = useState(false);

  const expiryDate = expiresAt ?? link?.expiresAt;

  const isExpiringSoon = (() => {
    if (!expiryDate) return true;
    const expiryTime = new Date(expiryDate).getTime();
    if (isNaN(expiryTime)) return false;
    const now = Date.now();
    const diff = expiryTime - now;
    return diff > 0 && diff <= 24 * 60 * 60 * 1000;
  })();

  if (dismissed || !isExpiringSoon) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 sm:py-2.5",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <TriangleWarning className="size-4 shrink-0 text-amber-600" />
        <p className="text-sm font-medium">
          This short link expires within 24 hours.
        </p>
      </div>

      <div className="flex items-center gap-3 pr-6 sm:pr-0">
        <Button
          type="button"
          text="Extend expiration"
          variant="secondary"
          className="h-7 w-fit whitespace-nowrap bg-white px-2.5 text-xs font-medium text-amber-900 hover:bg-amber-100 border-amber-300 shadow-sm"
          onClick={onExtend}
        />
        <Button
          type="button"
          variant="outline"
          icon={<Xmark className="size-4" />}
          aria-label="Close banner"
          className="absolute right-2.5 top-1/2 size-7 -translate-y-1/2 p-0 text-amber-700 hover:bg-amber-100 hover:text-amber-900 border-transparent"
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
        />
      </div>
    </div>
  );
}
