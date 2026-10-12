"use client"

import * as React from "react"
import { IconThumbDown, IconThumbUp } from "@tabler/icons-react"

import { Button } from "@/registry/new-york-v4/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/registry/new-york-v4/ui/card"
import { Label } from "@/registry/new-york-v4/ui/label"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

type FeedbackWidgetProps = {
  onSubmit?: (feedback: {
    helpful: boolean
    comments: string
  }) => void | Promise<void>
}

export function FeedbackWidget({ onSubmit }: FeedbackWidgetProps = {}) {
  const id = React.useId()
  const [vote, setVote] = React.useState<boolean | null>(null)
  const [comments, setComments] = React.useState("")
  const [status, setStatus] = React.useState<
    "idle" | "sending" | "sent" | "error"
  >("idle")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (vote === null || status === "sending" || status === "sent") return

    setStatus("sending")
    try {
      await onSubmit?.({ helpful: vote, comments: comments.trim() })
      setStatus("sent")
    } catch {
      setStatus("error")
    }
  }

  return (
    <Card className="w-full max-w-sm gap-4 py-4">
      <CardHeader className="px-4">
        <CardTitle id={`${id}-title`} className="text-sm">
          Was this page helpful?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4">
        <div
          role="group"
          aria-labelledby={`${id}-title`}
          className="flex gap-2"
        >
          <Button
            type="button"
            variant={vote === true ? "secondary" : "outline"}
            size="icon"
            aria-label="Yes, this page was helpful"
            aria-pressed={vote === true}
            disabled={status === "sending" || status === "sent"}
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
            disabled={status === "sending" || status === "sent"}
            onClick={() => setVote(false)}
          >
            <IconThumbDown aria-hidden="true" />
          </Button>
        </div>
        {status === "sent" ? (
          <p role="status" className="text-sm text-muted-foreground">
            Thank you for your feedback!
          </p>
        ) : vote !== null ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Label htmlFor={`${id}-comments`}>Comments (optional)</Label>
            <Textarea
              id={`${id}-comments`}
              name="comments"
              placeholder="Tell us more…"
              rows={3}
              value={comments}
              onChange={(event) => setComments(event.target.value)}
              disabled={status === "sending"}
            />
            {status === "error" && (
              <p role="alert" className="text-sm text-destructive">
                Could not send your feedback. Please try again.
              </p>
            )}
            <Button type="submit" size="sm" disabled={status === "sending"}>
              {status === "sending" ? "Sending…" : "Send feedback"}
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  )
}
