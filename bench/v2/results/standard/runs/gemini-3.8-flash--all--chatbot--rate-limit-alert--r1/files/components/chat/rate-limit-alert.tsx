"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { WarningIcon } from "./icons";

export interface RateLimitAlertProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * When the user can retry. Can be a string (e.g. "1 hour", "in 5 minutes"),
   * a number (seconds remaining or timestamp), or a Date instance.
   */
  retryAfter?: string | number | Date;
  /**
   * Alias for `retryAfter`.
   */
  retryAt?: string | number | Date;
  /**
   * Alias for `retryAfter`.
   */
  resetTime?: string | number | Date;
  /**
   * Callback fired when clicking the 'Try again' button.
   */
  onRetry?: () => void;
  /**
   * Custom title or message indicating the rate limit.
   * Defaults to "You have been rate limited."
   */
  message?: React.ReactNode;
  /**
   * Custom description or retry message.
   * If not provided, computed from retryAfter / retryAt / resetTime.
   */
  description?: React.ReactNode;
  /**
   * Text for the retry button. Defaults to "Try again".
   */
  buttonText?: string;
  /**
   * Variant for the retry Button component. Defaults to "destructive".
   */
  buttonVariant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "destructive"
    | "link";
  /**
   * Whether the retry action is currently in progress.
   */
  isRetrying?: boolean;
  /**
   * Alias for `isRetrying`.
   */
  isLoading?: boolean;
  /**
   * Whether the retry button is disabled.
   */
  disabled?: boolean;
}

function formatRetryTime(time?: string | number | Date): string {
  if (!time) {
    return "in 1 hour";
  }

  if (typeof time === "string") {
    const trimmed = time.trim();
    if (trimmed.startsWith("in ") || trimmed.startsWith("at ")) {
      return trimmed;
    }
    if (/^\d{1,2}:\d{2}/.test(trimmed)) {
      return `at ${trimmed}`;
    }
    return `in ${trimmed}`;
  }

  if (time instanceof Date) {
    const diffMs = time.getTime() - Date.now();
    if (diffMs > 0) {
      const diffSec = Math.ceil(diffMs / 1000);
      if (diffSec < 60) {
        return `in ${diffSec}s`;
      }
      const diffMin = Math.ceil(diffSec / 60);
      if (diffMin < 60) {
        return `in ${diffMin} minute${diffMin === 1 ? "" : "s"}`;
      }
      const diffHr = Math.ceil(diffMin / 60);
      return `in ${diffHr} hour${diffHr === 1 ? "" : "s"}`;
    }
    return `at ${time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }

  if (typeof time === "number") {
    if (time > 1_000_000_000_000) {
      return formatRetryTime(new Date(time));
    }
    if (time > 1_000_000_000) {
      return formatRetryTime(new Date(time * 1000));
    }
    if (time <= 0) {
      return "now";
    }
    if (time < 60) {
      return `in ${time} second${time === 1 ? "" : "s"}`;
    }
    const mins = Math.ceil(time / 60);
    if (mins < 60) {
      return `in ${mins} minute${mins === 1 ? "" : "s"}`;
    }
    const hours = Math.ceil(mins / 60);
    return `in ${hours} hour${hours === 1 ? "" : "s"}`;
  }

  return "in 1 hour";
}

export function RateLimitAlert({
  retryAfter,
  retryAt,
  resetTime,
  onRetry,
  message = "You have been rate limited.",
  description,
  buttonText = "Try again",
  buttonVariant = "destructive",
  isRetrying = false,
  isLoading = false,
  disabled = false,
  className,
  children,
  ...props
}: RateLimitAlertProps) {
  const retryTarget = retryAfter ?? retryAt ?? resetTime;
  const retryText = formatRetryTime(retryTarget);
  const descriptionText = description ?? `You can retry ${retryText}.`;
  const isPending = isRetrying || isLoading;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-destructive",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-destructive" aria-hidden="true">
          <WarningIcon size={16} />
        </span>
        <div className="text-sm">
          {children ? (
            children
          ) : (
            <>
              <span className="font-medium">{message}</span>{" "}
              <span className="text-destructive/80">{descriptionText}</span>
            </>
          )}
        </div>
      </div>
      <Button
        type="button"
        variant={buttonVariant}
        size="sm"
        onClick={onRetry}
        disabled={disabled || isPending}
        className="shrink-0 border border-destructive/30"
      >
        {isPending && <Spinner className="size-3.5" />}
        {buttonText}
      </Button>
    </div>
  );
}

export default RateLimitAlert;
