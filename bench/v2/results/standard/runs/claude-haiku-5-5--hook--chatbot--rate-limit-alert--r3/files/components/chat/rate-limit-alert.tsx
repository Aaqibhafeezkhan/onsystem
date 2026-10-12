"use client";

import { XCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type RateLimitAlertProps = {
  /** The moment the user is allowed to retry. If omitted, a generic hint is shown. */
  retryAt?: Date | null;
  /** Called when the user clicks "Try again". */
  onRetry?: () => void;
  className?: string;
};

const formatRetryTime = (date: Date) =>
  date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

export const RateLimitAlert = ({
  retryAt,
  onRetry,
  className,
}: RateLimitAlertProps) => {
  const hasValidRetryAt =
    retryAt instanceof Date && !Number.isNaN(retryAt.getTime());

  return (
    <div
      role="alert"
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive",
        className
      )}
    >
      <XCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <p className="font-medium">You've been rate limited.</p>
          <p className="text-destructive/80 text-xs">
            {hasValidRetryAt
              ? `You can try again at ${formatRetryTime(retryAt)}.`
              : "Please wait a moment before trying again."}
          </p>
        </div>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onRetry}
          className="self-start sm:self-auto"
        >
          Try again
        </Button>
      </div>
    </div>
  );
};
