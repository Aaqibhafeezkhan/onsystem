"use client";

import { AlertCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RateLimitAlertProps = {
  /** When the user can retry. Date, timestamp (ms), or omitted if unknown. */
  retryAt?: Date | number;
  onRetry: () => void;
  className?: string;
};

function formatRetryTime(retryAt?: Date | number) {
  if (retryAt === undefined) {
    return "Please wait a little while before trying again.";
  }
  const date = retryAt instanceof Date ? retryAt : new Date(retryAt);
  if (Number.isNaN(date.getTime())) {
    return "Please wait a little while before trying again.";
  }
  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  return `You can try again at ${time}.`;
}

export function RateLimitAlert({
  retryAt,
  onRetry,
  className,
}: RateLimitAlertProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-destructive",
        className
      )}
      role="alert"
    >
      <AlertCircleIcon className="size-4 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-sm">
        <p className="font-medium">You've been rate limited</p>
        <p className="text-destructive/80">{formatRetryTime(retryAt)}</p>
      </div>
      <Button onClick={onRetry} size="sm" type="button" variant="destructive">
        Try again
      </Button>
    </div>
  );
}
