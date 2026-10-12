import { XCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RateLimitAlertProps = {
  /** When the user can retry. If omitted, no specific time is shown. */
  retryAt?: Date | null;
  /** Called when the user clicks "Try again". */
  onRetry?: () => void;
  className?: string;
};

function formatRetryTime(retryAt: Date) {
  return retryAt.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function RateLimitAlert({
  retryAt,
  onRetry,
  className,
}: RateLimitAlertProps) {
  const hasValidRetryAt = retryAt instanceof Date && !Number.isNaN(retryAt.getTime());

  return (
    <div
      role="alert"
      data-slot="rate-limit-alert"
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive dark:bg-destructive/20",
        className
      )}
    >
      <XCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />

      <div className="flex flex-1 flex-col gap-1">
        <p className="font-medium">You've been rate limited.</p>
        <p className="text-destructive/80">
          {hasValidRetryAt
            ? `You can try again at ${formatRetryTime(retryAt)}.`
            : "Please wait a moment before trying again."}
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="shrink-0 border-destructive/40 bg-transparent text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        Try again
      </Button>
    </div>
  );
}
