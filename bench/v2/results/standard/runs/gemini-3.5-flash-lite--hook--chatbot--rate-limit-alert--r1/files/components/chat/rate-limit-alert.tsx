"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { WarningIcon } from "@/components/chat/icons";
import { cn } from "@/lib/utils";

export interface RateLimitAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  retryAfter?: string | Date | number;
  onRetry?: () => void;
  message?: string;
}

export function RateLimitAlert({
  retryAfter = "1 hour",
  onRetry,
  message = "You've reached the message limit.",
  className,
  ...props
}: RateLimitAlertProps) {
  const timeText = retryAfter
    ? typeof retryAfter === "number"
      ? `Come back in ${retryAfter} seconds to continue chatting.`
      : retryAfter instanceof Date
      ? `Come back at ${retryAfter.toLocaleTimeString()} to continue chatting.`
      : retryAfter.toLowerCase().startsWith("in ") ||
        retryAfter.toLowerCase().startsWith("come back")
      ? retryAfter
      : `Come back in ${retryAfter} to continue chatting.`
    : "";

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        <div className="text-destructive shrink-0">
          <WarningIcon />
        </div>
        <div className="text-sm">
          <span className="font-medium">{message}</span>{" "}
          {timeText && (
            <span className="text-destructive/80">
              {timeText}
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
