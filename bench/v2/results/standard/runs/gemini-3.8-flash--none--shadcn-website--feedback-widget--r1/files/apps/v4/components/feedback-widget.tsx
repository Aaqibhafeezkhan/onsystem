"use client"

import * as React from "react"
import { cn } from "cn"
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Card } from "@/registry/new-york-v4/ui/card"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

export interface FeedbackWidgetProps
  extends Omit<React.ComponentProps<typeof Card>, "onSubmit"> {
  onVote?: (vote: "up" | "down") => void
  onFeedbackSubmit?: (feedback: { vote: "up" | "down"; comment: string }) => void
  onSubmit?: (feedback: { vote: "up" | "down"; comment: string }) => void
}

export function FeedbackWidget({
  className,
  onVote,
  onFeedbackSubmit,
  onSubmit,
  ...props
}: FeedbackWidgetProps) {
  const [vote, setVote] = React.useState<"up" | "down" | null>(null)
  const [comment, setComment] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)
  const textareaId = React.useId()

  const handleVote = (selectedVote: "up" | "down") => {
    setVote(selectedVote)
    setSubmitted(false)
    onVote?.(selectedVote)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!vote) return
    onFeedbackSubmit?.({ vote, comment })
    onSubmit?.({ vote, comment })
    setSubmitted(true)
  }

  return (
    <Card className={cn("w-full max-w-sm gap-3 p-4", className)} {...props}>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium">Was this page helpful?</span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={vote === "up" ? "default" : "outline"}
            size="icon-sm"
            aria-label="Thumbs up"
            title="Thumbs up"
            aria-pressed={vote === "up"}
            onClick={() => handleVote("up")}
          >
            <ThumbsUpIcon />
          </Button>
          <Button
            type="button"
            variant={vote === "down" ? "default" : "outline"}
            size="icon-sm"
            aria-label="Thumbs down"
            title="Thumbs down"
            aria-pressed={vote === "down"}
            onClick={() => handleVote("down")}
          >
            <ThumbsDownIcon />
          </Button>
        </div>
      </div>
      {vote !== null && (
        submitted ? (
          <p className="text-muted-foreground text-center text-xs">
            Thank you for your feedback!
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <label htmlFor={textareaId} className="sr-only">
              Optional comments
            </label>
            <Textarea
              id={textareaId}
              placeholder="Optional comments..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-20 resize-none text-sm"
            />
            <Button type="submit" size="sm" className="w-full">
              Send feedback
            </Button>
          </form>
        )
      )}
    </Card>
  )
}
