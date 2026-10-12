"use client";

import { AlertCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type RateLimitAlertProps = {
  /** When the user can send again. Omit when the time is unknown. */
  retryAt?: Date;
  /** Called when the user clicks "Try again". */
  onRetry: () => void;
  className?: string;
};

export function RateLimitAlert({ retryAt, onRetry, className }: RateLimitAlertProps) {
  const retryTime = retryAt
    ? retryAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-destructive",
        className,
      )}
    >
      <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="flex flex-1 flex-col gap-1">
        <p className="font-medium text-sm">Rate limit reached</p>
        <p className="text-sm text-destructive/90">
          You've sent too many requests. {retryTime ? `You can try again at ${retryTime}.` : "Please wait a moment before trying again."}
        </p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onRetry} className="shrink-0">
        Try again
      </Button>
    </div>
  );
}
