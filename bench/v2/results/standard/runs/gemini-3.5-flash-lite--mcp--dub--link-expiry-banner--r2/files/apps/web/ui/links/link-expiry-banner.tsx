"use client";

import { Button, TriangleWarning, Xmark } from "@dub/ui";
import { cn } from "@dub/utils";
import { differenceInHours } from "date-fns";
import { useState } from "react";

export interface LinkExpiryBannerProps {
  expiresAt?: Date | string | null;
  link?: { expiresAt?: Date | string | null; [key: string]: any };
  onExtend?: () => void;
  onDismiss?: () => void;
  onClose?: () => void;
  className?: string;
  message?: string;
}

export function LinkExpiryBanner({
  expiresAt,
  link,
  onExtend,
  onDismiss,
  onClose,
  className,
  message = "This short link expires within 24 hours.",
}: LinkExpiryBannerProps) {
  const [isOpen, setIsOpen] = useState(true);

  const expiry = expiresAt ?? link?.expiresAt;
  const expiryDate = expiry ? new Date(expiry) : null;
  const now = new Date();

  const isWithin24Hours = expiryDate
    ? expiryDate > now && differenceInHours(expiryDate, now) <= 24
    : true;

  if (!isOpen || !isWithin24Hours) {
    return null;
  }

  const handleDismiss = () => {
    setIsOpen(false);
    onDismiss?.();
    onClose?.();
  };

  return (
    <div
      role="region"
      aria-label="Link expiry warning"
      className={cn(
        "relative flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <TriangleWarning className="size-4 shrink-0 text-amber-600" variant="fill" />
        <p className="font-medium">{message}</p>
      </div>

      <div className="flex items-center gap-2">
        {onExtend && (
          <Button
            type="button"
            variant="secondary"
            text="Extend expiration"
            className="h-7 px-2.5 text-xs font-medium"
            onClick={onExtend}
          />
        )}
        <Button
          type="button"
          variant="outline"
          aria-label="Close"
          icon={<Xmark className="size-4" />}
          className="h-7 w-7 p-0 text-amber-700 hover:bg-amber-100 hover:text-amber-900"
          onClick={handleDismiss}
        />
      </div>
    </div>
  );
}
