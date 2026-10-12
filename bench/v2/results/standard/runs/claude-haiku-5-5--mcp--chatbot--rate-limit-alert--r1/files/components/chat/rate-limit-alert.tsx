"use client";

import { Button } from "@/components/ui/button";

export type RateLimitAlertProps = {
  /** When the user is allowed to retry. */
  retryAt: Date;
  /** Called when the user clicks "Try again". */
  onRetry: () => void;
  /** Disables the retry button, e.g. while a retry is in flight. */
  disabled?: boolean;
};

export function RateLimitAlert({
  retryAt,
  onRetry,
  disabled = false,
}: RateLimitAlertProps) {
  const retryTime = retryAt.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div
      role="alert"
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      <div className="flex flex-col gap-0.5">
        <p className="font-medium">You've been rate limited.</p>
        <p className="text-xs text-destructive/80">
          You can try again after <time dateTime={retryAt.toISOString()}>{retryTime}</time>.
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRetry}
        disabled={disabled}
      >
        Try again
      </Button>
    </div>
  );
}
