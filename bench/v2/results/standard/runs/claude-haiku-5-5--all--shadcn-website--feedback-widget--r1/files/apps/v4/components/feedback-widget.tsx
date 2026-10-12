"use client"

import * as React from "react"
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react"

import { Button } from "@/registry/new-york-v4/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/registry/new-york-v4/ui/card"
import { Label } from "@/registry/new-york-v4/ui/label"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

type Vote = "up" | "down"

export interface FeedbackWidgetProps extends React.ComponentProps<typeof Card> {
  /** Called with the vote and the optional comment when feedback is sent. */
  onSubmit?: (feedback: { vote: Vote; comment: string }) => void
}

export function FeedbackWidget({
  onSubmit,
  className,
  ...props
}: FeedbackWidgetProps) {
  const commentId = React.useId()
  const [vote, setVote] = React.useState<Vote | null>(null)
  const [comment, setComment] = React.useState("")
  const [sent, setSent] = React.useState(false)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!vote) return
    onSubmit?.({ vote, comment: comment.trim() })
    setSent(true)
  }

  return (
    <Card className={className} {...props}>
      <CardHeader>
        <CardTitle>Was this page helpful?</CardTitle>
      </CardHeader>

      {sent ? (
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Thanks for your feedback!
          </p>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-4">
            <div className="flex gap-2">
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
                <Label htmlFor={commentId}>
                  Comments <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id={commentId}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Tell us more about your experience"
                  rows={3}
                />
              </div>
            )}
          </CardContent>

          {vote && (
            <CardFooter className="justify-end">
              <Button type="submit">Send feedback</Button>
            </CardFooter>
          )}
        </form>
      )}
    </Card>
  )
}
