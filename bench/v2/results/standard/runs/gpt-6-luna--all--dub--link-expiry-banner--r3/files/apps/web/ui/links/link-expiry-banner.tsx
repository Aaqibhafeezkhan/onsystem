"use client";

import { Alert, AlertDescription, Button } from "@dub/ui";
import { CircleWarning, Xmark } from "@dub/ui/icons";
import { useState } from "react";

type LinkExpiryBannerProps = {
  expiresAt: Date | string;
  onExtendExpiration: () => void;
  onDismiss?: () => void;
};

const twentyFourHoursInMs = 24 * 60 * 60 * 1000;

export function LinkExpiryBanner({
  expiresAt,
  onExtendExpiration,
  onDismiss,
}: LinkExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const expiryTime =
    expiresAt instanceof Date ? expiresAt.getTime() : new Date(expiresAt).getTime();
  const timeUntilExpiry = expiryTime - Date.now();

  if (
    dismissed ||
    !Number.isFinite(expiryTime) ||
    timeUntilExpiry <= 0 ||
    timeUntilExpiry > twentyFourHoursInMs
  ) {
    return null;
  }

  const dismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <Alert
      className="flex items-center gap-3 border-border-subtle bg-bg-attention p-3 [&>svg+div]:translate-y-0 [&>svg]:static [&>svg]:size-5 [&>svg]:shrink-0 [&>svg]:text-content-attention [&>svg~*]:pl-0"
    >
      <CircleWarning aria-hidden="true" />
      <AlertDescription className="flex min-w-0 flex-1 flex-col gap-2 text-content-default sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          This short link expires within 24 hours. Extend its expiration to keep
          it active.
        </p>
        <Button
          type="button"
          variant="outline"
          text="Extend expiration"
          className="h-8 w-fit shrink-0 px-3 text-xs"
          onClick={onExtendExpiration}
        />
      </AlertDescription>
      <Button
        type="button"
        variant="outline"
        icon={<Xmark className="size-4" aria-hidden="true" />}
        className="size-8 shrink-0 p-0"
        aria-label="Dismiss expiration warning"
        onClick={dismiss}
      />
    </Alert>
  );
}
