"use client"

import * as React from "react"
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/registry/new-york-v4/ui/card"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

type Vote = "up" | "down"

export interface FeedbackWidgetProps extends React.ComponentProps<typeof Card> {
  /** Called when the user sends feedback. Comment is an empty string when none was written. */
  onSubmit?: (feedback: { vote: Vote; comment: string }) => void
}

export function FeedbackWidget({ onSubmit, className, ...props }: FeedbackWidgetProps) {
  const [vote, setVote] = React.useState<Vote | null>(null)
  const [comment, setComment] = React.useState("")
  const [sent, setSent] = React.useState(false)

  function handleSend() {
    if (!vote) return
    onSubmit?.({ vote, comment: comment.trim() })
    setSent(true)
  }

  return (
    <Card className={className ?? "w-full max-w-sm gap-4 py-4"} {...props}>
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-medium">Was this page helpful?</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 px-4">
        {sent ? (
          <p role="status" className="text-sm text-muted-foreground">
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
              <div className="flex flex-col gap-2">
                <Textarea
                  aria-label="Optional comments"
                  placeholder="Tell us more (optional)"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  className="min-h-20"
                />
                <Button type="button" size="sm" className="self-end" onClick={handleSend}>
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
