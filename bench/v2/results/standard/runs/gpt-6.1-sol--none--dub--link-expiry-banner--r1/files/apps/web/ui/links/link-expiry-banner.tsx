"use client";

import { X } from "@/ui/shared/icons";
import { Callout } from "@/ui/shared/callout";
import { Button } from "@dub/ui";
import { cn } from "@dub/utils";
import { useEffect, useState } from "react";

const ONE_DAY = 24 * 60 * 60 * 1000;

type LinkExpiryBannerProps = {
  expiresAt: Date | string | null;
  onExtendExpiration: () => void;
  className?: string;
};

export function LinkExpiryBanner({
  expiresAt,
  onExtendExpiration,
  className,
}: LinkExpiryBannerProps) {
  const expirationTime = expiresAt ? new Date(expiresAt).getTime() : NaN;
  const [now, setNow] = useState(() => Date.now());
  const [dismissedExpiration, setDismissedExpiration] = useState<number | null>(
    null,
  );

  // Update at the warning and expiration boundaries, even without a re-render.
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const update = () => {
      const currentTime = Date.now();
      setNow(currentTime);
      const remaining = expirationTime - currentTime;

      if (!Number.isFinite(remaining) || remaining <= 0) return;

      const nextBoundary = remaining > ONE_DAY ? remaining - ONE_DAY : remaining;
      timeout = setTimeout(update, Math.min(nextBoundary, ONE_DAY));
    };

    update();
    return () => clearTimeout(timeout);
  }, [expirationTime]);

  const remaining = expirationTime - now;
  if (
    !Number.isFinite(remaining) ||
    remaining <= 0 ||
    remaining > ONE_DAY ||
    dismissedExpiration === expirationTime
  ) {
    return null;
  }

  return (
    <div role="status">
      <Callout
        variant="warn"
        className={cn(
          "relative pr-14 [&>div:last-child]:flex-1",
          className,
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="leading-5">
            This short link expires within 24 hours. Extend its expiration to
            keep it accessible.
          </p>
          <Button
            type="button"
            variant="secondary"
            text="Extend expiration"
            className="h-8 w-fit shrink-0 text-xs"
            onClick={onExtendExpiration}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          icon={<X className="size-4" aria-hidden="true" />}
          aria-label="Dismiss expiration warning"
          className="absolute right-3 top-3 size-7 p-0 text-amber-900"
          onClick={() => setDismissedExpiration(expirationTime)}
        />
      </Callout>
    </div>
  );
}
