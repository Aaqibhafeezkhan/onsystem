"use client";

import { Button } from "@dub/ui";
import { TriangleWarning, Xmark } from "@dub/ui/icons";
import { cn } from "@dub/utils";
import { useState, type ReactNode } from "react";

export interface LinkExpiryBannerProps {
  expiresAt?: Date | string | null;
  link?: { expiresAt?: Date | string | null; [key: string]: any };
  expiresWithin24Hours?: boolean;
  onExtendExpiration?: () => void;
  onDismiss?: () => void;
  className?: string;
  children?: ReactNode;
}

export function LinkExpiryBanner({
  expiresAt,
  link,
  expiresWithin24Hours: expiresWithin24HoursProp,
  onExtendExpiration,
  onDismiss,
  className,
  children,
}: LinkExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  const targetExpiry = expiresAt ?? link?.expiresAt;
  const timeUntilExpiry = targetExpiry ? new Date(targetExpiry).getTime() - Date.now() : null;

  const isWithin24Hours =
    expiresWithin24HoursProp !== undefined
      ? expiresWithin24HoursProp
      : timeUntilExpiry !== null
        ? timeUntilExpiry > 0 && timeUntilExpiry <= 24 * 60 * 60 * 1000
        : true;

  if (!isWithin24Hours) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Link Expiry Warning"
      className={cn(
        "relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <TriangleWarning className="size-4 shrink-0 text-amber-600" />
        <p className="text-sm">
          {children || (
            <>
              This short link expires within 24 hours. Click{" "}
              <span className="font-semibold">Extend expiration</span> to keep it active.
            </>
          )}
        </p>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        <Button
          text="Extend expiration"
          variant="secondary"
          onClick={onExtendExpiration}
          className="h-8 px-3 text-xs sm:text-sm font-medium border-amber-300 bg-white hover:bg-amber-100 text-amber-900"
        />
        <Button
          variant="outline"
          icon={<Xmark className="size-4 text-amber-700" />}
          aria-label="Close banner"
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
          className="size-8 p-0 text-amber-700 hover:bg-amber-500/10 hover:text-amber-900 border-transparent"
        />
      </div>
    </div>
  );
}
