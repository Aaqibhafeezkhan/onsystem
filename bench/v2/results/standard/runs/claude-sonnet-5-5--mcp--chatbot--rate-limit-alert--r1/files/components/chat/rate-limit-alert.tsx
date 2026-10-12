import { Button } from "@/components/ui/button"

type RateLimitAlertProps = {
  /** When the user can retry. */
  retryAt: Date
  onRetry?: () => void
}

export function RateLimitAlert({ retryAt, onRetry }: RateLimitAlertProps) {
  const time = retryAt.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })

  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-lg bg-destructive/10 px-3 py-2 text-destructive dark:bg-destructive/20"
    >
      <div className="flex flex-col text-sm">
        <span className="font-medium">You&apos;ve been rate limited</span>
        <span>You can try again at {time}.</span>
      </div>
      <Button variant="destructive" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}
