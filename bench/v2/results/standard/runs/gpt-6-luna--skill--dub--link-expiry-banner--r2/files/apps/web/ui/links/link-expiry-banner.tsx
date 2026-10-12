"use client";

import { X } from "@/ui/shared/icons";
import { Button, TriangleWarning } from "@dub/ui";
import { useState } from "react";

type LinkExpiryBannerProps = {
  expiresAt: Date | string;
  onExtend: () => void;
};

const HOURS_IN_DAY = 24;

export function LinkExpiryBanner({
  expiresAt,
  onExtend,
}: LinkExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const expirationTime = new Date(expiresAt).getTime();
  const hoursRemaining = (expirationTime - Date.now()) / (60 * 60 * 1000);

  if (
    dismissed ||
    !Number.isFinite(expirationTime) ||
    hoursRemaining <= 0 ||
    hoursRemaining > HOURS_IN_DAY
  ) {
    return null;
  }

  const remainingTime =
    hoursRemaining < 1
      ? "less than an hour"
      : `${Math.ceil(hoursRemaining)} ${Math.ceil(hoursRemaining) === 1 ? "hour" : "hours"}`;

  return (
    <div
      role="status"
      className="relative flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900 sm:flex-row sm:items-center sm:justify-between sm:px-4"
    >
      <div className="flex min-w-0 items-start gap-2.5 pr-8 sm:items-center sm:pr-0">
        <TriangleWarning
          className="mt-0.5 size-4 shrink-0 text-amber-600 sm:mt-0"
          aria-hidden="true"
        />
        <p className="text-sm">
          This short link expires in <span className="font-semibold">{remainingTime}</span>.
        </p>
      </div>

      <div className="flex items-center gap-2 sm:shrink-0">
        <Button
          variant="secondary"
          text="Extend expiration"
          className="h-8 w-fit border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
          onClick={onExtend}
        />
      </div>

      <Button
        variant="outline"
        icon={<X className="size-4" />}
        className="absolute right-2 top-2 size-8 rounded-md p-0 text-amber-800 hover:bg-amber-100 sm:static sm:size-8"
        aria-label="Dismiss expiration warning"
        onClick={() => setDismissed(true)}
      />
    </div>
  );
}
