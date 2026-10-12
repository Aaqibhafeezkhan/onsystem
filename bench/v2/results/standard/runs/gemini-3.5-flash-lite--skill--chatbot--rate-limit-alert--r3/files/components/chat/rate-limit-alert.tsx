"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertCircleIcon } from "lucide-react";

export type RateLimitAlertProps = {
  /** When the rate limit resets / user can retry (Date, timestamp, or string). */
  retryAfter?: Date | number | string;
  /** Callback when the 'Try again' button is clicked. */
  onRetry?: () => void;
  /** Custom error message. */
  message?: string;
  /** Additional CSS class names. */
  className?: string;
  /** Button variant for the 'Try again' action. */
  buttonVariant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
};

export function RateLimitAlert({
  retryAfter,
  onRetry,
  message = "You've reached the rate limit. Please try again later.",
  className,
  buttonVariant = "destructive",
}: RateLimitAlertProps) {
  const formatRetryTime = (retry: Date | number | string) => {
    if (retry instanceof Date) {
      return retry.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }
    if (typeof retry === "number") {
      if (retry > 1e10) {
        return new Date(retry).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      }
      return `${retry} seconds`;
    }
    return retry;
  };

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive",
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertCircleIcon className="size-5 shrink-0 mt-0.5 text-destructive" />
        <div className="space-y-1">
          <p className="text-sm font-medium">{message}</p>
          {retryAfter && (
            <p className="text-xs text-destructive/80">
              You can retry after {formatRetryTime(retryAfter)}.
            </p>
          )}
        </div>
      </div>
      <Button
        variant={buttonVariant}
        size="sm"
        onClick={onRetry}
        className="shrink-0"
      >
        Try again
      </Button>
    </div>
  );
}
