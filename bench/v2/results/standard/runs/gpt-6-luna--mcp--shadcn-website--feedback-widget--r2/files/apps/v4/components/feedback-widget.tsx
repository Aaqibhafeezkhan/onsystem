"use client"

import { useState } from "react"
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
  const [vote, setVote] = useState<Vote | null>(null)
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">
          Was this page helpful?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {submitted ? (
          <p className="text-sm text-muted-foreground" role="status">
            Thanks for your feedback.
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
                  placeholder="Tell us more (optional)"
                  rows={3}
                />
                <Button className="w-full" type="submit">
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
