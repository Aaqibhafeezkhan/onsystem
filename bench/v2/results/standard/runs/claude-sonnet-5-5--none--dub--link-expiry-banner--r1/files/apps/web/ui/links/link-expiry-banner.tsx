"use client";

import { Button } from "@dub/ui";
import { TriangleWarning, Xmark } from "@dub/ui/icons";
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
  if (Number.isNaN(remaining) || remaining <= 0 || remaining > DAY_MS)
    return null;

  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <TriangleWarning className="size-4 shrink-0 text-amber-600" />
        <p className="text-sm font-medium text-amber-900">
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
          icon={<Xmark className="size-4" />}
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
