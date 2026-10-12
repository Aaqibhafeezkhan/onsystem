"use client";

import { Button } from "@dub/ui";
import { CircleHalfDottedClock, TriangleWarning } from "@dub/ui/icons";
import { cn, pluralize } from "@dub/utils";
import { useState } from "react";
import { X } from "../shared/icons";

const EXPIRY_WINDOW_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

interface LinkExpiryBannerProps {
  expiresAt: Date | string | null | undefined;
  onExtend?: () => void;
  className?: string;
}

function getTimeUntilLabel(msRemaining: number) {
  if (msRemaining >= HOUR_MS) {
    const hours = Math.floor(msRemaining / HOUR_MS);
    return `${hours} ${pluralize("hour", hours)}`;
  }

  const minutes = Math.max(1, Math.ceil(msRemaining / MINUTE_MS));
  return `${minutes} ${pluralize("minute", minutes)}`;
}

export function LinkExpiryBanner({
  expiresAt,
  onExtend,
  className,
}: LinkExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!expiresAt || dismissed) return null;

  const expiresAtDate =
    expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  const msRemaining = expiresAtDate.getTime() - Date.now();

  // Only warn about links that are still active but expire within 24 hours
  if (Number.isNaN(msRemaining) || msRemaining <= 0) return null;
  if (msRemaining > EXPIRY_WINDOW_MS) return null;

  return (
    <div
      role="status"
      className={cn(
        "relative flex flex-col gap-3 overflow-hidden rounded-lg border border-border-subtle bg-bg-warning py-3 pl-4 pr-12 sm:flex-row sm:items-center sm:justify-between sm:py-2",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <TriangleWarning className="size-4 shrink-0 text-content-warning" />
        <p className="text-sm text-content-emphasis">
          This short link expires in{" "}
          <span className="font-semibold">
            {getTimeUntilLabel(msRemaining)}
          </span>
          .
        </p>
      </div>

      <div className="flex items-center sm:-my-1">
        <Button
          type="button"
          variant="secondary"
          text="Extend expiration"
          icon={<CircleHalfDottedClock className="size-4 shrink-0" />}
          onClick={onExtend}
          className="h-8 w-fit px-2.5 text-sm font-medium"
        />
      </div>

      <Button
        type="button"
        variant="outline"
        aria-label="Dismiss expiry warning"
        onClick={() => setDismissed(true)}
        icon={<X className="size-4" />}
        className="absolute right-2 top-2 size-7 w-auto px-0 text-content-subtle sm:top-1/2 sm:-translate-y-1/2"
      />
    </div>
  );
}
