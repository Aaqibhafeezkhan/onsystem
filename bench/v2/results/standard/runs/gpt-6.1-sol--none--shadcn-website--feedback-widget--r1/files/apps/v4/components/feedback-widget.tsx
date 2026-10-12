"use client"

import * as React from "react"
import { IconThumbDown, IconThumbUp } from "@tabler/icons-react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Card, CardContent } from "@/registry/new-york-v4/ui/card"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

type FeedbackWidgetProps = {
  onSendFeedback?: (feedback: {
    vote: "up" | "down"
    comment: string
  }) => void | Promise<void>
}

export function FeedbackWidget({ onSendFeedback }: FeedbackWidgetProps = {}) {
  const [vote, setVote] = React.useState<"up" | "down" | null>(null)
  const [comment, setComment] = React.useState("")
  const [isSending, setIsSending] = React.useState(false)
  const [isSent, setIsSent] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const headingId = React.useId()
  const commentId = React.useId()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!vote || isSending) return

    setIsSending(true)
    setError(null)

    try {
      await onSendFeedback?.({ vote, comment: comment.trim() })
      setIsSent(true)
    } catch {
      setError("Unable to send feedback. Please try again.")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Card className="w-full max-w-sm gap-4 py-4">
      <CardContent className="space-y-4 px-4">
        <div className="flex items-center justify-between gap-4">
          <h2 id={headingId} className="text-sm font-medium">
            Was this page helpful?
          </h2>
          <div role="group" aria-labelledby={headingId} className="flex gap-1">
            <Button
              type="button"
              variant={vote === "up" ? "secondary" : "ghost"}
              size="icon-sm"
              aria-label="Yes, this page was helpful"
              aria-pressed={vote === "up"}
              disabled={isSending || isSent}
              onClick={() => setVote("up")}
            >
              <IconThumbUp aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant={vote === "down" ? "secondary" : "ghost"}
              size="icon-sm"
              aria-label="No, this page was not helpful"
              aria-pressed={vote === "down"}
              disabled={isSending || isSent}
              onClick={() => setVote("down")}
            >
              <IconThumbDown aria-hidden="true" />
            </Button>
          </div>
        </div>
        {isSent ? (
          <p role="status" className="text-sm text-muted-foreground">
            Thanks for your feedback!
          </p>
        ) : vote ? (
          <form onSubmit={handleSubmit} className="space-y-3" aria-busy={isSending}>
            <label htmlFor={commentId} className="sr-only">
              Comments (optional)
            </label>
            <Textarea
              id={commentId}
              name="comment"
              placeholder="Share your thoughts (optional)"
              rows={3}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              disabled={isSending}
              className="min-h-24 resize-y"
            />
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" size="sm" disabled={isSending}>
              {isSending ? "Sending…" : "Send feedback"}
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  )
}
