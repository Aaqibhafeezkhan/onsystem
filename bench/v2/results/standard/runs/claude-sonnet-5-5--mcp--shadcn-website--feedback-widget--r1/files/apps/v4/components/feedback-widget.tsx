"use client"

import * as React from "react"
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react"

import { Button } from "@/registry/new-york-v4/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/registry/new-york-v4/ui/card"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

type Vote = "up" | "down"

export function FeedbackWidget() {
  const [vote, setVote] = React.useState<Vote | null>(null)
  const [comment, setComment] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-sm">Was this page helpful?</CardTitle>
        {!submitted && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant={vote === "up" ? "default" : "outline"}
              size="icon"
              aria-label="Yes, this page was helpful"
              aria-pressed={vote === "up"}
              onClick={() => setVote("up")}
            >
              <ThumbsUpIcon />
            </Button>
            <Button
              type="button"
              variant={vote === "down" ? "default" : "outline"}
              size="icon"
              aria-label="No, this page was not helpful"
              aria-pressed={vote === "down"}
              onClick={() => setVote("down")}
            >
              <ThumbsDownIcon />
            </Button>
          </div>
        )}
      </CardHeader>
      {submitted ? (
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Thanks for your feedback!
          </p>
        </CardContent>
      ) : (
        vote && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <CardContent>
              <Textarea
                aria-label="Additional comments (optional)"
                placeholder="Any additional comments? (optional)"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" size="sm">
                Send feedback
              </Button>
            </CardFooter>
          </form>
        )
      )}
    </Card>
  )
}
