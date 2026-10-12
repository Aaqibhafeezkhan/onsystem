"use client";

import { X } from "@/ui/shared/icons";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  CircleWarning,
} from "@dub/ui";
import { cn } from "@dub/utils";
import { useState } from "react";

const HOURS_WINDOW = 24;

export function LinkExpiryBanner({
  expiresAt,
  onExtend,
  className,
}: {
  expiresAt: Date | string | null | undefined;
  onExtend?: () => void;
  className?: string;
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !expiresAt) return null;

  const expiresAtMs = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresAtMs)) return null;

  const now = Date.now();
  const msUntilExpiry = expiresAtMs - now;
  // Only warn for links that are still active but expire within the next 24 hours.
  if (msUntilExpiry <= 0 || msUntilExpiry > HOURS_WINDOW * 60 * 60 * 1000) {
    return null;
  }

  const hoursLeft = Math.max(1, Math.ceil(msUntilExpiry / (60 * 60 * 1000)));

  return (
    <Alert
      role="alert"
      variant="default"
      className={cn(
        "border-border-subtle bg-bg-default flex items-start gap-3 rounded-lg border p-4 sm:items-center",
        className,
      )}
    >
      <CircleWarning
        className="text-content-emphasis mt-0.5 size-4 shrink-0 sm:mt-0"
        aria-hidden
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
        <div className="min-w-0 flex-1">
          <AlertTitle className="text-content-emphasis text-sm font-semibold">
            This link expires soon
          </AlertTitle>
          <AlertDescription className="text-content-subtle text-sm">
            It will stop redirecting in less than {hoursLeft}{" "}
            {hoursLeft === 1 ? "hour" : "hours"}.
          </AlertDescription>
        </div>

        <Button
          type="button"
          variant="secondary"
          text="Extend expiration"
          onClick={onExtend}
          className="h-8 w-auto shrink-0 px-3 text-sm"
        />
      </div>

      <Button
        type="button"
        variant="outline"
        icon={<X className="size-4" />}
        aria-label="Dismiss expiration warning"
        onClick={() => setDismissed(true)}
        className="size-8 shrink-0 p-0"
      />
    </Alert>
  );
}
