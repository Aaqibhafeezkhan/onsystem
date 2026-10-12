"use client";

import * as React from "react";
import { WarningIcon } from "./icons";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export interface RateLimitAlertProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * When the rate limit resets or when the user can retry.
   * Can be a number of seconds, a Date, an epoch timestamp, or a string.
   */
  retryAfter?: number | string | Date;
  /**
   * Alias for retryAfter
   */
  resetsAt?: number | string | Date;
  /**
   * Alias for retryAfter
   */
  retryAt?: number | string | Date;
  /**
   * Callback when the "Try again" button is clicked.
   */
  onRetry?: () => void | Promise<void>;
  /**
   * Alias for onRetry
   */
  onTryAgain?: () => void | Promise<void>;
  /**
   * Primary error title or message.
   * Defaults to "You've been rate limited."
   */
  message?: React.ReactNode;
  /**
   * Alias for message
   */
  title?: React.ReactNode;
  /**
   * Subtitle or retry description.
   * Defaults to showing when the user can retry.
   */
  description?: React.ReactNode;
  /**
   * Whether the retry action is currently in progress.
   */
  isRetrying?: boolean;
  /**
   * Alias for isRetrying
   */
  isLoading?: boolean;
  /**
   * Label for the retry button. Defaults to "Try again".
   */
  buttonText?: string;
  /**
   * Whether the retry button is disabled.
   */
  disabled?: boolean;
}

function parseSecondsRemaining(value?: number | string | Date): number | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "number") {
    // Epoch timestamp in milliseconds
    if (value > 1_000_000_000_000) {
      return Math.max(0, Math.ceil((value - Date.now()) / 1000));
    }
    // Epoch timestamp in seconds
    if (value > 1_000_000_000) {
      return Math.max(0, Math.ceil((value * 1000 - Date.now()) / 1000));
    }
    // Relative seconds
    return Math.max(0, Math.ceil(value));
  }

  if (value instanceof Date) {
    return Math.max(0, Math.ceil((value.getTime() - Date.now()) / 1000));
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    const asNum = Number(trimmed);
    if (!Number.isNaN(asNum) && trimmed !== "") {
      return parseSecondsRemaining(asNum);
    }
    const parsedDate = Date.parse(trimmed);
    if (!Number.isNaN(parsedDate) && (trimmed.includes("T") || trimmed.includes("-"))) {
      return Math.max(0, Math.ceil((parsedDate - Date.now()) / 1000));
    }
  }

  return null;
}

function formatDurationSeconds(totalSeconds: number): string {
  if (totalSeconds <= 0) {
    return "now";
  }

  if (totalSeconds < 60) {
    return `in ${totalSeconds} second${totalSeconds === 1 ? "" : "s"}`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  if (minutes < 60) {
    if (remainingSeconds === 0) {
      return `in ${minutes} minute${minutes === 1 ? "" : "s"}`;
    }
    return `in ${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `in ${hours} hour${hours === 1 ? "" : "s"}`;
  }

  return `in ${hours}h ${remainingMinutes}m`;
}

function formatRetryTime(value?: number | string | Date): string {
  if (value === undefined || value === null) {
    return "in 1 hour";
  }

  const seconds = parseSecondsRemaining(value);
  if (seconds !== null) {
    return formatDurationSeconds(seconds);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (
      trimmed.toLowerCase().startsWith("in ") ||
      trimmed.toLowerCase().startsWith("at ")
    ) {
      return trimmed;
    }
    return `in ${trimmed}`;
  }

  return "in 1 hour";
}

export function RateLimitAlert({
  retryAfter,
  resetsAt,
  retryAt,
  onRetry,
  onTryAgain,
  message,
  title,
  description,
  isRetrying,
  isLoading,
  buttonText = "Try again",
  disabled,
  className,
  ...props
}: RateLimitAlertProps) {
  const retryTarget = resetsAt ?? retryAt ?? retryAfter;
  const initialSeconds = React.useMemo(
    () => parseSecondsRemaining(retryTarget),
    [retryTarget]
  );

  const [secondsRemaining, setSecondsRemaining] = React.useState<number | null>(
    initialSeconds
  );
  const [internalLoading, setInternalLoading] = React.useState(false);

  React.useEffect(() => {
    setSecondsRemaining(parseSecondsRemaining(retryTarget));
  }, [retryTarget]);

  React.useEffect(() => {
    if (secondsRemaining === null || secondsRemaining <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining]);

  const handleRetry = async () => {
    const action = onRetry ?? onTryAgain;
    if (!action) return;

    try {
      const result = action();
      if (result instanceof Promise) {
        setInternalLoading(true);
        await result;
      }
    } finally {
      setInternalLoading(false);
    }
  };

  const loading = isRetrying ?? isLoading ?? internalLoading;
  const isButtonDisabled = disabled ?? loading;

  const retryDisplay =
    secondsRemaining !== null
      ? formatDurationSeconds(secondsRemaining)
      : formatRetryTime(retryTarget);

  const titleContent = message ?? title ?? "You've been rate limited.";
  const descriptionContent =
    description !== undefined ? (
      description
    ) : (
      <>You can retry {retryDisplay}.</>
    );

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "flex w-full flex-col gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3.5 text-destructive sm:flex-row sm:items-center sm:justify-between dark:border-destructive/30 dark:bg-destructive/15",
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-2.5 sm:items-center">
        <div className="mt-0.5 shrink-0 text-destructive sm:mt-0">
          <WarningIcon size={16} />
        </div>
        <div className="flex flex-col gap-0.5 text-sm sm:flex-row sm:items-center sm:gap-2">
          <span className="font-medium text-destructive">{titleContent}</span>
          {descriptionContent ? (
            <>
              <span
                className="hidden text-destructive/40 sm:inline"
                aria-hidden="true"
              >
                •
              </span>
              <span className="text-xs text-destructive/85 sm:text-sm">
                {descriptionContent}
              </span>
            </>
          ) : null}
        </div>
      </div>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={handleRetry}
        disabled={isButtonDisabled}
        className="self-end shrink-0 border border-destructive/20 bg-destructive/15 text-destructive hover:bg-destructive/25 dark:border-destructive/30 dark:bg-destructive/20 dark:hover:bg-destructive/30 sm:self-center"
      >
        {loading && <Spinner className="size-3.5" />}
        {buttonText}
      </Button>
    </div>
  );
}

export default RateLimitAlert;
