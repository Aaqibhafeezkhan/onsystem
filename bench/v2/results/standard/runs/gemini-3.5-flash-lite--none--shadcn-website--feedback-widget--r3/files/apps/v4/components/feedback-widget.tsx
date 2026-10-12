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

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Was this page helpful?</CardTitle>
          <CardDescription>Thank you for your feedback!</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle>Was this page helpful?</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={vote === "up" ? "default" : "outline"}
              size="icon"
              className="size-8"
              onClick={() => setVote("up")}
              aria-label="Thumbs up"
            >
              <ThumbsUp className="size-4" />
            </Button>
            <Button
              variant={vote === "down" ? "default" : "outline"}
              size="icon"
              className="size-8"
              onClick={() => setVote("down")}
              aria-label="Thumbs down"
            >
              <ThumbsDown className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {vote !== null && (
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Textarea
              placeholder="Optional comments..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-20"
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm">
                Send feedback
              </Button>
            </div>
          </form>
        </CardContent>
      )}
    </Card>
  )
}
