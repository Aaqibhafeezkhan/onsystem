"use client"

import * as React from "react"
import { ThumbsDown, ThumbsUp } from "lucide-react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Card, CardContent } from "@/registry/new-york-v4/ui/card"
import { Label } from "@/registry/new-york-v4/ui/label"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

type Vote = "up" | "down"

export function FeedbackWidget() {
  const id = React.useId()
  const [vote, setVote] = React.useState<Vote | null>(null)
  const [comment, setComment] = React.useState("")
  const [sent, setSent] = React.useState(false)

  function handleSend() {
    setSent(true)
  }

  return (
    <Card className="w-full max-w-sm gap-4 py-4">
      <CardContent className="flex flex-col gap-4">
        {sent ? (
          <p role="status" className="text-sm text-muted-foreground">
            Thanks for your feedback!
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium">Was this page helpful?</p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={vote === "up" ? "secondary" : "ghost"}
                  size="icon-sm"
                  aria-label="Yes, this page was helpful"
                  aria-pressed={vote === "up"}
                  onClick={() => setVote("up")}
                >
                  <ThumbsUp />
                </Button>
                <Button
                  type="button"
                  variant={vote === "down" ? "secondary" : "ghost"}
                  size="icon-sm"
                  aria-label="No, this page was not helpful"
                  aria-pressed={vote === "down"}
                  onClick={() => setVote("down")}
                >
                  <ThumbsDown />
                </Button>
              </div>
            </div>

            {vote !== null && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`feedback-comment-${id}`}>
                    Comments (optional)
                  </Label>
                  <Textarea
                    id={`feedback-comment-${id}`}
                    placeholder="Tell us more about your experience..."
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    className="min-h-20"
                  />
                </div>
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
