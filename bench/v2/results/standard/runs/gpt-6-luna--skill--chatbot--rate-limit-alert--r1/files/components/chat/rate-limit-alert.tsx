"use client";

import { Button } from "@/components/ui/button";
import { WarningIcon } from "./icons";

type RateLimitAlertProps = {
  retryAt: Date;
  onRetry: () => void;
};

export function RateLimitAlert({ retryAt, onRetry }: RateLimitAlertProps) {
  const retryDateTime = retryAt.toISOString();
  const retryLabel = retryAt.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-destructive"
      role="alert"
    >
      <div className="flex min-w-0 items-start gap-2">
        <span aria-hidden="true" className="mt-0.5 shrink-0">
          <WarningIcon />
        </span>
        <p className="text-sm">
          You&apos;ve been rate limited. You can try again at{" "}
          <time dateTime={retryDateTime}>{retryLabel}</time>.
        </p>
      </div>
      <Button onClick={onRetry} size="sm" variant="destructive">
        Try again
      </Button>
    </div>
  );
}
