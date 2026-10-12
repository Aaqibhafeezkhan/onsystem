"use client";

import { Button, TriangleWarning, Xmark } from "@dub/ui";
import { cn } from "@dub/utils";
import { ReactNode, useMemo, useState } from "react";

export interface LinkExpiryBannerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  expiresAt?: Date | string | number | null;
  link?: {
    expiresAt?: Date | string | number | null;
    [key: string]: any;
  };
  onExtend?: () => void;
  onClose?: () => void;
  onDismiss?: () => void;
  children?: ReactNode;
}

export function LinkExpiryBanner({
  expiresAt,
  link,
  onExtend,
  onClose,
  onDismiss,
  className,
  children,
  ...props
}: LinkExpiryBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const expiryDate = useMemo(() => {
    const raw = expiresAt ?? link?.expiresAt;
    if (!raw) return null;
    const date = new Date(raw);
    return isNaN(date.getTime()) ? null : date;
  }, [expiresAt, link]);

  const isExpiringWithin24Hours = useMemo(() => {
    if (!expiryDate) return true;
    const now = Date.now();
    const diff = expiryDate.getTime() - now;
    return diff <= 24 * 60 * 60 * 1000;
  }, [expiryDate]);

  if (isDismissed || !isExpiringWithin24Hours) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 shadow-sm",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-5 shrink-0 items-center">
          <TriangleWarning className="size-4 shrink-0 text-amber-600" />
        </div>
        <div className="min-w-0 text-sm font-medium">
          {children || "This short link expires within 24 hours."}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="secondary"
          text="Extend expiration"
          onClick={onExtend}
          className="h-8 rounded-lg border-amber-300 bg-white px-3 text-xs font-medium text-amber-900 hover:bg-amber-100"
        />
        <Button
          variant="outline"
          icon={<Xmark className="size-4" />}
          className="size-8 rounded-lg border border-amber-200/80 bg-white/60 p-0 text-amber-900 hover:bg-white"
          onClick={() => {
            setIsDismissed(true);
            onClose?.();
            onDismiss?.();
          }}
          aria-label="Dismiss banner"
        />
      </div>
    </div>
  );
}

export default LinkExpiryBanner;
