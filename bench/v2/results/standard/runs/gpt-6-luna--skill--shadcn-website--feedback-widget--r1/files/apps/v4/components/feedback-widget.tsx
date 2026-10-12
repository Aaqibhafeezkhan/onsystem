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

type Vote = "helpful" | "not-helpful"

export function FeedbackWidget() {
  const [vote, setVote] = React.useState<Vote | null>(null)
  const [submitted, setSubmitted] = React.useState(false)
  const commentId = React.useId()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <Card className="w-full max-w-sm gap-4 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-base">Was this page helpful?</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        {submitted ? (
          <p className="text-sm text-muted-foreground" role="status">
            Thanks for your feedback!
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={vote === "helpful" ? "secondary" : "outline"}
                size="icon-sm"
                aria-label="Yes, this page was helpful"
                aria-pressed={vote === "helpful"}
                onClick={() => setVote("helpful")}
              >
                <ThumbsUpIcon />
              </Button>
              <Button
                type="button"
                variant={vote === "not-helpful" ? "secondary" : "outline"}
                size="icon-sm"
                aria-label="No, this page was not helpful"
                aria-pressed={vote === "not-helpful"}
                onClick={() => setVote("not-helpful")}
              >
                <ThumbsDownIcon />
              </Button>
            </div>
            {vote && (
              <div className="grid gap-3">
                <label htmlFor={commentId} className="sr-only">
                  Optional comments
                </label>
                <Textarea
                  id={commentId}
                  name="comment"
                  placeholder="Share an optional comment..."
                  className="min-h-20"
                />
                <Button type="submit" size="sm" className="w-fit">
                  Send feedback
                </Button>
              </div>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  )
}
