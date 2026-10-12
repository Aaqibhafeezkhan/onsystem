"use client";

import { Button } from "@/components/ui/button";
import { WarningIcon } from "@/components/chat/icons";

type RateLimitAlertProps = {
  /** The earliest time the user can retry. */
  retryAt: Date | string | number;
  onRetry: () => void;
  isRetrying?: boolean;
};

export function RateLimitAlert({
  retryAt,
  onRetry,
  isRetrying = false,
}: RateLimitAlertProps) {
  const retryDate = retryAt instanceof Date ? retryAt : new Date(retryAt);
  const retryTime = Number.isNaN(retryDate.getTime())
    ? "in a little while"
    : retryDate.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });

  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-destructive"
      role="alert"
    >
      <span aria-hidden="true" className="mt-0.5 shrink-0">
        <WarningIcon />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <p className="text-sm">
          You&apos;ve been rate limited. You can try again at{" "}
          <time dateTime={Number.isNaN(retryDate.getTime()) ? undefined : retryDate.toISOString()}>
            {retryTime}
          </time>
          .
        </p>
        <Button
          className="self-start sm:self-auto"
          disabled={isRetrying}
          onClick={onRetry}
          size="sm"
          type="button"
          variant="destructive"
        >
          {isRetrying ? "Retrying…" : "Try again"}
        </Button>
      </div>
    </div>
  );
}
