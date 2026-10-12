"use client";

import type * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WarningIcon } from "./icons";

export interface RateLimitAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  retryAt?: Date | string | number;
  message?: string;
  onRetry?: () => void;
  onTryAgain?: () => void;
}

export function RateLimitAlert({
  retryAt,
  message,
  onRetry,
  onTryAgain,
  className,
  ...props
}: RateLimitAlertProps) {
  const handleTryAgain = onRetry || onTryAgain;

  let retryText = "Come back later to continue chatting.";
  if (retryAt) {
    const date = new Date(retryAt);
    if (!isNaN(date.getTime())) {
      const timeString = date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
      retryText = `You can retry after ${timeString}.`;
    } else if (typeof retryAt === "string") {
      retryText = `You can retry in ${retryAt}.`;
    }
  }

  const alertMessage =
    message ||
    "You've reached the message limit. Please wait before sending more messages.";

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive text-sm",
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        <div className="text-destructive shrink-0 pt-0.5">
          <WarningIcon />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-destructive">{alertMessage}</span>
          <span className="text-xs text-destructive/80">
            {retryText}
          </span>
        </div>
      </div>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleTryAgain}
        className="shrink-0"
      >
        Try again
      </Button>
    </div>
  );
}
