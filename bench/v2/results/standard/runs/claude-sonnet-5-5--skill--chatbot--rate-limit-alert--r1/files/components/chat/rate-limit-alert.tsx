"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RateLimitAlertProps = {
  /** Time at which the user can retry. */
  retryAt?: Date | string | number;
  onRetry?: () => void;
  className?: string;
};

export function RateLimitAlert({
  retryAt,
  onRetry,
  className,
}: RateLimitAlertProps) {
  const date = retryAt === undefined ? undefined : new Date(retryAt);
  const valid = date && !Number.isNaN(date.getTime());

  return (
    <div
      role="alert"
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive dark:bg-destructive/20",
        className
      )}
    >
      <div className="flex flex-col gap-0.5">
        <p className="font-medium">You've been rate limited.</p>
        <p className="text-xs">
          {valid
            ? `You can try again at ${date.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}.`
            : "Please wait a moment before trying again."}
        </p>
      </div>
      <Button onClick={onRetry} size="sm" type="button" variant="destructive">
        Try again
      </Button>
    </div>
  );
}
