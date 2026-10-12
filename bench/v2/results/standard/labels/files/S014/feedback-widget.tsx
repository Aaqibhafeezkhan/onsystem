"use client"

import { useState } from "react"
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react"

import { Button } from "@/registry/new-york-v4/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/registry/new-york-v4/ui/card"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

type Vote = "helpful" | "not-helpful"

export function FeedbackWidget() {
  const [vote, setVote] = useState<Vote | null>(null)
  const [comment, setComment] = useState("")
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <Card className="w-full max-w-sm gap-4 py-5">
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <CardTitle className="text-base">Was this page helpful?</CardTitle>
          <CardDescription>
            Your feedback helps us improve this page.
          </CardDescription>
        </div>

        {submitted ? (
          <p className="text-sm text-muted-foreground" role="status">
            Thanks for your feedback!
          </p>
        ) : (
          <>
            <div className="flex gap-2">
              <Button
                aria-label="Yes, this page was helpful"
                aria-pressed={vote === "helpful"}
                onClick={() => setVote("helpful")}
                size="icon-sm"
                type="button"
                variant={vote === "helpful" ? "secondary" : "outline"}
              >
                <ThumbsUpIcon aria-hidden="true" />
              </Button>
              <Button
                aria-label="No, this page was not helpful"
                aria-pressed={vote === "not-helpful"}
                onClick={() => setVote("not-helpful")}
                size="icon-sm"
                type="button"
                variant={vote === "not-helpful" ? "secondary" : "outline"}
              >
                <ThumbsDownIcon aria-hidden="true" />
              </Button>
            </div>

            {vote && (
              <form className="space-y-3" onSubmit={handleSubmit}>
                <Textarea
                  aria-label="Optional comments"
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Tell us a little more (optional)"
                  rows={3}
                  value={comment}
                />
                <Button size="sm" type="submit">
                  Send feedback
                </Button>
              </form>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
