"use client";

import { Alert, Button, TriangleWarning, Xmark } from "@dub/ui";
import { useEffect, useState } from "react";

const ONE_DAY = 24 * 60 * 60 * 1000;
const MAX_TIMEOUT = 2 ** 31 - 1;

export interface LinkExpiryBannerProps {
  expiresAt: Date | string | null;
  onExtendExpiration: () => void;
}

export function LinkExpiryBanner({
  expiresAt,
  onExtendExpiration,
}: LinkExpiryBannerProps) {
  const expiration =
    expiresAt instanceof Date
      ? expiresAt.getTime()
      : expiresAt === null
        ? NaN
        : new Date(expiresAt).getTime();
  const [now, setNow] = useState<number | null>(null);
  const [dismissedExpiration, setDismissedExpiration] = useState<number | null>(
    null,
  );

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const refresh = () => {
      const currentTime = Date.now();
      setNow(currentTime);

      if (!Number.isFinite(expiration) || expiration <= currentTime) return;

      const warningStartsAt = expiration - ONE_DAY;
      const nextChange =
        currentTime < warningStartsAt ? warningStartsAt : expiration;
      timeout = setTimeout(
        refresh,
        Math.min(nextChange - currentTime, MAX_TIMEOUT),
      );
    };

    refresh();
    return () => clearTimeout(timeout);
  }, [expiration]);

  if (
    now === null ||
    !Number.isFinite(expiration) ||
    expiration <= now ||
    expiration - now > ONE_DAY ||
    dismissedExpiration === expiration
  ) {
    return null;
  }

  return (
    <Alert className="border-content-warning bg-bg-warning text-content-emphasis">
      <div className="flex flex-wrap items-center gap-3">
        <TriangleWarning
          className="size-5 shrink-0 text-content-warning"
          aria-hidden="true"
        />
        <p className="flex-1 text-sm">
          This short link expires within 24 hours. Extend its expiration to keep
          it available.
        </p>
        <Button
          type="button"
          variant="secondary"
          className="w-auto"
          text="Extend expiration"
          onClick={onExtendExpiration}
        />
        <Button
          type="button"
          variant="outline"
          className="w-auto shrink-0 hover:bg-bg-subtle"
          aria-label="Dismiss link expiration warning"
          icon={<Xmark className="size-4" aria-hidden="true" />}
          onClick={() => setDismissedExpiration(expiration)}
        />
      </div>
    </Alert>
  );
}
