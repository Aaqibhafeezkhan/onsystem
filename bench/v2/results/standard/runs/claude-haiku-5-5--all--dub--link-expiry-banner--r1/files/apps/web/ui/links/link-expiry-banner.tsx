"use client";

import { Alert, AlertDescription, AlertTitle, Button, CircleWarning, Xmark } from "@dub/ui";
import { useState } from "react";

const HOUR_IN_MS = 60 * 60 * 1000;
const DAY_IN_MS = 24 * HOUR_IN_MS;

interface LinkExpiryBannerProps {
  expiresAt: Date | string;
  onExtend?: () => void;
  className?: string;
}

export function LinkExpiryBanner({ expiresAt, onExtend, className }: LinkExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const msUntilExpiry = new Date(expiresAt).getTime() - Date.now();
  const isExpiringSoon = msUntilExpiry > 0 && msUntilExpiry <= DAY_IN_MS;

  if (dismissed || !isExpiringSoon) {
    return null;
  }

  const hoursLeft = Math.max(1, Math.ceil(msUntilExpiry / HOUR_IN_MS));

  return (
    <Alert variant="destructive" className={className}>
      <CircleWarning />
      <AlertTitle>Link expiring soon</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4">
        <span>
          This short link expires in about {hoursLeft} hour{hoursLeft === 1 ? "" : "s"}.
        </span>
        <span className="flex items-center gap-2">
          <Button type="button" variant="secondary" text="Extend expiration" onClick={onExtend} />
          <Button
            type="button"
            variant="outline"
            icon={<Xmark className="size-4" />}
            aria-label="Dismiss expiration warning"
            onClick={() => setDismissed(true)}
          />
        </span>
      </AlertDescription>
    </Alert>
  );
}
