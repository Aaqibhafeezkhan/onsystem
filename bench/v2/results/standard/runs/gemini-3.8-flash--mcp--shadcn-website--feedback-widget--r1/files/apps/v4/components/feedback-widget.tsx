"use client"

import * as React from "react"
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/registry/new-york-v4/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/registry/new-york-v4/ui/card"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

export interface FeedbackWidgetProps
  extends React.ComponentProps<typeof Card> {
  onSubmitFeedback?: (feedback: {
    vote: "up" | "down"
    comment: string
  }) => void
}

export function FeedbackWidget({
  className,
  onSubmitFeedback,
  ...props
}: FeedbackWidgetProps) {
  const [vote, setVote] = React.useState<"up" | "down" | null>(null)
  const [comment, setComment] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!vote) return
    setSubmitted(true)
    onSubmitFeedback?.({ vote, comment })
  }

  return (
    <Card className={cn("w-full max-w-sm", className)} {...props}>
      <CardHeader>
        <CardTitle className="self-center text-sm font-medium">
          Was this page helpful?
        </CardTitle>
        <CardAction className="self-center flex items-center gap-1.5">
          <Button
            type="button"
            variant={vote === "up" ? "default" : "outline"}
            size="icon-sm"
            aria-label="Thumbs up"
            aria-pressed={vote === "up"}
            disabled={submitted}
            onClick={() => setVote("up")}
          >
            <ThumbsUpIcon />
          </Button>
          <Button
            type="button"
            variant={vote === "down" ? "default" : "outline"}
            size="icon-sm"
            aria-label="Thumbs down"
            aria-pressed={vote === "down"}
            disabled={submitted}
            onClick={() => setVote("down")}
          >
            <ThumbsDownIcon />
          </Button>
        </CardAction>
      </CardHeader>
      {vote !== null && (
        <CardContent>
          {submitted ? (
            <p className="text-sm text-muted-foreground">
              Thank you for your feedback!
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <Textarea
                aria-label="Optional comments"
                placeholder="Optional comments..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm">
                  Send feedback
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      )}
    </Card>
  )
}
