"use client";

import { Button } from "@dub/ui";
import { TriangleWarning, Xmark } from "@dub/ui/icons";
import { useState } from "react";

interface LinkExpiryBannerProps {
  expiresAt: Date | string;
  onExtendExpiration: () => void;
}

export function LinkExpiryBanner({
  expiresAt,
  onExtendExpiration,
}: LinkExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const expiresAtMs = new Date(
    expiresAt instanceof Date ? expiresAt.getTime() : expiresAt,
  ).getTime();
  const remainingMs = expiresAtMs - Date.now();

  if (
    dismissed ||
    !Number.isFinite(expiresAtMs) ||
    remainingMs <= 0 ||
    remainingMs > 24 * 60 * 60 * 1000
  ) {
    return null;
  }

  return (
    <div
      role="alert"
      className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900"
    >
      <TriangleWarning className="size-5 shrink-0 text-amber-600" />
      <p className="min-w-0 flex-1 text-sm">
        This short link expires within 24 hours. Extend its expiration to keep it
        active.
      </p>
      <Button
        type="button"
        variant="secondary"
        text="Extend expiration"
        className="shrink-0"
        onClick={onExtendExpiration}
      />
      <Button
        type="button"
        variant="outline"
        icon={<Xmark className="size-4" />}
        className="size-8 shrink-0 p-0"
        aria-label="Dismiss expiration warning"
        onClick={() => setDismissed(true)}
      />
    </div>
  );
}
