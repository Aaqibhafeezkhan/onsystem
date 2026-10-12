"use client";

import { Button, TriangleWarning } from "@dub/ui";
import { formatDateTime } from "@dub/utils";
import { useState } from "react";
import X from "../shared/icons/x";

type LinkExpiryBannerProps = {
  expiresAt: Date | string;
  onExtendExpiration: () => void;
};

const HOURS_24_IN_MS = 24 * 60 * 60 * 1000;

export function LinkExpiryBanner({
  expiresAt,
  onExtendExpiration,
}: LinkExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const expirationDate = new Date(expiresAt);
  const timeUntilExpiration = expirationDate.getTime() - Date.now();

  if (
    dismissed ||
    !Number.isFinite(expirationDate.getTime()) ||
    timeUntilExpiration <= 0 ||
    timeUntilExpiration > HOURS_24_IN_MS
  ) {
    return null;
  }

  return (
    <div className="relative flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 pr-10 text-amber-950 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2.5">
        <TriangleWarning className="mt-0.5 size-4 shrink-0 text-amber-600" />
        <p className="text-sm">
          This link expires within 24 hours, on{" "}
          <span className="font-medium">
            {formatDateTime(expirationDate, { year: undefined })}
          </span>
          .
        </p>
      </div>
      <Button
        type="button"
        variant="secondary"
        text="Extend expiration"
        className="h-8 w-fit shrink-0"
        onClick={onExtendExpiration}
      />
      <Button
        type="button"
        variant="outline"
        icon={<X className="size-4" />}
        aria-label="Dismiss expiration warning"
        className="absolute right-2 top-2 size-7 rounded-md border-amber-200 bg-transparent p-0 text-amber-700 hover:bg-amber-100 hover:text-amber-950"
        onClick={() => setDismissed(true)}
      />
    </div>
  );
}
