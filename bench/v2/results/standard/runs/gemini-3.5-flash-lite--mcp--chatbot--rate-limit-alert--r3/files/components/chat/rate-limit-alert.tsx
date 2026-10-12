"use client";

import { Button } from "@/components/ui/button";
import { WarningIcon } from "@/components/chat/icons";
import { cn } from "@/lib/utils";

export type RateLimitAlertProps = {
  /**
   * Time or duration when the user can retry (e.g. "1 hour", "5 minutes")
   */
  retryAfter?: string;
  /**
   * Callback function when the 'Try again' button is clicked
   */
  onTryAgain?: () => void;
  /**
   * Additional className for the container
   */
  className?: string;
  /**
   * Custom message override
   */
  message?: string;
};

export function RateLimitAlert({
  retryAfter = "1 hour",
  onTryAgain,
  className,
  message,
}: RateLimitAlertProps) {
  const displayMessage =
    message ||
    `You've reached the message limit. Come back in ${retryAfter} to continue chatting.`;

  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive",
        className
      )}
      data-testid="rate-limit-alert"
    >
      <div className="flex items-center gap-2.5">
        <div className="text-destructive shrink-0">
          <WarningIcon size={16} />
        </div>
        <span>{displayMessage}</span>
      </div>
      {onTryAgain && (
        <Button
          variant="destructive"
          size="sm"
          onClick={onTryAgain}
          className="shrink-0"
        >
          Try again
        </Button>
      )}
    </div>
  );
}
