"use client";

import { Button } from "@dub/ui";
import { TriangleAlert, X } from "lucide-react";
import { useEffect, useState } from "react";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

type LinkExpiryBannerProps = {
  expiresAt: Date | string | number | null | undefined;
  onExtendExpiration: () => void;
};

export function LinkExpiryBanner({
  expiresAt,
  onExtendExpiration,
}: LinkExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
  }, [expiresAt]);

  if (!expiresAt || dismissed) {
    return null;
  }

  const expirationTime = new Date(expiresAt).getTime();
  const timeUntilExpiration = expirationTime - Date.now();

  if (
    Number.isNaN(expirationTime) ||
    timeUntilExpiration < 0 ||
    timeUntilExpiration > DAY_IN_MS
  ) {
    return null;
  }

  return (
    <div
      role="alert"
      className="relative flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 pr-12 text-amber-950 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <TriangleAlert
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-amber-600"
        />
        <p className="text-sm">
          This short link expires within 24 hours. Extend its expiration to keep
          it active.
        </p>
      </div>
      <Button
        type="button"
        variant="secondary"
        text="Extend expiration"
        className="h-8 shrink-0 border-amber-300 bg-white px-3 text-sm text-amber-950 hover:bg-amber-100"
        onClick={onExtendExpiration}
      />
      <button
        type="button"
        aria-label="Dismiss expiration warning"
        title="Dismiss"
        className="absolute right-2 top-2 rounded-md p-1 text-amber-700 transition-colors hover:bg-amber-100 hover:text-amber-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        onClick={() => setDismissed(true)}
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}
