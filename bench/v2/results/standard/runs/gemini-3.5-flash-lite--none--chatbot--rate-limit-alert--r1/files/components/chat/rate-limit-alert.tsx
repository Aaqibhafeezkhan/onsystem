"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WarningIcon } from "./icons";

export interface RateLimitAlertProps {
  retryAfter?: string | number | Date;
  onTryAgain?: () => void;
  className?: string;
  message?: string;
}

export function RateLimitAlert({
  retryAfter = "1 hour",
  onTryAgain,
  className,
  message = "You've reached the message limit.",
}: RateLimitAlertProps) {
  const retryDescription =
    typeof retryAfter === "number"
      ? `Come back in ${retryAfter} seconds to continue chatting.`
      : retryAfter instanceof Date
      ? `Come back at ${retryAfter.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })} to continue chatting.`
      : `Come back in ${retryAfter} to continue chatting.`;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive dark:bg-destructive/20 dark:border-destructive/30",
        className
      )}
      data-testid="rate-limit-alert"
    >
      <div className="flex items-center gap-3">
        <div className="text-destructive shrink-0">
          <WarningIcon />
        </div>
        <div className="text-sm font-medium">
          <span>{message} </span>
          <span className="opacity-90">{retryDescription}</span>
        </div>
      </div>
      <Button
        variant="destructive"
        size="sm"
        onClick={onTryAgain}
        className="shrink-0"
      >
        Try again
      </Button>
    </div>
  );
}

export default RateLimitAlert;
