"use client";

import type * as React from "react";
import { Button } from "@/components/ui/button";
import { WarningIcon } from "@/components/chat/icons";
import { cn } from "@/lib/utils";

export type RateLimitAlertProps = {
  retryAfter?: Date | string | number | null;
  onRetry?: () => void;
  className?: string;
} & React.ComponentProps<"div">;

export function RateLimitAlert({
  retryAfter,
  onRetry,
  className,
  ...props
}: RateLimitAlertProps) {
  const formattedRetryTime = (() => {
    if (!retryAfter) return "in 1 hour";
    if (retryAfter instanceof Date) {
      return retryAfter.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
    }
    if (typeof retryAfter === "number") {
      const date = new Date(
        retryAfter < 10000000000 ? retryAfter * 1000 : retryAfter
      );
      return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
    }
    return retryAfter;
  })();

  const isTimeFormat =
    typeof retryAfter === "object" ||
    typeof retryAfter === "number" ||
    (typeof retryAfter === "string" && !retryAfter.includes(" "));

  const retryText = isTimeFormat
    ? `You can retry at ${formattedRetryTime}.`
    : `You can retry ${formattedRetryTime}.`;

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive dark:border-destructive/30 dark:bg-destructive/20",
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0 text-destructive">
          <WarningIcon size={18} />
        </div>
        <div className="space-y-1">
          <div className="font-medium text-sm text-destructive">
            You've reached the rate limit.
          </div>
          <div className="text-xs text-destructive/80">
            {retryText}
          </div>
        </div>
      </div>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={onRetry}
      >
        Try again
      </Button>
    </div>
  );
}
