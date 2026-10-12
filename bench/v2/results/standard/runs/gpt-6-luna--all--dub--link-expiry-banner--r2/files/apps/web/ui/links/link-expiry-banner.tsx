"use client";

import { Button, TriangleWarning } from "@dub/ui";
import { Xmark } from "@dub/ui/icons";
import { useState } from "react";

const HOURS_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

export type LinkExpiryBannerProps = {
  expiresAt: Date | string;
  onExtendExpiration: () => void;
};

export function LinkExpiryBanner({
  expiresAt,
  onExtendExpiration,
}: LinkExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const expirationTime = new Date(expiresAt).getTime();
  const timeUntilExpiration = expirationTime - Date.now();

  if (
    dismissed ||
    !Number.isFinite(expirationTime) ||
    timeUntilExpiration <= 0 ||
    timeUntilExpiration > HOURS_IN_MILLISECONDS
  ) {
    return null;
  }

  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-2.5">
        <TriangleWarning
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-amber-600"
        />
        <p className="text-sm">
          This short link expires within 24 hours. Extend its expiration to keep
          it active.
        </p>
      </div>
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <Button
          type="button"
          variant="secondary"
          text="Extend expiration"
          onClick={onExtendExpiration}
          className="h-8 w-fit px-3 text-sm"
        />
        <Button
          type="button"
          variant="outline"
          icon={<Xmark aria-hidden="true" className="size-4" />}
          aria-label="Dismiss expiration warning"
          onClick={() => setDismissed(true)}
          className="size-8 min-w-8 p-0"
        />
      </div>
    </div>
  );
}
