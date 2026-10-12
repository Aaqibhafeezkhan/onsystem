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
  const [comment, setComment] = React.useState("")
  const [sent, setSent] = React.useState(false)

  function handleVote(nextVote: Vote) {
    setVote(nextVote)
    setSent(false)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSent(true)
  }

  return (
    <Card className="w-full max-w-sm gap-4 py-5">
      <CardHeader className="grid-cols-[1fr_auto] items-center gap-3 px-5">
        <CardTitle className="text-sm font-medium">
          Was this page helpful?
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Yes, this page was helpful"
            aria-pressed={vote === "helpful"}
            className={vote === "helpful" ? "bg-accent text-accent-foreground" : ""}
            onClick={() => handleVote("helpful")}
          >
            <ThumbsUpIcon aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="No, this page was not helpful"
            aria-pressed={vote === "not-helpful"}
            className={vote === "not-helpful" ? "bg-accent text-accent-foreground" : ""}
            onClick={() => handleVote("not-helpful")}
          >
            <ThumbsDownIcon aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>
      {vote && (
        <CardContent>
          {sent ? (
            <p role="status" className="text-sm text-muted-foreground">
              Thanks for your feedback.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-3">
              <label htmlFor="feedback-comment" className="sr-only">
                Additional comments (optional)
              </label>
              <Textarea
                id="feedback-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Tell us more (optional)"
                className="min-h-20 resize-y"
              />
              <Button type="submit" size="sm" className="justify-self-end">
                Send feedback
              </Button>
            </form>
          )}
        </CardContent>
      )}
    </Card>
  )
}
