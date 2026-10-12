"use client";

import { Button } from "@dub/ui";
import { CircleHalfDottedClock } from "@dub/ui/icons";
import { cn } from "@dub/utils";
import { useEffect, useState } from "react";
import { X } from "../shared/icons";

const EXPIRY_WARNING_WINDOW = 24 * 60 * 60 * 1000;

export interface LinkExpiryBannerProps {
  expiresAt: Date | string | null | undefined;
  onExtendExpiration: () => void;
  className?: string;
}

export function LinkExpiryBanner({
  expiresAt,
  onExtendExpiration,
  className,
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
    if (!Number.isFinite(expirationTime)) return;

    let timeout: ReturnType<typeof setTimeout>;
    const update = () => {
      const currentTime = Date.now();
      setNow(currentTime);

      const remaining = expirationTime - currentTime;
      if (remaining <= 0) return;

      // Refresh at the warning boundary and expiration, even while idle.
      const nextBoundary =
        remaining > EXPIRY_WARNING_WINDOW
          ? remaining - EXPIRY_WARNING_WINDOW
          : remaining;
      timeout = setTimeout(update, Math.min(nextBoundary, 60_000));
    };

    update();
    return () => clearTimeout(timeout);
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
    <div
      role="status"
      className={cn(
        "relative flex flex-col gap-3 rounded-lg border border-content-warning/20 bg-bg-warning py-3 pl-4 pr-12 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <CircleHalfDottedClock
          aria-hidden="true"
          className="size-5 shrink-0 text-content-warning"
        />
        <p className="text-sm text-content-emphasis">
          This short link expires within 24 hours. Extend its expiration to keep
          it active.
        </p>
      </div>
      <Button
        type="button"
        variant="secondary"
        text="Extend expiration"
        className="h-8 w-fit shrink-0"
        onClick={onExtendExpiration}
      />
      <Button
        type="button"
        variant="outline"
        aria-label="Dismiss expiration warning"
        icon={<X aria-hidden="true" className="size-4" />}
        className="absolute right-2 top-2 size-8 p-0 text-content-warning focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-content-warning sm:top-1/2 sm:-translate-y-1/2"
        onClick={() => setDismissedExpiration(expirationTime)}
      />
    </div>
  );
}
