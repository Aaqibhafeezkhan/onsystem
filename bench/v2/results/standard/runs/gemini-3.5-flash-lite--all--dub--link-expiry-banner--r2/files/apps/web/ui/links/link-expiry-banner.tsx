"use client";

import { Button, TriangleWarning } from "@dub/ui";
import { Xmark } from "@dub/ui/icons";
import { cn } from "@dub/utils";
import { useState } from "react";

export interface LinkExpiryBannerProps {
  expiresAt?: Date | string | null;
  link?: {
    expiresAt?: Date | string | null;
    [key: string]: any;
  };
  onExtend?: () => void;
  onDismiss?: () => void;
  onClose?: () => void;
  show?: boolean;
  className?: string;
}

const isExpiringWithin24Hours = (dateInput?: Date | string | null) => {
  if (!dateInput) return false;
  const expiryDate = new Date(dateInput);
  const now = new Date();
  const diff = expiryDate.getTime() - now.getTime();
  return diff > 0 && diff <= 24 * 60 * 60 * 1000;
};

export function LinkExpiryBanner({
  expiresAt,
  link,
  onExtend,
  onDismiss,
  onClose,
  show,
  className,
}: LinkExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const targetExpiresAt = expiresAt ?? link?.expiresAt;
  const expiringSoon = targetExpiresAt ? isExpiringWithin24Hours(targetExpiresAt) : true;

  if (dismissed || show === false || (!expiringSoon && show !== true && targetExpiresAt)) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
    onClose?.();
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <TriangleWarning className="size-4 shrink-0 text-amber-600" />
        <p className="font-medium truncate">
          This short link expires within 24 hours.
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          text="Extend expiration"
          variant="secondary"
          onClick={onExtend}
          className="h-7 px-2.5 text-xs font-medium whitespace-nowrap"
        />
        <Button
          variant="outline"
          icon={<Xmark className="size-3.5" />}
          aria-label="Dismiss banner"
          className="size-7 rounded-md border-amber-300 bg-white/50 p-0 text-amber-900 hover:bg-amber-100 hover:text-amber-950"
          onClick={handleDismiss}
        />
      </div>
    </div>
  );
}
