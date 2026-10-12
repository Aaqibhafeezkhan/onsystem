"use client";

import { Button } from "@dub/ui";
import { TriangleWarning } from "@dub/ui/icons";
import { cn } from "@dub/utils";
import { X } from "lucide-react";
import { useMemo, useState } from "react";

export interface LinkExpiryBannerProps {
  link?: { expiresAt?: Date | string | null; [key: string]: any };
  expiresAt?: Date | string | null;
  onExtend?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function LinkExpiryBanner({
  link,
  expiresAt,
  onExtend,
  onDismiss,
  className,
}: LinkExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const expiryDate = useMemo(() => {
    const val = expiresAt ?? link?.expiresAt;
    if (!val) return null;
    const date = new Date(val);
    return isNaN(date.getTime()) ? null : date;
  }, [expiresAt, link?.expiresAt]);

  const expiresWithin24Hours = useMemo(() => {
    if (!expiryDate) return true;
    const now = Date.now();
    const diff = expiryDate.getTime() - now;
    return diff > 0 && diff <= 24 * 60 * 60 * 1000;
  }, [expiryDate]);

  if (dismissed || !expiresWithin24Hours) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 sm:flex-row sm:items-center sm:justify-between sm:py-3 sm:px-4",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <TriangleWarning className="size-4 shrink-0 text-amber-600" />
        <p className="text-sm font-medium">
          This short link expires within 24 hours.
        </p>
      </div>
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <Button
          text="Extend expiration"
          variant="secondary"
          onClick={onExtend}
          className="h-8 px-3 text-xs font-medium sm:text-sm"
        />
        <button
          type="button"
          aria-label="Close"
          className="rounded-md p-1.5 text-amber-700 transition-colors hover:bg-amber-500/10 hover:text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
