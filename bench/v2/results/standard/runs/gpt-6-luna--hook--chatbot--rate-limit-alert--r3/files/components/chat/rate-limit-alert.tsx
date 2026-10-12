"use client";

import { Button } from "@/components/ui/button";

type RateLimitAlertProps = {
  retryAt: Date | string;
  onRetry: () => void;
};

export function RateLimitAlert({ retryAt, onRetry }: RateLimitAlertProps) {
  const retryDate = retryAt instanceof Date ? retryAt : new Date(retryAt);
  const retryTime = Number.isNaN(retryDate.getTime())
    ? "later"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(retryDate);

  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
      role="alert"
    >
      <svg
        aria-hidden="true"
        className="size-4 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
      <p className="min-w-0 flex-1">
        You’ve been rate limited. You can try again {retryTime === "later" ? retryTime : `at ${retryTime}`}.
      </p>
      <Button
        className="ml-auto"
        onClick={onRetry}
        size="sm"
        variant="destructive"
      >
        Try again
      </Button>
    </div>
  );
}
