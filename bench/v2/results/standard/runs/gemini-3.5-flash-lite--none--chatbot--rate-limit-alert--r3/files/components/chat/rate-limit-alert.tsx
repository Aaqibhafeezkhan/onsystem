"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { WarningIcon } from "./icons";

export interface RateLimitAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  retryAfter?: string | number;
  retryAt?: Date | number | string;
  onRetry?: () => void;
  message?: string;
  tryAgainLabel?: string;
}

export function RateLimitAlert({
  retryAfter = "1 hour",
  retryAt,
  onRetry,
  message,
  tryAgainLabel = "Try again",
  className,
  ...props
}: RateLimitAlertProps) {
  const retryText = React.useMemo(() => {
    if (retryAt) {
      const date = new Date(retryAt);
      if (!Number.isNaN(date.getTime())) {
        return `at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      }
    }
    if (typeof retryAfter === "number") {
      return `in ${retryAfter} seconds`;
    }
    if (typeof retryAfter === "string") {
      return retryAfter.startsWith("in ") ? retryAfter : `in ${retryAfter}`;
    }
    return null;
  }, [retryAfter, retryAt]);

  const defaultMessage = message || "You've reached the message limit.";
  const retryDescription = retryText ? ` Come back ${retryText} to continue chatting.` : " Please try again later.";

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive dark:border-destructive/30 dark:bg-destructive/20",
        className
      )}
      {...props}
    >
      <div className="flex items-start sm:items-center gap-3">
        <div className="shrink-0 pt-0.5 sm:pt-0">
          <WarningIcon size={18} />
        </div>
        <div className="text-sm font-medium leading-relaxed">
          <span>{defaultMessage}</span>
          <span>{retryDescription}</span>
        </div>
      </div>
      <Button
        variant="destructive"
        size="sm"
        onClick={onRetry}
        className="shrink-0"
      >
        {tryAgainLabel}
      </Button>
    </div>
  );
}
