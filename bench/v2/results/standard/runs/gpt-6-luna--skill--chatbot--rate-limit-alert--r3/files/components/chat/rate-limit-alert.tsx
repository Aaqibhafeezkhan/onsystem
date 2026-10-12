import { Button } from "@/components/ui/button";
import { WarningIcon } from "./icons";

type RateLimitAlertProps = {
  retryAt: Date | string;
  onRetry: () => void;
};

export function RateLimitAlert({ retryAt, onRetry }: RateLimitAlertProps) {
  const retryDate = retryAt instanceof Date ? retryAt : new Date(retryAt);
  const retryTime = Number.isNaN(retryDate.getTime())
    ? "in about 1 hour"
    : retryDate.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });

  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-destructive"
      role="alert"
    >
      <WarningIcon />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm font-medium">You’ve been rate limited.</p>
        <p className="text-sm text-muted-foreground">
          You can try again {retryTime}.
        </p>
      </div>
      <Button onClick={onRetry} size="sm" variant="destructive">
        Try again
      </Button>
    </div>
  );
}
