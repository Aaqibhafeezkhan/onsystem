"use client";

import { Button } from "@dub/ui";
import { cn, formatDateTime } from "@dub/utils";
import { TriangleAlert, X } from "lucide-react";
import { useState } from "react";

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export function LinkExpiryBanner({
  expiresAt,
  onExtendExpiration,
  className,
}: {
  expiresAt: Date | string | null | undefined;
  onExtendExpiration: () => void;
  className?: string;
}) {
  const expirationDate = expiresAt
    ? expiresAt instanceof Date
      ? expiresAt
      : new Date(expiresAt)
    : null;
  const expirationTime = expirationDate?.getTime();
  const [dismissedExpirationTime, setDismissedExpirationTime] =
    useState<number | null>(null);

  if (
    !expirationDate ||
    !Number.isFinite(expirationTime) ||
    expirationTime! <= Date.now() ||
    expirationTime! > Date.now() + TWENTY_FOUR_HOURS ||
    dismissedExpirationTime === expirationTime
  ) {
    return null;
  }

  return (
    <div
      role="status"
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950",
        className,
      )}
    >
      <TriangleAlert
        aria-hidden="true"
        className="size-4 shrink-0 text-amber-600"
      />
      <p className="min-w-0 flex-1 text-sm">
        This short link expires within 24 hours, on{" "}
        <span className="font-medium">{formatDateTime(expirationDate)}</span>.
      </p>
      <Button
        type="button"
        variant="secondary"
        text="Extend expiration"
        className="h-8 w-fit shrink-0 border-amber-300 bg-white px-3 text-amber-900 hover:bg-amber-100"
        onClick={onExtendExpiration}
      />
      <Button
        type="button"
        variant="outline"
        aria-label="Dismiss expiration warning"
        icon={<X aria-hidden="true" className="size-4" />}
        className="-mr-2 size-8 shrink-0 border-amber-200 bg-transparent p-0 text-amber-700 hover:bg-amber-100 hover:text-amber-950"
        onClick={() => setDismissedExpirationTime(expirationTime!)}
      />
    </div>
  );
}
