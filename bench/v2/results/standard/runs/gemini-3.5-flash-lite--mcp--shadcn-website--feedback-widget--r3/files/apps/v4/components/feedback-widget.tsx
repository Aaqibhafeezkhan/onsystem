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
        <CardContent className="p-6 text-center">
          <p className="text-sm font-medium text-foreground">
            Thank you for your feedback!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-sm font-medium">
          Was this page helpful?
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant={vote === "up" ? "default" : "outline"}
            size="icon"
            aria-label="Thumbs up"
            onClick={() => handleVote("up")}
          >
            <ThumbsUpIcon />
          </Button>
          <Button
            variant={vote === "down" ? "default" : "outline"}
            size="icon"
            aria-label="Thumbs down"
            onClick={() => handleVote("down")}
          >
            <ThumbsDownIcon />
          </Button>
        </div>
      </CardHeader>
      {vote !== null && (
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Textarea
              placeholder="Optional comments..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none"
              rows={3}
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
