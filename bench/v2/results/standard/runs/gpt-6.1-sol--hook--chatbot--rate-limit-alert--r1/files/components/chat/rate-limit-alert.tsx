"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WarningIcon } from "./icons";

export type RateLimitAlertProps = {
  /** The retry time as a Date, ISO date string, or Unix timestamp in milliseconds. */
  retryAt?: Date | string | number;
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
  const retryDate = retryAt === undefined ? null : new Date(retryAt);
  const hasRetryDate = retryDate !== null && !Number.isNaN(retryDate.getTime());

  return (
    <div
      className={cn(
        "flex w-full flex-wrap items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive",
        className
      )}
      role="alert"
    >
      <span aria-hidden="true" className="self-start pt-0.5">
        <WarningIcon size={18} />
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium">You've been rate limited.</p>
        <p className="mt-1">
          {hasRetryDate ? (
            <>
              You can retry at{" "}
              <time dateTime={retryDate.toISOString()}>
                {retryDate.toUTCString()}
              </time>
              .
            </>
          ) : (
            "You've reached the message limit. You can retry in 1 hour."
          )}
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
