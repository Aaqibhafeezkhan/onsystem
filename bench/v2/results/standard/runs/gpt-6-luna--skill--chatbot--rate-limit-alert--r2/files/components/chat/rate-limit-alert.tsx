"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type RateLimitAlertProps = {
  retryAt: Date;
  onRetry: () => void;
  isRetrying?: boolean;
};

export function RateLimitAlert({
  retryAt,
  onRetry,
  isRetrying = false,
}: RateLimitAlertProps) {
  const retryTime = retryAt.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive"
      role="alert"
    >
      <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">You’ve been rate limited.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          You can try again at <time dateTime={retryAt.toISOString()}>{retryTime}</time>.
        </p>
      </div>
      <Button
        className="shrink-0"
        disabled={isRetrying}
        onClick={onRetry}
        size="sm"
        variant="destructive"
      >
        Try again
      </Button>
    </div>
  );
}
