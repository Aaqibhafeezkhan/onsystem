"use client";

import { AlertCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type RateLimitAlertProps = {
  retryAt: Date | string | number;
  onRetry: () => void;
};

export function RateLimitAlert({ retryAt, onRetry }: RateLimitAlertProps) {
  const retryDate = retryAt instanceof Date ? retryAt : new Date(retryAt);
  const retryTime = Number.isNaN(retryDate.getTime())
    ? "soon"
    : retryDate.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });

  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-destructive"
      role="alert"
    >
      <AlertCircleIcon aria-hidden="true" className="size-4 shrink-0" />
      <p className="min-w-0 flex-1 text-sm">
        You’ve been rate limited. You can try again at {retryTime}.
      </p>
      <Button
        className="shrink-0"
        onClick={onRetry}
        size="sm"
        variant="destructive"
      >
        Try again
      </Button>
    </div>
  );
}
