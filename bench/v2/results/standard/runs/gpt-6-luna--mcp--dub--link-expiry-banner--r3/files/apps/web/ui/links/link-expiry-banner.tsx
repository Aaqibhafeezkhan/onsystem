"use client";

import { Alert, Button } from "@dub/ui";
import { TriangleWarning, Xmark } from "@dub/ui/icons";
import { useState } from "react";

const HOURS_IN_MS = 24 * 60 * 60 * 1000;

export function LinkExpiryBanner({
  expiresAt,
  onExtend,
  onDismiss,
}: {
  expiresAt: Date | string;
  onExtend: () => void;
  onDismiss?: () => void;
}) {
  const [dismissed, setDismissed] = useState(false);
  const expirationDate = new Date(expiresAt);
  const timeUntilExpiration = expirationDate.getTime() - Date.now();

  if (
    dismissed ||
    !Number.isFinite(timeUntilExpiration) ||
    timeUntilExpiration < 0 ||
    timeUntilExpiration > HOURS_IN_MS
  ) {
    return null;
  }

  const formattedExpiration = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(expirationDate);

  const dismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <Alert className="flex items-center gap-3 border-amber-200 bg-amber-50 px-4 py-3 text-amber-950 [&>svg+div]:translate-y-0 [&>svg~*]:pl-0 [&>svg]:static [&>svg]:size-5 [&>svg]:shrink-0 [&>svg]:text-amber-600">
      <TriangleWarning aria-hidden="true" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium">This short link is expiring soon</p>
        <p className="mt-0.5 text-amber-800">
          It expires {formattedExpiration}. Extend it to keep the link active.
        </p>
      </div>
      <Button
        className="h-8 shrink-0 px-3"
        variant="secondary"
        text="Extend expiration"
        onClick={onExtend}
      />
      <Button
        aria-label="Dismiss expiration warning"
        className="h-8 w-8 shrink-0 p-1"
        variant="outline"
        icon={<Xmark aria-hidden="true" className="size-4" />}
        onClick={dismiss}
      />
    </Alert>
  );
}
