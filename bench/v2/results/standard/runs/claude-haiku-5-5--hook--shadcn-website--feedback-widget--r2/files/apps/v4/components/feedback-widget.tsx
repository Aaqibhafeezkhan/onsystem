"use client"

import * as React from "react"
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react"

import { Button } from "@/registry/new-york-v4/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/registry/new-york-v4/ui/card"
import { Label } from "@/registry/new-york-v4/ui/label"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

type Vote = "up" | "down"

export interface FeedbackWidgetProps {
  className?: string
  onSubmit?: (feedback: { vote: Vote; comment: string }) => void
}

export function FeedbackWidget({ className, onSubmit }: FeedbackWidgetProps) {
  const id = React.useId()
  const [vote, setVote] = React.useState<Vote | null>(null)
  const [comment, setComment] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  const handleSubmit = () => {
    if (!vote) return
    onSubmit?.({ vote, comment: comment.trim() })
    setSubmitted(true)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Was this page helpful?</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {submitted ? (
          <p className="text-muted-foreground text-sm" role="status">
            Thanks for your feedback!
          </p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={vote === "up" ? "secondary" : "outline"}
                size="icon-sm"
                aria-label="Yes, this page was helpful"
                aria-pressed={vote === "up"}
                onClick={() => setVote("up")}
              >
                <ThumbsUpIcon />
              </Button>
              <Button
                type="button"
                variant={vote === "down" ? "secondary" : "outline"}
                size="icon-sm"
                aria-label="No, this page was not helpful"
                aria-pressed={vote === "down"}
                onClick={() => setVote("down")}
              >
                <ThumbsDownIcon />
              </Button>
            </div>

            {vote && (
              <div className="flex flex-col gap-3">
                <Label htmlFor={`feedback-comment-${id}`}>
                  Any additional comments? (optional)
                </Label>
                <Textarea
                  id={`feedback-comment-${id}`}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us more..."
                  className="min-h-20"
                />
                <Button
                  type="button"
                  size="sm"
                  className="self-end"
                  onClick={handleSubmit}
                >
                  Send feedback
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
