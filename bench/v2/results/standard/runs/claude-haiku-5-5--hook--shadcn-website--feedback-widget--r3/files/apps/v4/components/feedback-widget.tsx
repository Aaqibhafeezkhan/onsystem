"use client"

import * as React from "react"
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Card, CardContent } from "@/registry/new-york-v4/ui/card"
import { Label } from "@/registry/new-york-v4/ui/label"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

type Vote = "up" | "down"

export interface FeedbackWidgetProps extends React.ComponentProps<"div"> {
  onSubmit?: (feedback: { vote: Vote; comment: string }) => void
}

export function FeedbackWidget({
  className,
  onSubmit,
  ...props
}: FeedbackWidgetProps) {
  const id = React.useId()
  const [vote, setVote] = React.useState<Vote | null>(null)
  const [comment, setComment] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  function handleSubmit() {
    if (!vote) return
    onSubmit?.({ vote, comment: comment.trim() })
    setSubmitted(true)
  }

  return (
    <div className={className} {...props}>
      <Card className="gap-4 py-4">
        <CardContent className="flex flex-col gap-3">
          {submitted ? (
            <p className="text-muted-foreground text-sm">
              Thanks for your feedback!
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
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
                <div className="flex flex-col gap-3">
                  <Label htmlFor={`${id}-comment`}>
                    Comments (optional)
                  </Label>
                  <Textarea
                    id={`${id}-comment`}
                    placeholder="Tell us more about your experience..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-20"
                  />
                  <div className="flex justify-end">
                    <Button type="button" size="sm" onClick={handleSubmit}>
                      Send feedback
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
