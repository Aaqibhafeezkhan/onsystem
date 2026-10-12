"use client"

import * as React from "react"
import { ThumbsDown, ThumbsUp } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/registry/new-york-v4/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/registry/new-york-v4/ui/card"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

export interface FeedbackWidgetProps extends React.ComponentProps<typeof Card> {
  onFeedbackSubmit?: (feedback: { vote: "up" | "down"; comment: string }) => void
}

export function FeedbackWidget({
  className,
  onFeedbackSubmit,
  ...props
}: FeedbackWidgetProps) {
  const [vote, setVote] = React.useState<"up" | "down" | null>(null)
  const [comment, setComment] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  const handleVote = (selectedVote: "up" | "down") => {
    setVote(selectedVote)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!vote) return
    setSubmitted(true)
    onFeedbackSubmit?.({ vote, comment })
  }

  return (
    <Card className={cn("w-full max-w-md", className)} {...props}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">
          Was this page helpful?
        </CardTitle>
      </CardHeader>
      <CardContent>
        {submitted ? (
          <p className="text-sm text-muted-foreground">
            Thank you for your feedback!
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {!vote ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleVote("up")}
                  aria-label="Thumbs up"
                >
                  <ThumbsUp className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleVote("down")}
                  aria-label="Thumbs down"
                >
                  <ThumbsDown className="size-4" />
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={vote === "up" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setVote("up")}
                    aria-label="Thumbs up"
                  >
                    <ThumbsUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={vote === "down" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setVote("down")}
                    aria-label="Thumbs down"
                  >
                    <ThumbsDown className="size-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground ml-1">
                    {vote === "up" ? "Helpful" : "Not helpful"}
                  </span>
                </div>
                <Textarea
                  placeholder="Optional comments..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-20 resize-none"
                />
                <div className="flex justify-end">
                  <Button type="submit" size="sm">
                    Send feedback
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
