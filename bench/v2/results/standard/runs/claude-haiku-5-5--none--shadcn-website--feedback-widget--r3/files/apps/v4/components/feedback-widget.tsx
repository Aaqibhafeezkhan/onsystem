"use client"

import * as React from "react"
import { cn } from "cn"
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react"

import { Button } from "@/registry/new-york-v4/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/registry/new-york-v4/ui/card"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

type Vote = "up" | "down"

interface FeedbackWidgetProps extends React.ComponentProps<"div"> {
  onSubmit?: (feedback: { vote: Vote; comment: string }) => void
}

function FeedbackWidget({ className, onSubmit, ...props }: FeedbackWidgetProps) {
  const [vote, setVote] = React.useState<Vote | null>(null)
  const [comment, setComment] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  const handleSubmit = () => {
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
      <CardHeader className="flex flex-row items-center justify-between gap-2 px-4">
        <CardTitle className="text-sm">Was this page helpful?</CardTitle>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Yes, this page was helpful"
            aria-pressed={vote === "up"}
            disabled={submitted}
            onClick={() => setVote("up")}
            className={cn(vote === "up" && "bg-accent text-accent-foreground")}
          >
            <ThumbsUpIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="No, this page was not helpful"
            aria-pressed={vote === "down"}
            disabled={submitted}
            onClick={() => setVote("down")}
            className={cn(vote === "down" && "bg-accent text-accent-foreground")}
          >
            <ThumbsDownIcon />
          </Button>
        </div>
      </CardHeader>

      {vote && (
        <CardContent className="flex flex-col gap-3 px-4">
          {submitted ? (
            <p className="text-sm text-muted-foreground">
              Thanks for your feedback!
            </p>
          ) : (
            <>
              <Textarea
                aria-label="Additional comments"
                placeholder="Tell us more (optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-20 text-sm"
              />
              <div className="flex justify-end">
                <Button type="button" size="sm" onClick={handleSubmit}>
                  Send feedback
                </Button>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  )
}

export { FeedbackWidget }
