"use client";

import { Button } from "@/components/ui/button";

type RateLimitAlertProps = {
  /** The date and time at which the user may retry. */
  retryAt: Date | string | number;
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
      className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-destructive sm:flex-row sm:items-center sm:justify-between"
      role="alert"
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <svg
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0"
          fill="none"
          viewBox="0 0 16 16"
        >
          <path
            d="M8 5.25v3.5M8 11.25h.007M6.77 2.58 1.42 11.85a1.33 1.33 0 0 0 1.15 2h10.86a1.33 1.33 0 0 0 1.15-2L9.23 2.58a1.42 1.42 0 0 0-2.46 0Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
        <p className="text-sm leading-5">
          You&apos;ve been rate limited. You can try again at{" "}
          <time dateTime={Number.isNaN(retryDate.getTime()) ? undefined : retryDate.toISOString()}>
            {retryTime}
          </time>
          .
        </p>
      </div>
      <Button
        className="self-start sm:self-auto"
        onClick={onRetry}
        size="sm"
        variant="destructive"
      >
        Try again
      </Button>
    </div>
  );
}
