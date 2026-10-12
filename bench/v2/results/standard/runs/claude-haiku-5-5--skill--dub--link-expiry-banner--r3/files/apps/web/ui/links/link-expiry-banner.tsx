"use client";

import { X } from "@/ui/shared/icons";
import { Button, TriangleWarning } from "@dub/ui";
import { useState } from "react";

const EXPIRY_WARNING_WINDOW_MS = 24 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

interface LinkExpiryBannerProps {
  expiresAt: Date | string | null | undefined;
  onExtendExpiration: () => void;
}

export function LinkExpiryBanner({
  expiresAt,
  onExtendExpiration,
}: LinkExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !expiresAt) return null;

  const msUntilExpiry = new Date(expiresAt).getTime() - Date.now();

  // Only warn for links that have not expired yet and expire within 24 hours.
  if (
    Number.isNaN(msUntilExpiry) ||
    msUntilExpiry <= 0 ||
    msUntilExpiry > EXPIRY_WARNING_WINDOW_MS
  ) {
    return null;
  }

  const hoursLeft = Math.max(1, Math.ceil(msUntilExpiry / ONE_HOUR_MS));

  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-lg border border-border-subtle bg-bg-warning py-2 pl-4 pr-2 text-sm text-content-emphasis"
    >
      <TriangleWarning
        variant="fill"
        className="size-4 shrink-0 text-content-warning"
      />
      <p className="min-w-0 flex-1">
        This link expires in{" "}
        <span className="font-semibold">
          {hoursLeft} {hoursLeft === 1 ? "hour" : "hours"}
        </span>
        .
      </p>
      <Button
        type="button"
        variant="secondary"
        text="Extend expiration"
        onClick={onExtendExpiration}
        className="h-7 w-fit shrink-0 px-2.5 text-sm font-medium"
      />
      <Button
        type="button"
        variant="outline"
        aria-label="Dismiss expiration warning"
        onClick={() => setDismissed(true)}
        icon={<X className="size-4" />}
        className="size-7 w-fit shrink-0 p-0"
      />
    </div>
  );
}
