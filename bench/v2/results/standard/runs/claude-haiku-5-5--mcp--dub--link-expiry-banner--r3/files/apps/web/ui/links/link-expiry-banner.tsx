"use client";

import {
  Alert,
  AlertDescription,
  Button,
  CircleWarning,
  Xmark,
} from "@dub/ui";
import { cn } from "@dub/utils";
import { useState } from "react";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

interface LinkExpiryBannerProps {
  expiresAt: Date | string;
  onExtend?: () => void;
  className?: string;
}

export function LinkExpiryBanner({
  expiresAt,
  onExtend,
  className,
}: LinkExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const remainingMs = new Date(expiresAt).getTime() - Date.now();

  // Only warn for links that have not expired yet and expire within 24 hours.
  if (dismissed || Number.isNaN(remainingMs)) return null;
  if (remainingMs <= 0 || remainingMs > DAY_MS) return null;

  const remainingHours = Math.ceil(remainingMs / HOUR_MS);
  const timeLeft =
    remainingMs < HOUR_MS
      ? "less than an hour"
      : `${remainingHours} ${remainingHours === 1 ? "hour" : "hours"}`;

  return (
    <Alert
      className={cn(
        "flex items-center gap-3 px-4 py-3",
        "[&>svg]:static [&>svg]:size-4 [&>svg]:shrink-0",
        "[&>svg+div]:translate-y-0 [&>svg~*]:pl-0",
        className,
      )}
    >
      <CircleWarning aria-hidden className="size-4 shrink-0" />

      <AlertDescription className="min-w-0 flex-1 truncate">
        This short link expires in {timeLeft}.
      </AlertDescription>

      <Button
        type="button"
        variant="secondary"
        text="Extend expiration"
        className="w-auto shrink-0 px-3"
        onClick={onExtend}
      />

      <Button
        type="button"
        variant="outline"
        icon={<Xmark className="size-4" />}
        aria-label="Dismiss expiration warning"
        className="size-8 shrink-0 p-0"
        onClick={() => setDismissed(true)}
      />
    </Alert>
  );
}
