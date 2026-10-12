"use client";

import { Button, TriangleWarning, Xmark } from "@dub/ui";
import { useState } from "react";

export function LinkExpiryBanner({
  onExtend,
  onDismiss,
}: {
  onExtend?: () => void;
  onDismiss?: () => void;
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      role="alert"
      className="border-border-subtle bg-bg-muted flex items-center justify-between gap-3 rounded-lg border p-3"
    >
      <div className="flex items-center gap-2">
        <TriangleWarning className="text-content-emphasis size-4 shrink-0" />
        <p className="text-content-emphasis text-sm font-medium">
          This link expires within 24 hours.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          text="Extend expiration"
          className="h-8 w-fit"
          onClick={onExtend}
        />
        <Button
          type="button"
          variant="outline"
          aria-label="Dismiss"
          icon={<Xmark className="size-4" />}
          className="h-8 w-fit"
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
        />
      </div>
    </div>
  );
}
