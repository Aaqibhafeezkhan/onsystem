"use client";

import { Alert, Button } from "@dub/ui";
import { TriangleWarning, Xmark } from "@dub/ui/icons";
import { useState } from "react";

type LinkExpiryBannerProps = {
  expiresAt: Date | string | null | undefined;
  onExtendExpiration: () => void;
  onDismiss?: () => void;
};

const HOURS_24 = 24 * 60 * 60 * 1000;

export function LinkExpiryBanner({
  expiresAt,
  onExtendExpiration,
  onDismiss,
}: LinkExpiryBannerProps) {
  const [dismissedFor, setDismissedFor] = useState<number | null>(null);
  const expirationTime =
    expiresAt instanceof Date
      ? expiresAt.getTime()
      : expiresAt
        ? Date.parse(expiresAt)
        : Number.NaN;
  const now = Date.now();

  if (
    !Number.isFinite(expirationTime) ||
    expirationTime <= now ||
    expirationTime - now > HOURS_24 ||
    dismissedFor === expirationTime
  ) {
    return null;
  }

  const dismiss = () => {
    setDismissedFor(expirationTime);
    onDismiss?.();
  };

  return (
    <Alert
      role="status"
      className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-start gap-3">
        <TriangleWarning
          className="mt-0.5 size-5 shrink-0 text-amber-600"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold">Link expiring soon</p>
          <p className="mt-0.5 text-sm text-amber-900">
            This short link expires within 24 hours. Extend its expiration to
            keep it active.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          text="Extend expiration"
          onClick={onExtendExpiration}
          className="h-8 px-3"
        />
        <Button
          type="button"
          variant="outline"
          aria-label="Dismiss expiration warning"
          onClick={dismiss}
          icon={<Xmark className="size-4" aria-hidden="true" />}
          className="size-8 shrink-0 p-0 text-amber-900 hover:bg-amber-100"
        />
      </div>
    </Alert>
  );
}
