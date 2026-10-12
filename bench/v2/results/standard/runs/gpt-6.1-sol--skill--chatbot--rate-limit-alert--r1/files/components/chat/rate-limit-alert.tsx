"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RateLimitAlertProps = {
  /** Retry time as a Date or Unix timestamp in milliseconds. */
  retryAt: Date | number;
  onRetry: () => void;
  disabled?: boolean;
  className?: string;
};

export function RateLimitAlert({
  retryAt,
  onRetry,
  disabled = false,
  className,
}: RateLimitAlertProps) {
  const retryDate = new Date(retryAt);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive",
        className
      )}
      role="alert"
    >
      <div className="min-w-0 flex-1 space-y-1 text-sm">
        <p className="font-medium">You've been rate limited.</p>
        <p>
          You can try again after{" "}
          <time dateTime={retryDate.toISOString()}>
            {retryDate.toUTCString()}
          </time>
          .
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
