"use client"

import * as React from "react"
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react"

import { cn } from "@/lib/utils"
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
  const [vote, setVote] = React.useState<Vote | null>(null)
  const [comment, setComment] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!vote) return
    onSubmit?.({ vote, comment: comment.trim() })
    setSubmitted(true)
  }

  return (
    <Card className={cn("w-full max-w-sm py-4", className)}>
      <CardContent className="flex flex-col gap-4 px-4">
        {submitted ? (
          <p className="text-sm text-muted-foreground">
            Thanks for your feedback!
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Was this page helpful?</p>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant={vote === "up" ? "secondary" : "ghost"}
                  size="icon"
                  className="size-8"
                  aria-label="Yes, this page was helpful"
                  aria-pressed={vote === "up"}
                  onClick={() => setVote("up")}
                >
                  <ThumbsUpIcon />
                </Button>
                <Button
                  type="button"
                  variant={vote === "down" ? "secondary" : "ghost"}
                  size="icon"
                  className="size-8"
                  aria-label="No, this page was not helpful"
                  aria-pressed={vote === "down"}
                  onClick={() => setVote("down")}
                >
                  <ThumbsDownIcon />
                </Button>
              </div>
            </div>
            {vote ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Any additional comments? (optional)"
                  aria-label="Additional comments"
                />
                <Button type="submit" size="sm" className="w-fit">
                  Send feedback
                </Button>
              </form>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  )
}
