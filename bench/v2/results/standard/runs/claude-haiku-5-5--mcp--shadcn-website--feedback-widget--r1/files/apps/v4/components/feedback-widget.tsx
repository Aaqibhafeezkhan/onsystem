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

export interface FeedbackWidgetProps
  extends Omit<React.ComponentProps<typeof Card>, "children"> {
  /** Called when the user sends feedback, with their vote and optional comment. */
  onSubmit?: (feedback: { vote: Vote; comment: string }) => void
}

export function FeedbackWidget({
  onSubmit,
  className,
  ...props
}: FeedbackWidgetProps) {
  const [vote, setVote] = React.useState<Vote | null>(null)
  const [comment, setComment] = React.useState("")
  const [sent, setSent] = React.useState(false)
  const commentId = React.useId()

  function handleSend() {
    if (!vote) return
    onSubmit?.({ vote, comment: comment.trim() })
    setSent(true)
  }

  return (
    <Card className={className} {...props}>
      <CardHeader className="gap-0">
        <CardTitle className="text-sm font-medium">
          Was this page helpful?
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {sent ? (
          <p className="text-sm text-muted-foreground">
            Thanks for your feedback!
          </p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Button
                variant={vote === "up" ? "secondary" : "ghost"}
                size="icon-sm"
                aria-label="Yes, this page was helpful"
                aria-pressed={vote === "up"}
                onClick={() => setVote("up")}
              >
                <ThumbsUpIcon />
              </Button>
              <Button
                variant={vote === "down" ? "secondary" : "ghost"}
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
                <Label htmlFor={commentId}>Comments (optional)</Label>
                <Textarea
                  id={commentId}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Tell us more about your experience"
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button size="sm" onClick={handleSend}>
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
