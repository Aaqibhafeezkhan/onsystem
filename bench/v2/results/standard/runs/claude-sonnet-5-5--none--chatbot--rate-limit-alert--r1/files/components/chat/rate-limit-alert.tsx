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
    return "in a little while";
  }
  const date = new Date(retryAt);
  if (Number.isNaN(date.getTime())) {
    return "in a little while";
  }
  const seconds = Math.ceil((date.getTime() - Date.now()) / 1000);
  if (seconds <= 0) {
    return "now";
  }
  if (seconds < 60) {
    return `in ${seconds} second${seconds === 1 ? "" : "s"}`;
  }
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) {
    return `in ${minutes} minute${minutes === 1 ? "" : "s"}`;
  }
  return `at ${date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

export function RateLimitAlert({
  retryAt,
  onRetry,
  className,
}: RateLimitAlertProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive text-sm",
        className
      )}
      role="alert"
    >
      <AlertCircleIcon className="size-4 shrink-0" />
      <div className="flex-1">
        <p className="font-medium">You've been rate limited</p>
        <p className="text-xs opacity-80">
          You can try again {formatRetryTime(retryAt)}.
        </p>
      </div>
      <Button onClick={onRetry} size="sm" type="button" variant="destructive">
        Try again
      </Button>
    </div>
  );
}
