"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WarningIcon } from "./icons";

export interface RateLimitAlertProps {
  retryAfter?: string;
  onRetry?: () => void;
  className?: string;
}

export function RateLimitAlert({
  retryAfter = "1 hour",
  onRetry,
  className,
}: RateLimitAlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-200",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0 text-red-600 dark:text-red-400">
          <WarningIcon />
        </div>
        <div className="space-y-1 text-sm">
          <p className="font-medium">You've reached the message limit.</p>
          <p className="text-red-700 dark:text-red-300 text-xs sm:text-sm">
            Come back in {retryAfter} to continue chatting.
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="border-red-200 bg-background hover:bg-red-100 hover:text-red-900 dark:border-red-900 dark:bg-background dark:hover:bg-red-900/40 dark:hover:text-red-200 shrink-0"
      >
        Try again
      </Button>
    </div>
  );
}
