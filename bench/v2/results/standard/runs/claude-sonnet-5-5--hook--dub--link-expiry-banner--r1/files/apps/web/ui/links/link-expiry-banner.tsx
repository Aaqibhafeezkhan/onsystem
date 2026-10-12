"use client";

import { X } from "@/ui/shared/icons";
import { Button } from "@dub/ui";
import { TriangleWarning } from "@dub/ui/icons";
import { useState } from "react";

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export function LinkExpiryBanner({
  expiresAt,
  onExtend,
  onDismiss,
}: {
  expiresAt: Date | string | null | undefined;
  onExtend?: () => void;
  onDismiss?: () => void;
}) {
  const [dismissed, setDismissed] = useState(false);

  if (!expiresAt || dismissed) return null;

  const remaining = new Date(expiresAt).getTime() - Date.now();
  if (Number.isNaN(remaining) || remaining <= 0 || remaining > TWENTY_FOUR_HOURS)
    return null;

  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
    >
      <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-amber-900">
        <TriangleWarning className="size-4 shrink-0 text-amber-600" />
        <span>This link expires within the next 24 hours.</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          text="Extend expiration"
          className="h-8 w-fit px-3"
          onClick={onExtend}
        />
        <Button
          type="button"
          variant="outline"
          icon={<X className="size-4" />}
          aria-label="Dismiss"
          className="h-auto w-fit p-1.5"
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
        />
      </div>
    </div>
  );
}
