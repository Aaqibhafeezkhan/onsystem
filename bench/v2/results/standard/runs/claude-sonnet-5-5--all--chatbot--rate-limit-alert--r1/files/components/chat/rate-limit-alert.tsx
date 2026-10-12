import { Button } from "@/components/ui/button"

interface RateLimitAlertProps {
  /** When the user can retry. */
  retryAt: Date
  onRetry: () => void
}

export function RateLimitAlert({ retryAt, onRetry }: RateLimitAlertProps) {
  const time = retryAt.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })

  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm"
    >
      <div className="flex flex-col gap-0.5">
        <p className="font-medium text-destructive">You've been rate limited</p>
        <p className="text-muted-foreground">
          Too many requests. You can retry at{" "}
          <time dateTime={retryAt.toISOString()}>{time}</time>.
        </p>
      </div>
      <Button variant="destructive" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}
