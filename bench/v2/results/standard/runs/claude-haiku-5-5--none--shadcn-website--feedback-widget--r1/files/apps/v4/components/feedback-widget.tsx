"use client"

import * as React from "react"
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Card, CardContent, CardTitle } from "@/registry/new-york-v4/ui/card"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

type Vote = "up" | "down"

export interface FeedbackWidgetProps extends React.ComponentProps<typeof Card> {
  /** Called when the user sends feedback after voting. */
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

  function handleSend() {
    if (!vote) return
    onSubmit?.({ vote, comment: comment.trim() })
  }

  return (
    <Card className={cn("gap-4 py-4 text-sm", className)} {...props}>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <CardTitle id={`${id}-title`} className="text-sm font-medium">
            Was this page helpful?
          </CardTitle>
          <div
            role="group"
            aria-labelledby={`${id}-title`}
            className="flex items-center gap-1"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Yes, this page was helpful"
              aria-pressed={vote === "up"}
              data-state={vote === "up" ? "active" : "inactive"}
              className={cn(
                "text-muted-foreground",
                vote === "up" && "bg-accent text-foreground"
              )}
              onClick={() => setVote("up")}
            >
              <ThumbsUpIcon />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="No, this page was not helpful"
              aria-pressed={vote === "down"}
              data-state={vote === "down" ? "active" : "inactive"}
              className={cn(
                "text-muted-foreground",
                vote === "down" && "bg-accent text-foreground"
              )}
              onClick={() => setVote("down")}
            >
              <ThumbsDownIcon />
            </Button>
          </div>
        </div>

        {vote && (
          <div className="flex flex-col gap-3">
            <label
              htmlFor={`${id}-comment`}
              className="text-sm text-muted-foreground"
            >
              Tell us more (optional)
            </label>
            <Textarea
              id={`${id}-comment`}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What could we improve?"
              className="min-h-20"
            />
            <div className="flex justify-end">
              <Button type="button" size="sm" onClick={handleSend}>
                Send feedback
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
