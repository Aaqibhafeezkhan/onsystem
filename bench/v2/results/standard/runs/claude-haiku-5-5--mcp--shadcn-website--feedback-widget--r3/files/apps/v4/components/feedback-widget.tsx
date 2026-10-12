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
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

type Vote = "up" | "down"

export interface FeedbackWidgetProps
  extends Omit<React.ComponentProps<typeof Card>, "onSubmit"> {
  onSubmit?: (feedback: { vote: Vote; comment: string }) => void
}

function FeedbackWidget({ onSubmit, className, ...props }: FeedbackWidgetProps) {
  const [vote, setVote] = React.useState<Vote | null>(null)
  const [comment, setComment] = React.useState("")

  function handleSubmit() {
    if (!vote) return
    onSubmit?.({ vote, comment: comment.trim() })
  }

  return (
    <Card className={className} {...props}>
      <CardHeader>
        <CardTitle>Was this page helpful?</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
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
          <div className="flex flex-col gap-2">
            <Textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Tell us more (optional)"
              aria-label="Feedback comments"
              rows={3}
            />
            <div className="flex justify-end">
              <Button type="button" size="sm" onClick={handleSubmit}>
                Send feedback
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export { FeedbackWidget }
