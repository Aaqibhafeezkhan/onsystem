"use client";

import { Button } from "@/components/ui/button";
import { WarningIcon } from "@/components/chat/icons";

type RateLimitAlertProps = {
  /** The date and time when the user can retry. */
  retryAt: Date | string | number;
  onRetry: () => void;
};

export function RateLimitAlert({ retryAt, onRetry }: RateLimitAlertProps) {
  const retryDate = retryAt instanceof Date ? retryAt : new Date(retryAt);
  const retryTime = Number.isNaN(retryDate.getTime())
    ? "later"
    : retryDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-destructive"
      role="alert"
    >
      <WarningIcon />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium">You’ve been rate limited.</p>
        <p className="text-destructive/80">
          You can try again at {retryTime}.
        </p>
      </div>
      <Button
        className="shrink-0"
        onClick={onRetry}
        size="sm"
        variant="destructive"
      >
        Try again
      </Button>
    </div>
  );
}
