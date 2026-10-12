"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WarningIcon } from "./icons";

type RateLimitAlertProps = {
  /** The date and time at which the user may retry. */
  retryAt?: Date | string;
  onRetry: () => void;
  className?: string;
  isRetrying?: boolean;
};

export function RateLimitAlert({
  retryAt,
  onRetry,
  className,
  isRetrying = false,
}: RateLimitAlertProps) {
  const retryDate = retryAt ? new Date(retryAt) : null;
  const retryMessage = retryDate && !Number.isNaN(retryDate.getTime())
    ? `You can try again ${new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(retryDate)}.`
    : "Please try again later.";

  return (
    <div
      aria-live="assertive"
      className={cn(
        "flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm",
        className
      )}
      role="alert"
    >
      <span className="mt-0.5 shrink-0 text-destructive" aria-hidden="true">
        <WarningIcon />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-destructive">You’ve been rate limited.</p>
        <p className="mt-1 text-muted-foreground">{retryMessage}</p>
      </div>
      <Button
        className="shrink-0"
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
