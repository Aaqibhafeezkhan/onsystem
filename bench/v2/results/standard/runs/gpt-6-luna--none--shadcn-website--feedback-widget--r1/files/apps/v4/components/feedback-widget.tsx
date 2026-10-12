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
  const [vote, setVote] = React.useState<"up" | "down" | null>(null)
  const [submitted, setSubmitted] = React.useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <Card className="w-full max-w-sm gap-4 py-5">
      <CardHeader className="px-5">
        <CardTitle className="text-sm">Was this page helpful?</CardTitle>
      </CardHeader>
      <CardContent className="px-5">
        {submitted ? (
          <p className="text-sm text-muted-foreground" role="status">
            Thanks for your feedback!
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2" role="group" aria-label="Rate this page">
              <Button
                type="button"
                variant={vote === "up" ? "secondary" : "outline"}
                size="icon-sm"
                aria-label="Yes, this page was helpful"
                aria-pressed={vote === "up"}
                onClick={() => setVote("up")}
              >
                <ThumbsUp aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant={vote === "down" ? "secondary" : "outline"}
                size="icon-sm"
                aria-label="No, this page was not helpful"
                aria-pressed={vote === "down"}
                onClick={() => setVote("down")}
              >
                <ThumbsDown aria-hidden="true" />
              </Button>
            </div>
            {vote && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <label htmlFor="feedback-comment" className="sr-only">
                  Optional comments
                </label>
                <Textarea
                  id="feedback-comment"
                  name="comment"
                  placeholder="Anything you'd like us to know? (optional)"
                  className="min-h-20 resize-y text-sm"
                />
                <Button type="submit" size="sm" className="self-start">
                  Send feedback
                </Button>
              </form>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
