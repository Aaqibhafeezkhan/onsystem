"use client";

import { Button } from "@/components/ui/button";
import { WarningIcon } from "@/components/chat/icons";

type RateLimitAlertProps = {
  /** Human-readable retry time, such as "in 30 seconds" or "at 2:30 PM". */
  retryAt: string;
  onRetry: () => void;
  isRetrying?: boolean;
};

export function RateLimitAlert({
  retryAt,
  onRetry,
  isRetrying = false,
}: RateLimitAlertProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-destructive"
      role="alert"
    >
      <WarningIcon />
      <p className="min-w-0 flex-1 text-sm">
        <span className="font-medium">You’ve been rate limited.</span>{" "}
        <span>You can try again {retryAt}.</span>
      </p>
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
