"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { WarningIcon } from "@/components/chat/icons";
import { cn } from "@/lib/utils";

export type RateLimitAlertProps = {
  /** When the rate limit resets (Date, timestamp in ms, or seconds). */
  retryAt?: Date | number | string;
  /** Seconds until retry is allowed. */
  retryAfter?: number;
  /** Custom error message. */
  message?: string;
  /** Callback when 'Try again' is clicked. */
  onRetry?: () => void;
  /** Additional CSS class names. */
  className?: string;
};

export function RateLimitAlert({
  retryAt,
  retryAfter,
  message = "You've reached the message limit.",
  onRetry,
  className,
}: RateLimitAlertProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    let targetTime: number | undefined;

    if (retryAt instanceof Date) {
      targetTime = retryAt.getTime();
    } else if (typeof retryAt === "number") {
      targetTime = retryAt < 10000000000 ? Date.now() + retryAt * 1000 : retryAt;
    } else if (typeof retryAt === "string") {
      const parsed = Date.parse(retryAt);
      if (!Number.isNaN(parsed)) {
        targetTime = parsed;
      }
    } else if (typeof retryAfter === "number") {
      targetTime = Date.now() + retryAfter * 1000;
    }

    if (!targetTime) {
      // Default to 1 hour if no time provided, matching message limit spec
      targetTime = Date.now() + 60 * 60 * 1000;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, (targetTime as number) - now);

      if (diff === 0) {
        setTimeLeft("now");
        return;
      }

      const seconds = Math.floor((diff / 1000) % 60);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const hours = Math.floor(diff / (1000 * 60 * 60));

      if (hours > 0) {
        setTimeLeft(
          `${hours} hour${hours > 1 ? "s" : ""} ${minutes} minute${
            minutes > 1 ? "s" : ""
          }`
        );
      } else if (minutes > 0) {
        setTimeLeft(
          `${minutes} minute${minutes > 1 ? "s" : ""} ${seconds} second${
            seconds > 1 ? "s" : ""
          }`
        );
      } else {
        setTimeLeft(`${seconds} second${seconds > 1 ? "s" : ""}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [retryAt, retryAfter]);

  return (
    <div
      role="alert"
      className={cn(
        "flex w-full flex-row items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="shrink-0 text-destructive">
          <WarningIcon />
        </div>
        <div className="text-sm font-medium">
          <div>{message}</div>
          {timeLeft && (
            <div className="text-xs opacity-90 mt-0.5">
              Come back in {timeLeft} to continue chatting.
            </div>
          )}
        </div>
      </div>
      <Button
        variant="destructive"
        size="sm"
        onClick={onRetry}
        className="shrink-0"
      >
        Try again
      </Button>
    </div>
  );
}
