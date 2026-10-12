"use client";

import { Button } from "@/components/ui/button";

type RateLimitAlertProps = {
  retryAt: Date | string;
  onRetry: () => void;
};

export function RateLimitAlert({ retryAt, onRetry }: RateLimitAlertProps) {
  const retryDate = retryAt instanceof Date ? retryAt : new Date(retryAt);
  const retryTime = retryDate.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm">
        You&apos;ve been rate limited. You can try again at {retryTime}.
      </p>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={onRetry}
        className="shrink-0"
      >
        Try again
      </Button>
    </div>
  );
}
