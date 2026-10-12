"use client"

import { AlertCircleIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type RateLimitAlertProps = {
  /** When the user is allowed to retry. Shown as a local time. */
  retryAt?: Date | string | number
  /** Called when the user clicks "Try again". */
  onRetry?: () => void
  className?: string
}

function formatRetryTime(retryAt: Date | string | number) {
  const date = retryAt instanceof Date ? retryAt : new Date(retryAt)
  if (Number.isNaN(date.getTime())) return null

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })
}

export function RateLimitAlert({
  retryAt,
  onRetry,
  className,
}: RateLimitAlertProps) {
  const retryTime = retryAt !== undefined ? formatRetryTime(retryAt) : null

  return (
    <div
      role="alert"
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive dark:bg-destructive/20",
        className
      )}
    >
      <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="flex flex-1 flex-col gap-1">
        <p className="font-medium">You've been rate limited.</p>
        <p className="text-destructive/80">
          {retryTime
            ? `You can try again at ${retryTime}.`
            : "Please wait a moment before trying again."}
        </p>
      </div>
      {onRetry && (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onRetry}
        >
          Try again
        </Button>
      )}
    </div>
  )
}
