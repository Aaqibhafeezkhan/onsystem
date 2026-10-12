"use client"

import * as React from "react"
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react"

import { Button } from "@/registry/new-york-v4/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/registry/new-york-v4/ui/card"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"
import { cn } from "cn"

export interface FeedbackWidgetProps
  extends React.ComponentProps<typeof Card> {
  onSubmit?: (data: {
    vote: "up" | "down"
    comment: string
    comments: string
  }) => void
}

export function FeedbackWidget({
  className,
  onSubmit,
  ...props
}: FeedbackWidgetProps) {
  const [vote, setVote] = React.useState<"up" | "down" | null>(null)
  const [comment, setComment] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!vote) return
    setSubmitted(true)
    onSubmit?.({ vote, comment, comments: comment })
  }

  return (
    <Card className={cn("w-full max-w-sm", className)} {...props}>
      <CardHeader>
        <CardTitle className="text-base font-medium">
          Was this page helpful?
        </CardTitle>
        <CardAction className="flex items-center gap-1">
          <Button
            variant={vote === "up" ? "default" : "outline"}
            size="icon-sm"
            aria-label="Thumbs up"
            onClick={() => {
              setVote("up")
              setSubmitted(false)
            }}
          >
            <ThumbsUpIcon />
          </Button>
          <Button
            variant={vote === "down" ? "default" : "outline"}
            size="icon-sm"
            aria-label="Thumbs down"
            onClick={() => {
              setVote("down")
              setSubmitted(false)
            }}
          >
            <ThumbsDownIcon />
          </Button>
        </CardAction>
      </CardHeader>
      {vote !== null && (
        <CardContent>
          {submitted ? (
            <p className="text-sm text-muted-foreground">
              Thank you for your feedback!
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <Textarea
                placeholder="Optional comments..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                aria-label="Optional comments"
              />
              <Button type="submit" size="sm" className="self-end">
                Send feedback
              </Button>
            </form>
          )}
        </CardContent>
      )}
    </Card>
  )
}

export default FeedbackWidget
