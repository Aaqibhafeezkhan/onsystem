"use client";

import type * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { WarningIcon } from "@/components/chat/icons";

export type RateLimitAlertProps = {
  message?: string;
  retryAfter?: string;
  onRetry?: () => void;
} & React.HTMLAttributes<HTMLDivElement>;

export function RateLimitAlert({
  message = "You've reached the message limit.",
  retryAfter = "1 hour",
  onRetry,
  className,
  ...props
}: RateLimitAlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-destructive text-sm",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        <div className="shrink-0 text-destructive">
          <WarningIcon />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{message}</span>
          {retryAfter ? (
            <span className="text-xs opacity-90">
              Come back in {retryAfter} to continue chatting.
            </span>
          ) : null}
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
