"use client"

import * as React from "react"
import { cn } from "cn"
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Card, CardContent } from "@/registry/new-york-v4/ui/card"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

export type FeedbackVote = "up" | "down"

export interface FeedbackSubmission {
  vote: FeedbackVote
  comment: string
}

export interface FeedbackWidgetProps
  extends Omit<React.ComponentProps<typeof Card>, "onSubmit"> {
  onSubmit?: (feedback: FeedbackSubmission) => void
}

function FeedbackWidget({
  className,
  onSubmit,
  ...props
}: FeedbackWidgetProps) {
  const [vote, setVote] = React.useState<FeedbackVote | null>(null)
  const [comment, setComment] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  const handleSend = () => {
    if (!vote) return
    onSubmit?.({ vote, comment: comment.trim() })
    setSubmitted(true)
  }

  return (
    <Card
      data-slot="feedback-widget"
      className={cn("w-full max-w-sm gap-4 py-4", className)}
      {...props}
    >
      <CardContent className="flex flex-col gap-4">
        {submitted ? (
          <p className="text-sm text-muted-foreground">
            Thanks for your feedback!
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium">Was this page helpful?</p>
              <div className="flex items-center gap-1">
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
              <div className="flex flex-col gap-3">
                <Textarea
                  aria-label="Additional comments (optional)"
                  placeholder="Tell us more (optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-20"
                />
                <div className="flex justify-end">
                  <Button type="button" size="sm" onClick={handleSend}>
                    Send feedback
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export { FeedbackWidget }
