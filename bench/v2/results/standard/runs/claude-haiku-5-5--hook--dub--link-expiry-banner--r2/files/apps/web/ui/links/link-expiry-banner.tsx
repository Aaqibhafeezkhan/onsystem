"use client";

import { Button, TriangleWarning } from "@dub/ui";
import { cn } from "@dub/utils";
import { useMemo, useState } from "react";
import { X } from "@/ui/shared/icons";

const EXPIRY_WINDOW_MS = 24 * 60 * 60 * 1000;

interface LinkExpiryBannerProps {
  expiresAt: Date | string | null | undefined;
  onExtendExpiration: () => void;
  className?: string;
}

function formatTimeRemaining(ms: number) {
  const minutes = Math.max(Math.floor(ms / 60_000), 1);

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }

  const hours = Math.floor(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}

export function LinkExpiryBanner({
  expiresAt,
  onExtendExpiration,
  className,
}: LinkExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const timeRemaining = useMemo(() => {
    if (!expiresAt) return null;

    const remainingMs = new Date(expiresAt).getTime() - Date.now();
    if (Number.isNaN(remainingMs)) return null;

    // Only warn for links that are still active but expire within 24 hours
    if (remainingMs <= 0 || remainingMs > EXPIRY_WINDOW_MS) return null;

    return formatTimeRemaining(remainingMs);
  }, [expiresAt]);

  if (dismissed || !timeRemaining) return null;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 py-2 pl-4 pr-2 text-amber-900",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <TriangleWarning className="size-4 shrink-0 text-amber-600" />
        <p className="truncate text-sm">
          This link expires in{" "}
          <span className="font-semibold">{timeRemaining}</span>.
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          text="Extend expiration"
          variant="secondary"
          onClick={onExtendExpiration}
          className="h-7 w-fit whitespace-nowrap border-amber-300 px-2.5 text-sm font-medium"
        />
        <Button
          type="button"
          variant="outline"
          aria-label="Dismiss expiration warning"
          icon={<X className="size-4" />}
          onClick={() => setDismissed(true)}
          className="size-7 w-auto shrink-0 p-0 text-amber-900 hover:bg-amber-100"
        />
      </div>
    </div>
  );
}
