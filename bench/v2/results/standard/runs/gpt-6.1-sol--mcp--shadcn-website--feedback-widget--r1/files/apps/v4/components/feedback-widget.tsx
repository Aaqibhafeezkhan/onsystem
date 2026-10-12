"use client"

import * as React from "react"
import { IconThumbDown, IconThumbUp } from "@tabler/icons-react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Card } from "@/registry/new-york-v4/ui/card"
import { Label } from "@/registry/new-york-v4/ui/label"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

type Feedback = {
  helpful: boolean
  comments: string
}

type FeedbackWidgetProps = {
  onSendFeedback?: (feedback: Feedback) => void | Promise<void>
}

export function FeedbackWidget({ onSendFeedback }: FeedbackWidgetProps = {}) {
  const id = React.useId()
  const [vote, setVote] = React.useState<boolean | null>(null)
  const [comments, setComments] = React.useState("")
  const [sending, setSending] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (vote === null || sending || submitted) return

    setSending(true)
    setError(null)
    try {
      await onSendFeedback?.({ helpful: vote, comments: comments.trim() })
      setSubmitted(true)
    } catch {
      setError("Could not send feedback. Please try again.")
    } finally {
      setSending(false)
    }
  }

  return (
    <Card className="w-full max-w-sm gap-4 p-4" aria-labelledby={`${id}-title`}>
      <p id={`${id}-title`} className="text-sm font-medium">
        Was this page helpful?
      </p>
      <div className="flex gap-2" role="group" aria-labelledby={`${id}-title`}>
        <Button
          type="button"
          variant={vote === true ? "secondary" : "outline"}
          size="icon"
          aria-label="Yes, this page was helpful"
          aria-pressed={vote === true}
          disabled={sending || submitted}
          onClick={() => setVote(true)}
        >
          <IconThumbUp aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant={vote === false ? "secondary" : "outline"}
          size="icon"
          aria-label="No, this page was not helpful"
          aria-pressed={vote === false}
          disabled={sending || submitted}
          onClick={() => setVote(false)}
        >
          <IconThumbDown aria-hidden="true" />
        </Button>
      </div>
      {submitted ? (
        <p role="status" className="text-sm text-muted-foreground">
          Thanks for your feedback!
        </p>
      ) : (
        vote !== null && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3" aria-busy={sending}>
            <Label htmlFor={`${id}-comments`}>Comments (optional)</Label>
            <Textarea
              id={`${id}-comments`}
              name="comments"
              placeholder="Tell us more…"
              rows={3}
              value={comments}
              onChange={(event) => setComments(event.target.value)}
              disabled={sending}
              aria-describedby={error ? `${id}-error` : undefined}
            />
            {error && (
              <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" size="sm" className="self-start" disabled={sending}>
              {sending ? "Sending…" : "Send feedback"}
            </Button>
          </form>
        )
      )}
    </Card>
  )
}
