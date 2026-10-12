"use client"

import * as React from "react"
import { ThumbsDown, ThumbsUp } from "lucide-react"

import { Button } from "@/registry/new-york-v4/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
        <CardTitle className="text-base font-medium">
          Was this page helpful?
        </CardTitle>
      </CardHeader>
      <CardContent>
        {submitted ? (
          <p className="text-sm text-muted-foreground">
            Thank you for your feedback!
          </p>
        ) : vote === null ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setVote("up")}
              aria-label="Yes, this page is helpful"
            >
              <ThumbsUp className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setVote("down")}
              aria-label="No, this page is not helpful"
            >
              <ThumbsDown className="size-4" />
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={vote === "up" ? "default" : "outline"}
                size="icon"
                onClick={() => setVote("up")}
                aria-label="Yes, this page is helpful"
              >
                <ThumbsUp className="size-4" />
              </Button>
              <Button
                type="button"
                variant={vote === "down" ? "default" : "outline"}
                size="icon"
                onClick={() => setVote("down")}
                aria-label="No, this page is not helpful"
              >
                <ThumbsDown className="size-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {vote === "up" ? "Helpful" : "Not helpful"}
              </span>
            </div>
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
        )}
      </CardContent>
    </Card>
  )
}
