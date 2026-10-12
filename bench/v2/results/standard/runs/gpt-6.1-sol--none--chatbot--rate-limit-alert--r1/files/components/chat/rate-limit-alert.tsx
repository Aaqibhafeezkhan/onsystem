"use client";

import { AlertCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type RateLimitAlertProps = {
  /** When requests can resume; numeric values are Unix timestamps in milliseconds. */
  retryAt: Date | string | number;
  onRetry: () => void;
  isRetrying?: boolean;
  className?: string;
};

export function RateLimitAlert({
  retryAt,
  onRetry,
  isRetrying = false,
  className,
}: RateLimitAlertProps) {
  const retryDate = retryAt instanceof Date ? retryAt : new Date(retryAt);
  const hasRetryTime = Number.isFinite(retryDate.getTime());
  const retryTime = hasRetryTime
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
      }).format(retryDate)
    : null;

  return (
    <div
      className={cn(
        "flex w-full flex-wrap items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive",
        className
      )}
      role="alert"
    >
      <AlertCircleIcon aria-hidden="true" className="size-5 shrink-0" />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium">You've been rate limited.</p>
        <p className="text-sm">
          {hasRetryTime ? (
            <>
              You can retry at{" "}
              <time dateTime={retryDate.toISOString()}>{retryTime} UTC</time>.
            </>
          ) : (
            "Please wait a little while before trying again."
          )}
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
