import { Button } from "@/components/ui/button"

type RateLimitAlertProps = {
  /** When the user can send another request. */
  retryAt: Date
  /** Called when the user clicks "Try again". */
  onRetry?: () => void
  /** Disables the retry button, e.g. while a retry is in flight. */
  disabled?: boolean
}

export function RateLimitAlert({
  retryAt,
  onRetry,
  disabled = false,
}: RateLimitAlertProps) {
  const retryTime = retryAt.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })

  return (
    <div
      role="alert"
      className="flex w-full flex-col gap-3 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-col gap-1">
        <p className="font-medium text-sm">You've been rate limited.</p>
        <p className="text-sm text-foreground">
          Too many requests were sent in a short time. You can try again at{" "}
          <time dateTime={retryAt.toISOString()}>{retryTime}</time>.
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRetry}
        disabled={disabled}
        className="shrink-0"
      >
        Try again
      </Button>
    </div>
  )
}
