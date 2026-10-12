"use client";

import { Button, TriangleWarning } from "@dub/ui";
import { useState } from "react";
import { X } from "../shared/icons";

const HOURS_24 = 24 * 60 * 60 * 1000;

type LinkExpiryBannerProps = {
  expiresAt: Date | string | null | undefined;
  onExtend: () => void;
};

export function LinkExpiryBanner({
  expiresAt,
  onExtend,
}: LinkExpiryBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (!expiresAt || isDismissed) return null;

  const expiryTime = new Date(expiresAt).getTime();
  const timeUntilExpiry = expiryTime - Date.now();

  if (!Number.isFinite(expiryTime) || timeUntilExpiry <= 0 || timeUntilExpiry > HOURS_24) {
    return null;
  }

  return (
    <div
      role="alert"
      className="relative flex flex-col justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 py-3 pl-4 pr-12 sm:flex-row sm:items-center sm:py-2"
    >
      <div className="flex items-start gap-3">
        <TriangleWarning className="mt-0.5 size-4 shrink-0 text-amber-600" />
        <p className="text-sm text-amber-900">
          This short link expires within 24 hours. Extend its expiration to keep it active.
        </p>
      </div>
      <Button
        text="Extend expiration"
        variant="secondary"
        onClick={onExtend}
        className="h-8 w-fit shrink-0 px-3"
      />
      <button
        type="button"
        aria-label="Dismiss link expiration warning"
        onClick={() => setIsDismissed(true)}
        className="absolute right-2.5 top-2.5 rounded-md p-1 text-amber-700 transition-colors hover:bg-amber-100 hover:text-amber-900 sm:top-1/2 sm:-translate-y-1/2"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
