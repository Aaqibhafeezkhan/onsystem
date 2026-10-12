"use client";

import { Button, Xmark } from "@dub/ui";
import { Callout } from "@/ui/shared/callout";
import { cn } from "@dub/utils";
import { useState } from "react";

export interface LinkExpiryBannerProps {
  expiresAt?: Date | string | null;
  link?: { expiresAt?: Date | string | null; [key: string]: any };
  onExtend?: () => void;
  onClose?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function LinkExpiryBanner({
  expiresAt,
  link,
  onExtend,
  onClose,
  className,
  children,
}: LinkExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const expiry = expiresAt || link?.expiresAt;

  if (dismissed) {
    return null;
  }

  if (expiry) {
    const expiryDate = new Date(expiry);
    if (!isNaN(expiryDate.getTime())) {
      const now = new Date();
      const diffMs = expiryDate.getTime() - now.getTime();
      // Show only when expiring within 24 hours
      if (diffMs > 24 * 60 * 60 * 1000) {
        return null;
      }
    }
  }

  const handleClose = () => {
    setDismissed(true);
    onClose?.();
  };

  return (
    <Callout
      variant="warn"
      size={2}
      className={cn("flex items-center justify-between gap-4", className)}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="truncate">
          {children || "This short link expires within 24 hours."}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Button
          type="button"
          text="Extend expiration"
          variant="secondary"
          onClick={onExtend}
          className="h-7 px-2.5 text-xs font-medium"
        />
        <Button
          type="button"
          aria-label="Close"
          variant="outline"
          icon={<Xmark className="size-4" />}
          onClick={handleClose}
          className="h-7 w-7 p-0"
        />
      </div>
    </Callout>
  );
}
