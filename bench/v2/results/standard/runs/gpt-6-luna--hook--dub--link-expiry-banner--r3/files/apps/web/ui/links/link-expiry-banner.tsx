"use client";

import { Button } from "@dub/ui";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

type LinkExpiryBannerProps = {
  expiresAt: Date | string;
  onExtend: () => void;
};

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export function LinkExpiryBanner({ expiresAt, onExtend }: LinkExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const expirationTime = new Date(expiresAt).getTime();
  const timeUntilExpiration = expirationTime - Date.now();

  if (
    dismissed ||
    !Number.isFinite(expirationTime) ||
    timeUntilExpiration <= 0 ||
    timeUntilExpiration > TWENTY_FOUR_HOURS
  ) {
    return null;
  }

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950"
    >
      <AlertTriangle
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-amber-600"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">This link expires within 24 hours</p>
        <p className="mt-1 text-sm text-amber-800">
          Extend its expiration to keep this link active.
        </p>
      </div>
      <Button
        type="button"
        variant="secondary"
        text="Extend expiration"
        className="h-8 w-fit shrink-0 border-amber-300 bg-white px-3 text-sm text-amber-950 hover:bg-amber-100"
        onClick={onExtend}
      />
      <Button
        type="button"
        variant="outline"
        aria-label="Dismiss expiration warning"
        icon={<X aria-hidden="true" className="size-4" />}
        className="-mr-1 -mt-1 size-8 shrink-0 border-amber-200 bg-transparent p-0 text-amber-700 hover:bg-amber-100 hover:text-amber-950"
        onClick={() => setDismissed(true)}
      />
    </div>
  );
}
