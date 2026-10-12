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

type Vote = "up" | "down"

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
        <CardTitle>Was this page helpful?</CardTitle>
      </CardHeader>
      <CardContent>
        {submitted ? (
          <p className="text-sm text-muted-foreground" role="status">
            Thanks for your feedback!
          </p>
        ) : (
          <div className="grid gap-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={vote === "up" ? "secondary" : "outline"}
                size="icon-sm"
                aria-label="Thumbs up"
                aria-pressed={vote === "up"}
                onClick={() => setVote("up")}
              >
                <ThumbsUpIcon aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant={vote === "down" ? "secondary" : "outline"}
                size="icon-sm"
                aria-label="Thumbs down"
                aria-pressed={vote === "down"}
                onClick={() => setVote("down")}
              >
                <ThumbsDownIcon aria-hidden="true" />
              </Button>
            </div>
            {vote && (
              <form className="grid gap-3" onSubmit={handleSubmit}>
                <Textarea
                  aria-label="Optional comments"
                  placeholder="Tell us more (optional)"
                  rows={3}
                />
                <Button type="submit" size="sm" className="w-fit">
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
