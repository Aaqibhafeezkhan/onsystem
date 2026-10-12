"use client";

import { Button } from "@/components/ui/button";

type RateLimitAlertProps = {
  retryAt: Date;
  onRetry: () => void;
};

export function RateLimitAlert({ retryAt, onRetry }: RateLimitAlertProps) {
  const retryTime = retryAt.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div
      aria-live="assertive"
      className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive"
      role="alert"
    >
      <svg
        aria-hidden="true"
        className="size-5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4m0 4h.01" />
      </svg>
      <p className="min-w-0 flex-1 text-sm">
        You&apos;ve been rate limited. You can try again at {retryTime}.
      </p>
      <Button onClick={onRetry} size="sm" variant="destructive">
        Try again
      </Button>
    </div>
  );
}
