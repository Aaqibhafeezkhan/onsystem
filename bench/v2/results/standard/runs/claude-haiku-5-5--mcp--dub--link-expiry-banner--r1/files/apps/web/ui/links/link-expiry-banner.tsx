"use client";

import { Alert, AlertDescription, AlertTitle, Button, TriangleWarning, Xmark } from "@dub/ui";
import { useState } from "react";

const EXPIRY_WARNING_WINDOW_MS = 24 * 60 * 60 * 1000;

interface LinkExpiryBannerProps {
  expiresAt: Date | string;
  onExtend: () => void;
  onDismiss?: () => void;
}

export function LinkExpiryBanner({ expiresAt, onExtend, onDismiss }: LinkExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const expiresAtTime = new Date(expiresAt).getTime();
  const remainingMs = expiresAtTime - Date.now();
  const isExpiringSoon = remainingMs > 0 && remainingMs <= EXPIRY_WARNING_WINDOW_MS;

  if (dismissed || !isExpiringSoon) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <Alert variant="default" className="flex items-start gap-3">
      <TriangleWarning className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <AlertTitle>This link expires soon</AlertTitle>
          <AlertDescription>
            This short link expires within 24 hours. Extend its expiration to keep it working.
          </AlertDescription>
        </div>
        <Button
          variant="secondary"
          text="Extend expiration"
          className="w-auto shrink-0"
          onClick={onExtend}
        />
      </div>
      <Button
        variant="outline"
        icon={<Xmark className="size-4" />}
        aria-label="Dismiss expiration warning"
        className="size-8 shrink-0 p-0"
        onClick={handleDismiss}
      />
    </Alert>
  );
}
