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

type Vote = "yes" | "no"

export function FeedbackWidget() {
  const [vote, setVote] = React.useState<Vote | null>(null)
  const [comment, setComment] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  function submitFeedback(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="flex-row items-center justify-between gap-4">
        <CardTitle className="text-base">Was this page helpful?</CardTitle>
        <div className="flex shrink-0 gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Yes, this page was helpful"
            aria-pressed={vote === "yes"}
            className={vote === "yes" ? "bg-accent text-accent-foreground" : undefined}
            onClick={() => {
              setVote("yes")
              setSubmitted(false)
            }}
          >
            <ThumbsUpIcon aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="No, this page was not helpful"
            aria-pressed={vote === "no"}
            className={vote === "no" ? "bg-accent text-accent-foreground" : undefined}
            onClick={() => {
              setVote("no")
              setSubmitted(false)
            }}
          >
            <ThumbsDownIcon aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>
      {vote && (
        <CardContent>
          {submitted ? (
            <p className="text-sm text-muted-foreground" role="status">
              Thanks for your feedback!
            </p>
          ) : (
            <form className="grid gap-3" onSubmit={submitFeedback}>
              <Textarea
                aria-label="Optional comments"
                placeholder="Tell us a little more (optional)"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
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
      )}
    </Card>
  )
}
