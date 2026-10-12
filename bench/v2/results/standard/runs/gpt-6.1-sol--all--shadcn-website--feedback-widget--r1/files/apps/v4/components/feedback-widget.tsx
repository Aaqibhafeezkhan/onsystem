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
  const commentsId = React.useId()
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
        <CardTitle className="text-sm">Was this page helpful?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4">
        <div className="flex gap-2" role="group" aria-label="Page helpfulness">
          <Button
            type="button"
            variant={vote === true ? "default" : "outline"}
            size="icon-sm"
            aria-label="Yes, this page was helpful"
            aria-pressed={vote === true}
            disabled={status === "sending" || status === "sent"}
            onClick={() => {
              setVote(true)
              setStatus("idle")
            }}
          >
            <IconThumbUp aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant={vote === false ? "default" : "outline"}
            size="icon-sm"
            aria-label="No, this page was not helpful"
            aria-pressed={vote === false}
            disabled={status === "sending" || status === "sent"}
            onClick={() => {
              setVote(false)
              setStatus("idle")
            }}
          >
            <IconThumbDown aria-hidden="true" />
          </Button>
        </div>
        {status === "sent" ? (
          <p role="status" className="text-sm text-muted-foreground">
            Thank you for your feedback!
          </p>
        ) : vote !== null ? (
          <form onSubmit={handleSubmit} className="space-y-3" aria-busy={status === "sending"}>
            <div className="space-y-2">
              <Label htmlFor={commentsId}>Comments (optional)</Label>
              <Textarea
                id={commentsId}
                name="comments"
                placeholder="Tell us how we can improve this page."
                rows={3}
                value={comments}
                onChange={(event) => setComments(event.target.value)}
                disabled={status === "sending"}
              />
            </div>
            {status === "error" && (
              <p role="alert" className="text-sm text-destructive">
                Could not send feedback. Please try again.
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
