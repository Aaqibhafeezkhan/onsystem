"use client";

import { AlertCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RateLimitAlertProps = {
  /** When the user can retry. If omitted, the alert only says the limit was hit. */
  retryAt?: Date | null;
  /** Called when the user clicks "Try again". */
  onRetry?: () => void;
  className?: string;
};

function formatRetryTime(retryAt: Date) {
  return retryAt.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function RateLimitAlert({
  retryAt,
  onRetry,
  className,
}: RateLimitAlertProps) {
  const description = retryAt
    ? `You've sent too many requests. You can try again after ${formatRetryTime(retryAt)}.`
    : "You've sent too many requests. Please wait a moment before trying again.";

  return (
    <div
      role="alert"
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive",
        className
      )}
    >
      <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="font-medium">Rate limit reached</p>
        <p className="text-destructive/90">{description}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="shrink-0 border-destructive/30 bg-transparent text-destructive hover:bg-destructive/20 hover:text-destructive"
      >
        Try again
      </Button>
    </div>
  );
}
