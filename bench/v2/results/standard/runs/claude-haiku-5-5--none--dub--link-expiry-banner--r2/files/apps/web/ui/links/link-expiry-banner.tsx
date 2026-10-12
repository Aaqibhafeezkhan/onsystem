"use client";

import { Button, TriangleWarning } from "@dub/ui";
import { cn, formatDateTime } from "@dub/utils";
import { useState } from "react";
import { X } from "../shared/icons";

const EXPIRY_WINDOW_MS = 24 * 60 * 60 * 1000;

interface LinkExpiryBannerProps {
  expiresAt: Date | string | null | undefined;
  onExtendExpiration?: () => void;
  className?: string;
}

export function LinkExpiryBanner({
  expiresAt,
  onExtendExpiration,
  className,
}: LinkExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !expiresAt) return null;

  const expiresAtDate = new Date(expiresAt);
  if (Number.isNaN(expiresAtDate.getTime())) return null;

  const msUntilExpiry = expiresAtDate.getTime() - Date.now();
  // Only warn for links that are still active but expire within the next 24 hours
  if (msUntilExpiry <= 0 || msUntilExpiry > EXPIRY_WINDOW_MS) return null;

  return (
    <div
      role="status"
      className={cn(
        "border-border-subtle relative flex items-center justify-between gap-3 rounded-lg border bg-amber-50 py-3 pl-4 pr-10 sm:py-2",
        "flex-col sm:flex-row sm:items-center",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <TriangleWarning className="size-4 shrink-0 text-amber-500" />
        <p className="text-content-emphasis text-sm">
          This link expires on{" "}
          <span className="font-semibold">
            {formatDateTime(expiresAtDate)}
          </span>
          . Extend its expiration to keep it active.
        </p>
      </div>

      {onExtendExpiration && (
        <div className="flex items-center sm:-my-1">
          <Button
            type="button"
            variant="secondary"
            text="Extend expiration"
            className="h-7 w-fit whitespace-nowrap px-2.5 text-sm font-medium"
            onClick={onExtendExpiration}
          />
        </div>
      )}

      <button
        type="button"
        aria-label="Dismiss expiration warning"
        className="text-content-subtle hover:text-content-emphasis absolute right-2.5 top-2.5 rounded-md p-1 transition-colors sm:top-1/2 sm:-translate-y-1/2"
        onClick={() => setDismissed(true)}
      >
        <X className="size-[18px]" />
      </button>
    </div>
  );
}
