"use client";

import { AlertCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export type RateLimitAlertProps = {
  /** When the user is allowed to retry. */
  retryAt: Date;
  /** Called when the user clicks "Try again". */
  onRetry: () => void;
  className?: string;
};

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

export function RateLimitAlert({
  retryAt,
  onRetry,
  className,
}: RateLimitAlertProps) {
  const retryTime = timeFormatter.format(retryAt);

  return (
    <div
      role="alert"
      className={[
        "flex w-full items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive",
        className ?? "",
      ]
        .join(" ")
        .trim()}
    >
      <AlertCircleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex flex-col gap-0.5">
          <p className="font-medium text-sm">You've been rate limited.</p>
          <p className="text-sm text-foreground">
            Too many requests were sent. You can try again after{" "}
            <time dateTime={retryAt.toISOString()}>{retryTime}</time>.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="self-start border-destructive/40 text-destructive hover:text-destructive sm:self-auto"
        >
          Try again
        </Button>
      </div>
    </div>
  );
}
