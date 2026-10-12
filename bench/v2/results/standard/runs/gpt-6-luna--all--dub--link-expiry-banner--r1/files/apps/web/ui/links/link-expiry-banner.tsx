"use client";

import { Alert, AlertDescription, AlertTitle, Button, CircleWarning, Xmark } from "@dub/ui";
import { useState } from "react";

const HOURS_24_IN_MS = 24 * 60 * 60 * 1000;

type LinkExpiryBannerProps = {
  expiresAt: Date | string;
  onExtendExpiration: () => void;
  onDismiss?: () => void;
};

export function LinkExpiryBanner({
  expiresAt,
  onExtendExpiration,
  onDismiss,
}: LinkExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const timeUntilExpiry = new Date(expiresAt).getTime() - Date.now();

  if (dismissed || timeUntilExpiry <= 0 || timeUntilExpiry > HOURS_24_IN_MS) {
    return null;
  }

  const dismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <Alert
      role="alert"
      className="flex items-start gap-3 border-border-subtle bg-bg-muted p-4 text-content-emphasis"
    >
      <CircleWarning
        aria-hidden="true"
        className="mt-0.5 size-5 shrink-0 text-content-warning"
      />
      <div className="min-w-0 flex-1">
        <AlertTitle className="font-semibold">Link expiring soon</AlertTitle>
        <AlertDescription className="mt-1 text-sm text-content-default">
          This short link expires within 24 hours. Extend its expiration to keep
          it active.
        </AlertDescription>
      </div>
      <Button
        type="button"
        variant="secondary"
        className="shrink-0"
        onClick={onExtendExpiration}
        text="Extend expiration"
      />
      <Button
        type="button"
        variant="outline"
        className="size-8 shrink-0 !p-0"
        onClick={dismiss}
        aria-label="Dismiss expiration warning"
      >
        <Xmark aria-hidden="true" className="size-4" />
      </Button>
    </Alert>
  );
}
