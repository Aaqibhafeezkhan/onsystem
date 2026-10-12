"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WarningIcon } from "./icons";

export type RateLimitAlertProps = {
  /**
   * Custom message telling the user they were rate limited.
   * Default: "You've reached the message limit. Come back in 1 hour to continue chatting."
   */
  message?: string;
  /**
   * When the user can retry (e.g. timestamp, Date object, or string).
   */
  retryAfter?: string | number | Date;
  /**
   * Callback when the 'Try again' button is clicked.
   */
  onRetry?: () => void;
  /**
   * Alias for onRetry.
   */
  onTryAgain?: () => void;
  /**
   * Additional CSS classes.
   */
  className?: string;
  /**
   * Custom children.
   */
  children?: ReactNode;
};

export function RateLimitAlert({
  message = "You've reached the message limit. Come back in 1 hour to continue chatting.",
  retryAfter,
  onRetry,
  onTryAgain,
  className,
  children,
}: RateLimitAlertProps) {
  const handleRetry = onRetry ?? onTryAgain;

  const retryText = retryAfter
    ? typeof retryAfter === "object" && retryAfter instanceof Date
      ? ` You can retry at ${retryAfter.toLocaleTimeString()}.`
      : typeof retryAfter === "number"
        ? ` You can retry in ${Math.ceil(retryAfter / 60)} minutes.`
        : ` ${retryAfter}`
    : "";

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0 text-destructive">
          <WarningIcon />
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-medium">Rate limit reached</span>
          <span>
            {message}
            {retryText}
          </span>
          {children}
        </div>
      </div>
      {handleRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleRetry}
          className="border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive shrink-0"
        >
          Try again
        </Button>
      )}
    </div>
  );
}
