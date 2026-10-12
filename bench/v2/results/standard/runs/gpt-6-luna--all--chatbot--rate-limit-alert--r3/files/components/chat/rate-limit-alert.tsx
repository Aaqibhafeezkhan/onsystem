import { Button } from "@/components/ui/button";

type RateLimitAlertProps = {
  retryAt: Date;
  onRetry: () => void;
};

export function RateLimitAlert({ retryAt, onRetry }: RateLimitAlertProps) {
  const retryTime = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(retryAt);

  return (
    <div
      className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive sm:flex-row sm:items-center sm:justify-between"
      role="alert"
    >
      <p className="text-sm">
        You’ve been rate limited. You can try again at {retryTime}.
      </p>
      <Button onClick={onRetry} size="sm" variant="destructive">
        Try again
      </Button>
    </div>
  );
}
