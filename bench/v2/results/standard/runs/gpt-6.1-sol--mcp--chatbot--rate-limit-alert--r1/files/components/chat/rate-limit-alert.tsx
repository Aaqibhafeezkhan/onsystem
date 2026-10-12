"use client";

import { Button } from "@/components/ui/button";

export type RateLimitAlertProps = {
  /** Human-readable wait time, such as "1 hour" or "30 seconds". */
  retryAfter?: string;
  onRetry: () => void;
  isRetrying?: boolean;
};

export function RateLimitAlert({
  retryAfter = "1 hour",
  onRetry,
  isRetrying = false,
}: RateLimitAlertProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive"
      role="alert"
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium">You've been rate limited.</p>
        <p className="text-sm">
          You've reached the message limit. You can retry in {retryAfter}.
        </p>
      </div>
      <Button
        disabled={isRetrying}
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
