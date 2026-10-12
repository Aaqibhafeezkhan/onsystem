"use client";

import { AlertCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RateLimitAlertProps = {
  /** When the user can retry. If omitted, a generic message is shown. */
  retryAt?: Date | string | number;
  /** Called when the user clicks "Try again". */
  onRetry?: () => void;
  className?: string;
};

function formatRetryTime(retryAt: Date | string | number) {
  const date = retryAt instanceof Date ? retryAt : new Date(retryAt);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function RateLimitAlert({
  retryAt,
  onRetry,
  className,
}: RateLimitAlertProps) {
  const retryTime = retryAt === undefined ? null : formatRetryTime(retryAt);

  return (
    <div
      role="alert"
      data-slot="rate-limit-alert"
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive",
        className
      )}
    >
      <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="space-y-0.5">
          <p className="font-medium">You've been rate limited.</p>
          <p className="text-destructive/80">
            {retryTime
              ? `You can try again after ${retryTime}.`
              : "Please wait a moment before trying again."}
          </p>
        </div>
        {onRetry && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onRetry}
            className="self-start sm:self-auto"
          >
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}
