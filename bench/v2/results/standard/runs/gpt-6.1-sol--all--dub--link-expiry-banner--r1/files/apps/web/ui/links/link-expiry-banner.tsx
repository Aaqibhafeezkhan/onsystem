"use client";

import { Alert, AlertDescription, Button, TriangleWarning, Xmark } from "@dub/ui";
import { useEffect, useState } from "react";

const ONE_DAY = 24 * 60 * 60 * 1000;
const MAX_TIMEOUT = 2 ** 31 - 1;

export interface LinkExpiryBannerProps {
  expiresAt: Date | string | number | null | undefined;
  onExtendExpiration: () => void;
  onDismiss?: () => void;
}

export function LinkExpiryBanner({
  expiresAt,
  onExtendExpiration,
  onDismiss,
}: LinkExpiryBannerProps) {
  const expiration =
    expiresAt == null ? NaN : new Date(expiresAt).getTime();
  const [now, setNow] = useState(() => Date.now());
  const [dismissedExpiration, setDismissedExpiration] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (!Number.isFinite(expiration)) return;

    let timer: ReturnType<typeof setTimeout>;
    // Recheck at the warning threshold and expiration, even without a rerender.
    const update = () => {
      const currentTime = Date.now();
      setNow(currentTime);
      const remaining = expiration - currentTime;
      if (remaining <= 0) return;
      const delay = remaining > ONE_DAY ? remaining - ONE_DAY : remaining;
      timer = setTimeout(update, Math.min(delay, MAX_TIMEOUT));
    };

    update();
    return () => clearTimeout(timer);
  }, [expiration]);

  const remaining = expiration - now;
  if (
    !Number.isFinite(expiration) ||
    remaining <= 0 ||
    remaining > ONE_DAY ||
    dismissedExpiration === expiration
  ) {
    return null;
  }

  return (
    <Alert className="border-border-subtle bg-bg-warning text-content-default">
      <div className="flex items-start gap-3">
        <TriangleWarning
          aria-hidden="true"
          className="size-5 shrink-0 text-content-warning"
        />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
          <AlertDescription className="flex-1">
            This short link expires within 24 hours. Extend its expiration to
            keep it active.
          </AlertDescription>
          <Button
            type="button"
            variant="secondary"
            className="w-auto shrink-0"
            text="Extend expiration"
            onClick={onExtendExpiration}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="size-10 shrink-0 p-0"
          aria-label="Dismiss link expiration warning"
          icon={<Xmark aria-hidden="true" className="size-4" />}
          onClick={() => {
            setDismissedExpiration(expiration);
            onDismiss?.();
          }}
        />
      </div>
    </Alert>
  );
}
