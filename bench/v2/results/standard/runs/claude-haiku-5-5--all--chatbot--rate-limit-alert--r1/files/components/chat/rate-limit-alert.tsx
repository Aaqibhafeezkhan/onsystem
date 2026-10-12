import { AlertCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type RateLimitAlertProps = {
  /** When the user is allowed to retry. */
  retryAt: Date;
  /** Called when the user presses "Try again". */
  onRetry: () => void;
  className?: string;
};

export function RateLimitAlert({
  retryAt,
  onRetry,
  className,
}: RateLimitAlertProps) {
  const retryTime = retryAt.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div
      role="alert"
      className={`flex items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive ${className ?? ""}`}
    >
      <div className="flex items-start gap-2">
        <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <div className="flex flex-col">
          <p className="font-medium">You've been rate limited.</p>
          <p className="text-destructive/80">
            You can try again after {retryTime}.
          </p>
        </div>
      </div>
      <Button variant="destructive" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
