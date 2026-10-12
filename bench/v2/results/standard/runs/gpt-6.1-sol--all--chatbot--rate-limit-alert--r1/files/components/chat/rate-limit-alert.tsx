"use client";

import { Button } from "@/components/ui/button";

export type RateLimitAlertProps = {
  /** The time when the rate limit resets. */
  retryAt: Date;
  onRetry: () => void;
  /** Disable retry while a request is in progress. */
  disabled?: boolean;
};

export function RateLimitAlert({
  retryAt,
  onRetry,
  disabled = false,
}: RateLimitAlertProps) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive"
      role="alert"
    >
      <div className="min-w-0 space-y-1 text-sm">
        <p className="font-medium">You’ve been rate limited.</p>
        <p>
          You’ve reached the message limit. You can retry at{" "}
          <time dateTime={retryAt.toISOString()}>{retryAt.toUTCString()}</time>.
        </p>
      </div>
      <Button
        disabled={disabled}
        onClick={onRetry}
        size="sm"
        type="button"
        variant="destructive"
      >
        Try again
      </Button>
    </div>
  );
}
