"use client";

import { Alert, AlertDescription, AlertTitle, Button } from "@dub/ui";
import { TriangleWarning, Xmark } from "@dub/ui/icons";
import { useState } from "react";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const HOUR_IN_MS = 60 * 60 * 1000;

interface LinkExpiryBannerProps {
  expiresAt: Date | string | null | undefined;
  onExtend?: () => void;
  className?: string;
}

export function LinkExpiryBanner({
  expiresAt,
  onExtend,
  className,
}: LinkExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !expiresAt) {
    return null;
  }

  const expiresAtTime = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresAtTime)) {
    return null;
  }

  const msUntilExpiry = expiresAtTime - Date.now();
  if (msUntilExpiry <= 0 || msUntilExpiry > DAY_IN_MS) {
    return null;
  }

  const hoursLeft = Math.max(1, Math.ceil(msUntilExpiry / HOUR_IN_MS));

  return (
    <Alert className={className}>
      <TriangleWarning className="size-4 shrink-0 text-amber-500" />
      <AlertTitle>Link expiring soon</AlertTitle>
      <AlertDescription>
        This link expires in {hoursLeft} {hoursLeft === 1 ? "hour" : "hours"}.
        After that, it will no longer redirect visitors.
      </AlertDescription>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          text="Extend expiration"
          onClick={onExtend}
          className="h-8 w-auto px-3"
        />
        <Button
          variant="outline"
          aria-label="Dismiss expiration warning"
          onClick={() => setDismissed(true)}
          icon={<Xmark className="size-3" />}
          className="h-8 w-8 p-0"
        />
      </div>
    </Alert>
  );
}
