"use client";

import { Button, TriangleWarning, Xmark } from "@dub/ui";
import { cn } from "@dub/utils";
import { useState } from "react";
import type { ReactNode } from "react";

export interface LinkExpiryBannerProps {
  expiresAt?: Date | string | null;
  link?: { expiresAt?: Date | string | null };
  onExtend?: () => void;
  onDismiss?: () => void;
  className?: string;
  children?: ReactNode;
}

export function LinkExpiryBanner({
  expiresAt,
  link,
  onExtend,
  onDismiss,
  className,
  children,
}: LinkExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const targetExpiresAt = expiresAt !== undefined ? expiresAt : link?.expiresAt;

  if (dismissed) {
    return null;
  }

  if (targetExpiresAt !== undefined && targetExpiresAt !== null) {
    const expiryTime = new Date(targetExpiresAt).getTime();
    const now = Date.now();
    const diff = expiryTime - now;

    // Show only when expires within 24 hours (0 < diff <= 24 hours)
    if (diff <= 0 || diff > 24 * 60 * 60 * 1000) {
      return null;
    }
  }

  return (
    <div
      role="region"
      aria-label="Link expiry warning"
      className={cn(
        "relative isolate flex items-center justify-between gap-3 overflow-hidden rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 sm:py-2.5",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <TriangleWarning className="size-4 shrink-0 text-amber-600" />
        <p className="text-sm">
          {children || "This link expires within 24 hours."}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          text="Extend expiration"
          variant="secondary"
          onClick={onExtend}
          className="h-7 w-fit px-2.5 text-xs font-medium"
        />
        <Button
          variant="outline"
          icon={<Xmark className="size-4" />}
          className="size-7 rounded-md p-0 text-amber-700 hover:bg-amber-100"
          aria-label="Close banner"
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
        />
      </div>
    </div>
  );
}
