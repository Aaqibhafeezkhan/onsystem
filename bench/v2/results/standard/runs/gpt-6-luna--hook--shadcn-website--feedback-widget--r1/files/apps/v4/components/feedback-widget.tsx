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
import { Label } from "@/registry/new-york-v4/ui/label"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

type Vote = "yes" | "no"

export function FeedbackWidget() {
  const [vote, setVote] = React.useState<Vote | null>(null)
  const [submitted, setSubmitted] = React.useState(false)
  const textareaId = React.useId()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Was this page helpful?</CardTitle>
        <CardDescription>
          {submitted
            ? "Thanks for sharing your feedback."
            : vote
              ? "Anything else you'd like us to know?"
              : "Let us know what you think."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submitted ? (
          <p className="text-sm text-muted-foreground" role="status">
            Your feedback helps us improve.
          </p>
        ) : vote ? (
          <form onSubmit={handleSubmit} className="grid gap-3">
            <Label htmlFor={textareaId} className="sr-only">
              Optional comments
            </Label>
            <Textarea
              id={textareaId}
              name="comments"
              placeholder="Share an optional comment..."
              className="min-h-20 resize-y"
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm">
                Send feedback
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex gap-2">
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              aria-label="Yes, this page was helpful"
              onClick={() => setVote("yes")}
            >
              <ThumbsUp aria-hidden="true" />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              aria-label="No, this page was not helpful"
              onClick={() => setVote("no")}
            >
              <ThumbsDown aria-hidden="true" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
