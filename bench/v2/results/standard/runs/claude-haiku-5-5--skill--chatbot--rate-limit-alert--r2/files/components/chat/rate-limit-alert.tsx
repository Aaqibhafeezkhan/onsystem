"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RateLimitAlertProps = {
  /** When the user is allowed to retry. */
  retryAt: Date;
  /** Called when the user clicks "Try again". */
  onRetry: () => void;
  className?: string;
};

export function RateLimitAlert({
  retryAt,
  onRetry,
  className,
}: RateLimitAlertProps) {
  const retryTime = retryAt.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div
      role="alert"
      data-testid="rate-limit-alert"
      className={cn(
        "flex w-full flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex flex-col gap-0.5">
        <p className="font-medium">You've been rate limited.</p>
        <p className="text-destructive/80">
          Too many requests were sent. You can try again at {retryTime}.
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="shrink-0 border-destructive/40 bg-transparent text-destructive hover:bg-destructive/20 hover:text-destructive"
      >
        Try again
      </Button>
    </div>
  );
}
