"use client"

import * as React from "react"
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react"

import { Button } from "@/registry/new-york-v4/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/registry/new-york-v4/ui/card"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

type Vote = "helpful" | "not-helpful"

export function FeedbackWidget() {
  const [vote, setVote] = React.useState<Vote | null>(null)
  const [submitted, setSubmitted] = React.useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-base">Was this page helpful?</CardTitle>
        {submitted ? (
          <CardDescription>Thanks for your feedback.</CardDescription>
        ) : null}
      </CardHeader>
      {!submitted ? (
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={vote === "helpful" ? "secondary" : "outline"}
              size="icon"
              aria-label="Yes, this page was helpful"
              aria-pressed={vote === "helpful"}
              onClick={() => setVote("helpful")}
            >
              <ThumbsUpIcon />
            </Button>
            <Button
              type="button"
              variant={vote === "not-helpful" ? "secondary" : "outline"}
              size="icon"
              aria-label="No, this page was not helpful"
              aria-pressed={vote === "not-helpful"}
              onClick={() => setVote("not-helpful")}
            >
              <ThumbsDownIcon />
            </Button>
          </div>
          {vote ? (
            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
              <Textarea
                aria-label="Optional comments"
                placeholder="Tell us more (optional)"
                className="resize-none"
                rows={3}
              />
              <Button type="submit" className="self-start">
                Send feedback
              </Button>
            </form>
          ) : null}
        </CardContent>
      ) : null}
    </Card>
  )
}
