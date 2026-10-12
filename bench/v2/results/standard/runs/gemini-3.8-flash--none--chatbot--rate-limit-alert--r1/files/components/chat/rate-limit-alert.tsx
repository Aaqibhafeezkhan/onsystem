"use client";

import { useEffect, useMemo, useState } from "react";
import { WarningIcon } from "@/components/chat/icons";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export interface RateLimitAlertProps extends React.ComponentProps<"div"> {
  /**
   * Time in seconds, milliseconds, or a human-readable duration string (e.g. "60s", "1 hour")
   * after which the user can retry.
   */
  retryAfter?: number | string;
  /**
   * The Date, timestamp, or string when the rate limit resets.
   */
  retryAt?: Date | string | number;
  /**
   * Alias for retryAt.
   */
  resetsAt?: Date | string | number;
  /**
   * Alias for retryAt.
   */
  resetTime?: Date | string | number;
  /**
   * Alias for retryAfter.
   */
  retryIn?: number | string;
  /**
   * Callback fired when clicking the 'Try again' button.
   */
  onRetry?: () => void | Promise<void>;
  /**
   * Whether a retry request is currently loading.
   */
  isLoading?: boolean;
  /**
   * Alias for isLoading.
   */
  isRetrying?: boolean;
  /**
   * Whether the 'Try again' button is disabled.
   */
  disabled?: boolean;
  /**
   * Custom title for the alert.
   */
  title?: string;
  /**
   * Custom message for the alert.
   */
  message?: string;
  /**
   * Optional Error instance or error message.
   */
  error?: Error | string | null;
  /**
   * Custom label for the retry button. Defaults to "Try again".
   */
  buttonLabel?: string;
}

function formatRemainingTime(seconds: number): string {
  if (seconds <= 0) {
    return "now";
  }
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSecs = seconds % 60;
  if (minutes < 60) {
    return remainingSecs > 0 ? `${minutes}m ${remainingSecs}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}

function parseSeconds(val: unknown): number | null {
  if (typeof val === "number") {
    if (val > 1_000_000_000_000) {
      return Math.max(0, Math.ceil((val - Date.now()) / 1000));
    }
    if (val > 1_000_000_000) {
      return Math.max(0, Math.ceil((val * 1000 - Date.now()) / 1000));
    }
    if (val > 100_000) {
      return Math.max(0, Math.ceil(val / 1000));
    }
    return Math.max(0, Math.ceil(val));
  }
  if (typeof val === "string") {
    const trimmed = val.trim();
    const numericMatch = trimmed.match(/^(\d+)(s|m|h)?$/i);
    if (numericMatch) {
      const num = Number.parseInt(numericMatch[1], 10);
      const unit = numericMatch[2]?.toLowerCase();
      if (unit === "h") return num * 3600;
      if (unit === "m") return num * 60;
      return num;
    }
  }
  return null;
}

function parseTargetTimestamp(
  retryAt: Date | string | number | undefined
): number | null {
  if (!retryAt) return null;
  if (retryAt instanceof Date) {
    return retryAt.getTime();
  }
  if (typeof retryAt === "number") {
    if (retryAt > 1_000_000_000_000) return retryAt;
    if (retryAt > 1_000_000_000) return retryAt * 1000;
    return Date.now() + retryAt * 1000;
  }
  if (typeof retryAt === "string") {
    const parsed = new Date(retryAt);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.getTime();
    }
  }
  return null;
}

export function RateLimitAlert({
  retryAfter,
  retryAt,
  resetsAt,
  resetTime,
  retryIn,
  onRetry,
  isLoading = false,
  isRetrying = false,
  disabled = false,
  title = "Rate limit reached",
  message,
  error,
  buttonLabel = "Try again",
  className,
  ...props
}: RateLimitAlertProps) {
  const effectiveRetryAfter = retryAfter ?? retryIn;
  const effectiveRetryAt = retryAt ?? resetsAt ?? resetTime;

  const targetTimestamp = useMemo(() => {
    const timestampFromAt = parseTargetTimestamp(effectiveRetryAt);
    if (timestampFromAt) return timestampFromAt;

    const seconds = parseSeconds(effectiveRetryAfter);
    if (seconds !== null) {
      return Date.now() + seconds * 1000;
    }

    return null;
  }, [effectiveRetryAt, effectiveRetryAfter]);

  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(() => {
    if (targetTimestamp !== null) {
      return Math.max(0, Math.ceil((targetTimestamp - Date.now()) / 1000));
    }
    return parseSeconds(effectiveRetryAfter);
  });

  useEffect(() => {
    if (targetTimestamp === null) return;

    const update = () => {
      const remaining = Math.max(0, Math.ceil((targetTimestamp - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      return remaining;
    };

    update();
    const interval = setInterval(() => {
      const remaining = update();
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTimestamp]);

  const retryText = useMemo(() => {
    if (remainingSeconds !== null) {
      if (remainingSeconds <= 0) {
        return "You can retry now.";
      }
      return `You can retry in ${formatRemainingTime(remainingSeconds)}.`;
    }

    if (typeof effectiveRetryAfter === "string" && effectiveRetryAfter.trim()) {
      const trimmed = effectiveRetryAfter.trim();
      if (trimmed.startsWith("in ") || trimmed.startsWith("at ")) {
        return `You can retry ${trimmed}.`;
      }
      return `You can retry in ${trimmed}.`;
    }

    if (typeof effectiveRetryAt === "string" && effectiveRetryAt.trim()) {
      return `You can retry at ${effectiveRetryAt.trim()}.`;
    }

    return "You can retry in 1 hour.";
  }, [remainingSeconds, effectiveRetryAfter, effectiveRetryAt]);

  const errorMessage = useMemo(() => {
    if (message) return message;
    if (typeof error === "string") return error;
    if (error instanceof Error) return error.message;
    return "You were rate limited. Please wait before trying again.";
  }, [message, error]);

  const loading = isLoading || isRetrying;
  const buttonDisabled = disabled || loading;

  return (
    <div
      aria-live="polite"
      className={cn(
        "flex w-full flex-col gap-3 rounded-xl border border-destructive/25 bg-destructive/10 p-4 text-destructive shadow-xs sm:flex-row sm:items-center sm:justify-between dark:border-destructive/35 dark:bg-destructive/15",
        className
      )}
      data-testid="rate-limit-alert"
      role="alert"
      {...props}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0 text-destructive">
          <WarningIcon size={18} />
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="font-medium text-sm text-destructive">{title}</p>
          <p className="text-destructive/85 text-xs leading-normal">
            {errorMessage}{" "}
            <span className="font-semibold text-destructive">{retryText}</span>
          </p>
        </div>
      </div>

      <Button
        className="shrink-0 border-destructive/30 bg-background/60 text-destructive hover:bg-destructive/15 hover:text-destructive focus-visible:ring-destructive/30 dark:border-destructive/40 dark:bg-background/40"
        disabled={buttonDisabled}
        onClick={onRetry}
        size="sm"
        type="button"
        variant="outline"
      >
        {loading && <Spinner className="size-3.5" />}
        {buttonLabel}
      </Button>
    </div>
  );
}

export default RateLimitAlert;
