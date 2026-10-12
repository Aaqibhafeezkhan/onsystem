"use client";

import { Button } from "@/components/ui/button";

type RateLimitAlertProps = {
  retryAt: Date | string;
  onRetry: () => void;
};

function formatRetryTime(retryAt: Date | string) {
  const date = retryAt instanceof Date ? retryAt : new Date(retryAt);

  if (Number.isNaN(date.getTime())) {
    return String(retryAt);
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function RateLimitAlert({ retryAt, onRetry }: RateLimitAlertProps) {
  return (
    <div
      className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive sm:flex-row sm:items-center sm:justify-between"
      role="alert"
    >
      <p className="text-sm">
        You’ve been rate limited. You can try again at {formatRetryTime(retryAt)}.
      </p>
      <Button onClick={onRetry} size="sm" type="button" variant="destructive">
        Try again
      </Button>
    </div>
  );
}
