"use client";

import { Button } from "@dub/ui";
import { CircleWarning, Xmark } from "@dub/ui/icons";
import { useState } from "react";

type LinkExpiryBannerProps = {
  expiresAt: Date | string;
  onExtend: () => void;
  onDismiss?: () => void;
};

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export function LinkExpiryBanner({
  expiresAt,
  onExtend,
  onDismiss,
}: LinkExpiryBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const expiryTime = new Date(expiresAt).getTime();
  const timeUntilExpiry = expiryTime - Date.now();

  if (
    isDismissed ||
    !Number.isFinite(expiryTime) ||
    timeUntilExpiry <= 0 ||
    timeUntilExpiry > TWENTY_FOUR_HOURS
  ) {
    return null;
  }

  return (
    <div
      role="alert"
      className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950"
    >
      <CircleWarning className="size-5 shrink-0 text-amber-600" />
      <p className="min-w-0 flex-1 text-sm">
        This short link expires within 24 hours. Extend its expiration to keep it
        active.
      </p>
      <Button
        variant="secondary"
        text="Extend expiration"
        className="h-8 w-fit shrink-0 border-amber-300 bg-white px-3 text-sm text-amber-950 hover:bg-amber-100"
        onClick={onExtend}
      />
      <button
        type="button"
        aria-label="Dismiss expiration warning"
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-amber-700 transition-colors hover:bg-amber-100 hover:text-amber-950"
        onClick={() => {
          setIsDismissed(true);
          onDismiss?.();
        }}
      >
        <Xmark className="size-4" />
      </button>
    </div>
  );
}
