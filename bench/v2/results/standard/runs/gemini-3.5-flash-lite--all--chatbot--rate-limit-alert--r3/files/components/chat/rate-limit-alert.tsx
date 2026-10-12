"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WarningIcon } from "./icons";

export interface RateLimitAlertProps extends ComponentProps<"div"> {
  /** When the user can retry (formatted string, Date, or number). */
  retryAfter?: string | Date | number;
  /** Callback when the 'Try again' button is clicked. */
  onRetry?: () => void;
  /** Custom alert message. */
  message?: string;
}

export function RateLimitAlert({
  retryAfter,
  onRetry,
  message = "You've been rate limited due to too many requests.",
  className,
  ...props
}: RateLimitAlertProps) {
  const formattedRetryAfter =
    retryAfter instanceof Date
      ? retryAfter.toLocaleTimeString()
      : typeof retryAfter === "number"
      ? `${retryAfter}s`
      : retryAfter;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-destructive text-sm",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2.5">
        <WarningIcon />
        <div>
          <span className="font-medium">{message}</span>
          {formattedRetryAfter && (
            <span className="block text-xs text-destructive/80 mt-0.5">
              You can retry {typeof retryAfter === "string" ? retryAfter : `in ${formattedRetryAfter}`}.
            </span>
          )}
        </div>
      </div>
      <Button
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
