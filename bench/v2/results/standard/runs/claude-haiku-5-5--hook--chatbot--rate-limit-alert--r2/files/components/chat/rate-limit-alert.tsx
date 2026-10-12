"use client";

import { XCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RateLimitAlertProps = {
  /** When the user is allowed to retry. If omitted, a generic wait message is shown. */
  retryAt?: Date | null;
  /** Called when the user clicks "Try again". */
  onRetry?: () => void;
  className?: string;
};

function formatRetryTime(retryAt: Date) {
  return retryAt.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function RateLimitAlert({
  retryAt,
  onRetry,
  className,
}: RateLimitAlertProps) {
  const retryMessage = retryAt
    ? `You can try again at ${formatRetryTime(retryAt)}.`
    : "Please wait a moment before trying again.";

  return (
    <div
      role="alert"
      data-slot="rate-limit-alert"
      className={cn(
        "flex w-full flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex gap-2">
        <XCircleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <div className="flex flex-col gap-0.5">
          <p className="font-medium">You've been rate limited.</p>
          <p className="text-destructive/80">{retryMessage}</p>
        </div>
      </div>
      <Button
        className="shrink-0 self-start sm:self-auto"
        onClick={onRetry}
        size="sm"
        type="button"
        variant="outline"
      >
        Try again
      </Button>
    </div>
  );
}
