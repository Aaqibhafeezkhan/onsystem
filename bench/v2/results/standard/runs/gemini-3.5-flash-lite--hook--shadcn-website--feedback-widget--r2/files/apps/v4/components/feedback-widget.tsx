"use client"

import * as React from "react"
import { ThumbsDown, ThumbsUp } from "lucide-react"

import { Button } from "@/registry/new-york-v4/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/registry/new-york-v4/ui/card"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

export function FeedbackWidget() {
  const [voted, setVoted] = React.useState<"up" | "down" | null>(null)
  const [comment, setComment] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  const handleVote = (vote: "up" | "down") => {
    setVoted(vote)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="py-6">
          <p className="text-sm font-medium text-center text-muted-foreground">
            Thank you for your feedback!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-sm font-medium">
          Was this page helpful?
        </CardTitle>
        <div className="flex items-center gap-1.5">
          <Button
            variant={voted === "up" ? "default" : "outline"}
            size="icon-sm"
            onClick={() => handleVote("up")}
            aria-label="Thumbs up"
          >
            <ThumbsUp className="size-4" />
          </Button>
          <Button
            variant={voted === "down" ? "default" : "outline"}
            size="icon-sm"
            onClick={() => handleVote("down")}
            aria-label="Thumbs down"
          >
            <ThumbsDown className="size-4" />
          </Button>
        </div>
      </CardHeader>
      {voted && (
        <CardContent className="flex flex-col gap-3 pt-0">
          <Textarea
            placeholder="Optional comments..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSubmit}>
              Send feedback
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
