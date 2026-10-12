"use client";

import { useState } from "react";
import { Button, TriangleWarning, Xmark } from "@dub/ui";
import { cn } from "@dub/utils";

export interface LinkExpiryBannerProps {
  expiresAt?: Date | string | null;
  onExtendExpiration?: () => void;
  onDismiss?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function LinkExpiryBanner({
  expiresAt,
  onExtendExpiration,
  onDismiss,
  className,
  children,
}: LinkExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  if (expiresAt !== undefined && expiresAt !== null) {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    // expires within 24 hours and not already expired
    if (diffMs <= 0 || diffMs > 24 * 60 * 60 * 1000) {
      return null;
    }
  }

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-neutral-900 dark:text-neutral-100",
        className,
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <TriangleWarning className="size-5 shrink-0 text-amber-500" variant="fill" />
        <div className="min-w-0">
          {children || (
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              This link expires within 24 hours.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          type="button"
          variant="secondary"
          onClick={onExtendExpiration}
          className="h-8 px-3 text-xs font-medium"
        >
          Extend expiration
        </Button>
        <Button
          type="button"
          variant="outline"
          icon={<Xmark className="size-4" />}
          className="size-8 p-0 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          onClick={handleDismiss}
          aria-label="Close banner"
        />
      </div>
    </div>
  );
}
