"use client";

import { Alert, AlertDescription, Button } from "@dub/ui";
import { TriangleWarning, Xmark } from "@dub/ui/icons";
import { useEffect, useState } from "react";

const EXPIRY_WARNING_WINDOW = 24 * 60 * 60 * 1000;

export interface LinkExpiryBannerProps {
  expiresAt: Date | string | null;
  onExtendExpiration: () => void;
  onDismiss?: () => void;
}

export function LinkExpiryBanner({
  expiresAt,
  onExtendExpiration,
  onDismiss,
}: LinkExpiryBannerProps) {
  const expirationTime =
    expiresAt instanceof Date
      ? expiresAt.getTime()
      : expiresAt
        ? new Date(expiresAt).getTime()
        : NaN;
  const [now, setNow] = useState<number | null>(null);
  const [dismissedExpiration, setDismissedExpiration] = useState<number | null>(
    null,
  );

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const update = () => {
      const currentTime = Date.now();
      setNow(currentTime);

      const remaining = expirationTime - currentTime;
      if (!Number.isFinite(remaining) || remaining <= 0) return;

      // Recheck at the warning boundary and at expiration, even without a rerender.
      const delay =
        remaining > EXPIRY_WARNING_WINDOW
          ? remaining - EXPIRY_WARNING_WINDOW
          : remaining;
      timer = setTimeout(update, Math.min(delay, 2_147_483_647));
    };

    update();
    return () => clearTimeout(timer);
  }, [expirationTime]);

  if (
    now === null ||
    !Number.isFinite(expirationTime) ||
    expirationTime <= now ||
    expirationTime - now > EXPIRY_WARNING_WINDOW ||
    dismissedExpiration === expirationTime
  ) {
    return null;
  }

  return (
    <Alert className="border-content-warning/30 bg-bg-warning px-4 py-3 text-content-emphasis">
      <div className="flex items-start gap-3 sm:items-center">
        <TriangleWarning
          aria-hidden="true"
          className="mt-1 size-5 shrink-0 text-content-warning sm:mt-0"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <AlertDescription>
            This short link expires within 24 hours. Extend its expiration to keep
            it active.
          </AlertDescription>
          <Button
            type="button"
            variant="secondary"
            text="Extend expiration"
            className="w-fit shrink-0"
            onClick={onExtendExpiration}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          aria-label="Dismiss expiration warning"
          icon={<Xmark aria-hidden="true" className="size-4" />}
          className="size-8 shrink-0 p-0"
          onClick={() => {
            setDismissedExpiration(expirationTime);
            onDismiss?.();
          }}
        />
      </div>
    </Alert>
  );
}
