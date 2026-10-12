"use client";

import { XCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type RateLimitAlertProps = {
  /** When the user can retry. If omitted, the alert only says they were rate limited. */
  retryAt?: Date;
  /** Called when the user clicks "Try again". */
  onRetry?: () => void;
  className?: string;
};

export function RateLimitAlert({
  retryAt,
  onRetry,
  className,
}: RateLimitAlertProps) {
  const retryTime =
    retryAt && !Number.isNaN(retryAt.getTime())
      ? retryAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      : null;

  return (
    <div
      role="alert"
      className={cn(
        "not-prose flex w-full items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive",
        className
      )}
    >
      <XCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="font-medium">You've been rate limited.</p>
        <p className="text-destructive/80">
          {retryTime
            ? `You can try again after ${retryTime}.`
            : "Please wait a moment before trying again."}
        </p>
      </div>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={onRetry}
      >
        Try again
      </Button>
    </div>
  );
}
