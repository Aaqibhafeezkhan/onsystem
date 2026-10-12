"use client"

import * as React from "react"
import { ThumbsDown, ThumbsUp } from "lucide-react"

import { Button } from "@/registry/new-york-v4/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/registry/new-york-v4/ui/card"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

export function FeedbackWidget() {
  const [vote, setVote] = React.useState<"up" | "down" | null>(null)
  const [comment, setComment] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Was this page helpful?</CardTitle>
        <CardDescription className="text-xs">
          Let us know if you found what you were looking for.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        {submitted ? (
          <p className="text-sm font-medium text-muted-foreground">
            Thank you for your feedback!
          </p>
        ) : vote === null ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setVote("up")}
              aria-label="Yes, this page was helpful"
            >
              <ThumbsUp className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setVote("down")}
              aria-label="No, this page was not helpful"
            >
              <ThumbsDown className="size-4" />
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>You voted {vote === "up" ? "helpful" : "not helpful"}.</span>
              <Button
                type="button"
                variant="link"
                size="xs"
                className="h-auto p-0"
                onClick={() => {
                  setVote(null)
                  setComment("")
                }}
              >
                Change
              </Button>
            </div>
            <Textarea
              placeholder="Optional comments..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none text-xs"
              rows={3}
            />
            <Button type="submit" size="sm" className="w-full">
              Send feedback
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
