"use client";

import { Button, TriangleWarning } from "@dub/ui";
import { Xmark } from "@dub/ui/icons";
import { cn } from "@dub/utils";
import { differenceInHours, isBefore } from "date-fns";
import { useState } from "react";

export interface LinkExpiryBannerProps {
  expiresAt?: Date | string | null;
  onExtend?: () => void;
  onDismiss?: () => void;
  dismissed?: boolean;
  className?: string;
  text?: string | React.ReactNode;
}

function expiresWithin24Hours(expiresAt?: Date | string | null): boolean {
  if (!expiresAt) return false;
  const expiryDate = new Date(expiresAt);
  const now = new Date();
  if (isBefore(expiryDate, now)) return false; // already expired
  const hours = differenceInHours(expiryDate, now);
  return hours >= 0 && hours <= 24;
}

export function LinkExpiryBanner({
  expiresAt,
  onExtend,
  onDismiss,
  dismissed: dismissedProp,
  className,
  text = "This link expires within 24 hours.",
}: LinkExpiryBannerProps) {
  const [internalDismissed, setInternalDismissed] = useState(false);

  const isDismissed = dismissedProp ?? internalDismissed;
  const isExpiringSoon = expiresAt ? expiresWithin24Hours(expiresAt) : true;

  if (isDismissed || !isExpiringSoon) {
    return null;
  }

  const handleDismiss = () => {
    setInternalDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 shadow-sm",
        className,
      )}
      role="alert"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <TriangleWarning className="size-4 shrink-0 text-amber-600" />
        <p className="text-sm font-medium truncate">{text}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="secondary"
          text="Extend expiration"
          onClick={onExtend}
          className="h-7 px-2.5 text-xs font-medium"
        />
        <Button
          variant="outline"
          icon={<Xmark className="size-4" />}
          onClick={handleDismiss}
          aria-label="Dismiss banner"
          className="size-7 p-0 text-amber-900 hover:bg-amber-100/80 border-amber-200"
        />
      </div>
    </div>
  );
}

export default LinkExpiryBanner;
