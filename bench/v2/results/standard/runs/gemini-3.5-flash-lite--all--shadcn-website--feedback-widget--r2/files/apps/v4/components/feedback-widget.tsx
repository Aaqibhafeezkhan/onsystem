"use client"

import * as React from "react"
import { ThumbsDown, ThumbsUp } from "lucide-react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Card, CardContent } from "@/registry/new-york-v4/ui/card"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

export function FeedbackWidget() {
  const [vote, setVote] = React.useState<"up" | "down" | null>(null)
  const [comment, setComment] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  const handleVote = (selectedVote: "up" | "down") => {
    setVote(selectedVote)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          Thank you for your feedback!
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-card-foreground">
            Was this page helpful?
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant={vote === "up" ? "default" : "outline"}
              size="icon"
              aria-label="Thumbs up"
              onClick={() => handleVote("up")}
            >
              <ThumbsUp />
            </Button>
            <Button
              variant={vote === "down" ? "default" : "outline"}
              size="icon"
              aria-label="Thumbs down"
              onClick={() => handleVote("down")}
            >
              <ThumbsDown />
            </Button>
          </div>
        </div>

        {vote !== null && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <Textarea
              placeholder="Optional comments..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm">
                Send feedback
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
