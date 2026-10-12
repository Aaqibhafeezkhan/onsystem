"use client"

import * as React from "react"
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Card, CardContent } from "@/registry/new-york-v4/ui/card"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

type Vote = "up" | "down"

export function FeedbackWidget({
  className,
  onSubmit,
}: {
  className?: string
  onSubmit?: (feedback: { vote: Vote; comment: string }) => void
}) {
  const id = React.useId()
  const [vote, setVote] = React.useState<Vote | null>(null)
  const [comment, setComment] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!vote) return
    onSubmit?.({ vote, comment: comment.trim() })
    setSubmitted(true)
  }

  return (
    <Card className={className} data-slot="feedback-widget">
      <CardContent className="flex flex-col gap-4">
        {submitted ? (
          <p className="text-sm text-muted-foreground" role="status">
            Thanks for your feedback!
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <p id={`${id}-question`} className="text-sm font-medium">
                Was this page helpful?
              </p>
              <div
                role="group"
                aria-labelledby={`${id}-question`}
                className="flex items-center gap-1"
              >
                <Button
                  type="button"
                  variant={vote === "up" ? "secondary" : "ghost"}
                  size="icon-sm"
                  aria-label="Yes, this page was helpful"
                  aria-pressed={vote === "up"}
                  onClick={() => setVote("up")}
                >
                  <ThumbsUpIcon />
                </Button>
                <Button
                  type="button"
                  variant={vote === "down" ? "secondary" : "ghost"}
                  size="icon-sm"
                  aria-label="No, this page was not helpful"
                  aria-pressed={vote === "down"}
                  onClick={() => setVote("down")}
                >
                  <ThumbsDownIcon />
                </Button>
              </div>
            </div>

            {vote && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <label htmlFor={`${id}-comment`} className="sr-only">
                  Additional comments (optional)
                </label>
                <Textarea
                  id={`${id}-comment`}
                  placeholder="Tell us more (optional)"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  className="min-h-20"
                />
                <div className="flex justify-end">
                  <Button type="submit" size="sm">
                    Send feedback
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
