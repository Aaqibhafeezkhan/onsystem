"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WarningIcon } from "./icons";

export type RateLimitAlertProps = {
  /**
   * Time when the user can retry (Date, timestamp, or string).
   */
  retryAfter?: Date | string | number;
  /**
   * Callback function when the 'Try again' button is clicked.
   */
  onRetry?: () => void;
  /**
   * Custom message override.
   */
  message?: string;
  /**
   * Additional className for styling.
   */
  className?: string;
};

export function RateLimitAlert({
  retryAfter,
  onRetry,
  message,
  className,
}: RateLimitAlertProps) {
  const formattedRetryTime = React.useMemo(() => {
    if (!retryAfter) return null;
    const date = retryAfter instanceof Date ? retryAfter : new Date(retryAfter);
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }
    return String(retryAfter);
  }, [retryAfter]);

  const defaultMessage = "You've reached the message limit due to rate limiting.";
  const displayMessage = message || defaultMessage;

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive shadow-sm",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0 text-destructive">
          <WarningIcon />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">Rate Limit Exceeded</span>
          <p className="text-destructive/90">
            {displayMessage}
            {formattedRetryTime && (
              <span> You can retry at {formattedRetryTime}.</span>
            )}
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={onRetry}
        className="shrink-0"
      >
        Try again
      </Button>
    </div>
  );
}
