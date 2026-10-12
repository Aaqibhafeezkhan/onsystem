"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WarningIcon } from "./icons";

type RateLimitAlertProps = {
  /** When the user can retry. Omit if the time is unknown. */
  retryAt?: Date;
  onRetry?: () => void;
  className?: string;
};

function formatRetryTime(retryAt: Date) {
  return retryAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function RateLimitAlert({
  retryAt,
  onRetry,
  className,
}: RateLimitAlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex w-full flex-row items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm",
        className
      )}
    >
      <div className="pt-0.5 text-destructive">
        <WarningIcon />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <p className="font-medium text-destructive">Rate limit reached</p>
        <p className="text-foreground">
          You've sent too many messages in a short time.
          {retryAt
            ? ` You can try again after ${formatRetryTime(retryAt)}.`
            : " Please wait a moment before trying again."}
        </p>
        <div className="pt-1">
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
