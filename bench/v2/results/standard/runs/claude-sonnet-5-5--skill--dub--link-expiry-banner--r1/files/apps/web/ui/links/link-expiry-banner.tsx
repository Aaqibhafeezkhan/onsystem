"use client";

import { X } from "@/ui/shared/icons";
import { Button } from "@dub/ui";
import { TriangleWarning } from "@dub/ui/icons";
import { useState } from "react";

const DAY_MS = 24 * 60 * 60 * 1000;

export function LinkExpiryBanner({
  expiresAt,
  onExtend,
  onDismiss,
}: {
  expiresAt: Date | string | null | undefined;
  onExtend: () => void;
  onDismiss?: () => void;
}) {
  const [dismissed, setDismissed] = useState(false);

  if (!expiresAt || dismissed) return null;

  const remaining = new Date(expiresAt).getTime() - Date.now();
  if (Number.isNaN(remaining) || remaining <= 0 || remaining > DAY_MS) {
    return null;
  }

  return (
    <div
      role="alert"
      className="border-border-subtle flex items-center justify-between gap-3 rounded-lg border bg-amber-50 p-3"
    >
      <div className="flex min-w-0 items-center gap-2">
        <TriangleWarning className="size-4 shrink-0 text-amber-500" />
        <p className="text-content-emphasis text-sm font-medium">
          This link expires within 24 hours.
        </p>
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
          aria-label="Dismiss"
          icon={<X className="size-4" />}
          className="size-8 p-0"
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
        />
      </div>
    </div>
  );
}
