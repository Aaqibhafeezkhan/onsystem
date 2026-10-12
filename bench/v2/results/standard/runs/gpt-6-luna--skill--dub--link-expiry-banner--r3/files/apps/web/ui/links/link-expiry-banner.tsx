"use client";

import { Button } from "@dub/ui";
import { Callout } from "@/ui/shared/callout";
import X from "@/ui/shared/icons/x";
import { useState } from "react";

const HOURS_IN_MILLISECONDS = 60 * 60 * 1000;
const EXPIRY_WARNING_WINDOW = 24 * HOURS_IN_MILLISECONDS;

type LinkExpiryBannerProps = {
  expiresAt: Date | string | null | undefined;
  onExtendExpiration: () => void;
};

export function LinkExpiryBanner({
  expiresAt,
  onExtendExpiration,
}: LinkExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!expiresAt || dismissed) return null;

  const expirationTime = new Date(expiresAt).getTime();
  const millisecondsUntilExpiration = expirationTime - Date.now();

  if (
    !Number.isFinite(expirationTime) ||
    millisecondsUntilExpiration <= 0 ||
    millisecondsUntilExpiration > EXPIRY_WARNING_WINDOW
  ) {
    return null;
  }

  const hoursUntilExpiration = Math.ceil(
    millisecondsUntilExpiration / HOURS_IN_MILLISECONDS,
  );
  const expirationLabel =
    hoursUntilExpiration === 1
      ? "in less than an hour"
      : `in ${hoursUntilExpiration} hours`;

  return (
    <Callout variant="warn" size={1}>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p>
          This short link expires {expirationLabel}. Extend its expiration to
          keep it active.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            text="Extend expiration"
            onClick={onExtendExpiration}
            className="h-8 w-fit border-amber-200 px-2.5 text-amber-900 hover:bg-amber-100"
          />
          <Button
            type="button"
            variant="outline"
            icon={<X className="size-4" aria-hidden="true" />}
            aria-label="Dismiss link expiration warning"
            onClick={() => setDismissed(true)}
            className="h-8 w-8 shrink-0 p-1 text-amber-800 hover:bg-amber-100"
          />
        </div>
      </div>
    </Callout>
  );
}
