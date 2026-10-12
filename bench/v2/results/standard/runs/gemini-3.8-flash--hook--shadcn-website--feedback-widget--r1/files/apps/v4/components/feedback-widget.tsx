"use client"

import * as React from "react"
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Card, CardTitle } from "@/registry/new-york-v4/ui/card"
import { Label } from "@/registry/new-york-v4/ui/label"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

export interface FeedbackWidgetProps
  extends Omit<React.ComponentProps<typeof Card>, "onSubmit"> {
  title?: string
  onSubmit?: (data: { vote: "up" | "down"; comment: string }) => void
  onFeedbackSubmit?: (data: { vote: "up" | "down"; comment: string }) => void
  onVote?: (vote: "up" | "down") => void
}

export function FeedbackWidget({
  title = "Was this page helpful?",
  onSubmit,
  onFeedbackSubmit,
  onVote,
  className,
  ...props
}: FeedbackWidgetProps) {
  const [vote, setVote] = React.useState<"up" | "down" | null>(null)
  const [comment, setComment] = React.useState("")
  const [isSubmitted, setIsSubmitted] = React.useState(false)

  const handleVote = (selectedVote: "up" | "down") => {
    setVote(selectedVote)
    onVote?.(selectedVote)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!vote) {
      return
    }
    setIsSubmitted(true)
    onSubmit?.({ vote, comment })
    onFeedbackSubmit?.({ vote, comment })
  }

  return (
    <Card
      className={cn("w-full max-w-sm gap-3 p-4", className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-4">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={vote === "up" ? "default" : "outline"}
            size="icon-sm"
            onClick={() => handleVote("up")}
            disabled={isSubmitted}
            aria-label="Thumbs up"
            aria-pressed={vote === "up"}
          >
            <ThumbsUpIcon />
            <span className="sr-only">Thumbs up</span>
          </Button>
          <Button
            type="button"
            variant={vote === "down" ? "default" : "outline"}
            size="icon-sm"
            onClick={() => handleVote("down")}
            disabled={isSubmitted}
            aria-label="Thumbs down"
            aria-pressed={vote === "down"}
          >
            <ThumbsDownIcon />
            <span className="sr-only">Thumbs down</span>
          </Button>
        </div>
      </div>

      {isSubmitted ? (
        <p className="text-sm text-muted-foreground">
          Thank you for your feedback!
        </p>
      ) : vote ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Label htmlFor="feedback-comment" className="sr-only">
            Optional comments
          </Label>
          <Textarea
            id="feedback-comment"
            placeholder="Optional comments..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-20 resize-none text-sm"
            aria-label="Optional comments"
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm">
              Send feedback
            </Button>
          </div>
        </form>
      ) : null}
    </Card>
  )
}

export default FeedbackWidget
