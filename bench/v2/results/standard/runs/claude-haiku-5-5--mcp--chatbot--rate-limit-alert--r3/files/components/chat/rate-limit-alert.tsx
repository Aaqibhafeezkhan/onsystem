import { AlertCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

type RateLimitAlertProps = {
  /** When the user can retry. If omitted, the alert tells the user to retry shortly. */
  retryAt?: Date | null;
  /** Called when the user clicks "Try again". */
  onRetry?: () => void;
  /** Disables the retry button, e.g. while a retry is in flight. */
  isRetrying?: boolean;
};

function formatRetryTime(retryAt: Date) {
  return retryAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function RateLimitAlert({
  retryAt,
  onRetry,
  isRetrying = false,
}: RateLimitAlertProps) {
  const retryMessage = retryAt
    ? `You can try again at ${formatRetryTime(retryAt)}.`
    : "You can try again shortly.";

  return (
    <div
      role="alert"
      className="flex w-full items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive"
    >
      <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="font-medium text-sm">You've been rate limited.</p>
        <p className="text-sm text-destructive/90">
          Too many requests were sent in a short time. {retryMessage}
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRetry}
        disabled={isRetrying}
        className="shrink-0 border-destructive/40 text-destructive hover:text-destructive"
      >
        Try again
      </Button>
    </div>
  );
}
