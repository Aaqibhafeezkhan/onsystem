import { Button } from "@/components/ui/button";
import { WarningIcon } from "@/components/chat/icons";

type RateLimitAlertProps = {
  retryAt: Date;
  onRetry: () => void;
};

export function RateLimitAlert({ retryAt, onRetry }: RateLimitAlertProps) {
  const retryTime = retryAt.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive"
      role="alert"
    >
      <span aria-hidden="true" className="shrink-0">
        <WarningIcon />
      </span>
      <p className="min-w-0 flex-1 text-sm">
        You’ve been rate limited. You can try again at {retryTime}.
      </p>
      <Button onClick={onRetry} size="sm" type="button" variant="destructive">
        Try again
      </Button>
    </div>
  );
}
