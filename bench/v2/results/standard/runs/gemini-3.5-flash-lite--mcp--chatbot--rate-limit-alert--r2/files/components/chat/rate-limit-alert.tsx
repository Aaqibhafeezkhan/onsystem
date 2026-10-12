"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { WarningIcon } from "@/components/chat/icons";
import { cn } from "@/lib/utils";

export type RateLimitAlertProps = {
  retryAfter?: string | number | Date;
  onRetry?: () => void;
  message?: string;
  className?: string;
} & React.ComponentProps<"div">;

export function RateLimitAlert({
  retryAfter = "1 hour",
  onRetry,
  message = "You've reached the message limit.",
  className,
  ...props
}: RateLimitAlertProps) {
  const formattedRetryTime = React.useMemo(() => {
    if (!retryAfter) {
      return "1 hour";
    }
    if (retryAfter instanceof Date) {
      const now = new Date();
      const diffMs = retryAfter.getTime() - now.getTime();
      const diffMins = Math.ceil(diffMs / (1000 * 60));
      if (diffMins <= 1) {
        return "1 minute";
      }
      if (diffMins < 60) {
        return `${diffMins} minutes`;
      }
      const diffHours = Math.ceil(diffMins / 60);
      return diffHours === 1 ? "1 hour" : `${diffHours} hours`;
    }
    if (typeof retryAfter === "number") {
      const diffMins = Math.ceil(retryAfter / 60);
      if (diffMins <= 1) {
        return "1 minute";
      }
      if (diffMins < 60) {
        return `${diffMins} minutes`;
      }
      const diffHours = Math.ceil(diffMins / 60);
      return diffHours === 1 ? "1 hour" : `${diffHours} hours`;
    }
    return retryAfter;
  }, [retryAfter]);

  return (
    <div
      role="alert"
      className={cn(
        "flex w-full flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-destructive text-sm",
        className
      )}
      {...props}
    >
      <div className="flex items-start sm:items-center gap-3">
        <div className="text-destructive shrink-0 mt-0.5 sm:mt-0">
          <WarningIcon size={16} />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{message}</span>
          <span className="text-destructive/80 text-xs">
            Come back in {formattedRetryTime} to continue chatting.
          </span>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/20 hover:text-destructive shrink-0"
      >
        Try again
      </Button>
    </div>
  );
}
