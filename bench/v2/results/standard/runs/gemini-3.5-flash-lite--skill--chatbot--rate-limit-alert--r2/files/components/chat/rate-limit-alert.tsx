"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { WarningIcon } from "./icons";

export interface RateLimitAlertProps extends React.ComponentProps<"div"> {
  retryAfter?: string;
  message?: React.ReactNode;
  onRetry?: () => void;
  onTryAgain?: () => void;
}

export function RateLimitAlert({
  retryAfter = "1 hour",
  message,
  onRetry,
  onTryAgain,
  children,
  className,
  ...props
}: RateLimitAlertProps) {
  const handleTryAgain = onRetry || onTryAgain;

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
        <div className="shrink-0 text-destructive">
          <WarningIcon />
        </div>
        <div className="text-sm font-medium">
          {children ||
            message || (
              <>
                You&apos;ve reached the message limit. Come back in {retryAfter} to
                continue chatting.
              </>
            )}
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
