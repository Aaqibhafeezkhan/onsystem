"use client"

import * as React from "react"
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Card, CardContent } from "@/registry/new-york-v4/ui/card"
import { Label } from "@/registry/new-york-v4/ui/label"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

type Vote = "up" | "down"

export function FeedbackWidget() {
  const [vote, setVote] = React.useState<Vote | null>(null)
  const [comment, setComment] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium">Was this page helpful?</p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={vote === "up" ? "secondary" : "ghost"}
              size="icon-sm"
              aria-label="Yes, this page was helpful"
              aria-pressed={vote === "up"}
              onClick={() => {
                setVote("up")
                setSubmitted(false)
              }}
            >
              <ThumbsUpIcon />
            </Button>
            <Button
              type="button"
              variant={vote === "down" ? "secondary" : "ghost"}
              size="icon-sm"
              aria-label="No, this page was not helpful"
              aria-pressed={vote === "down"}
              onClick={() => {
                setVote("down")
                setSubmitted(false)
              }}
            >
              <ThumbsDownIcon />
            </Button>
          </div>
        </div>

        {vote !== null &&
          (submitted ? (
            <p className="text-sm text-muted-foreground">
              Thanks for your feedback.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="feedback-comment">
                  Comments (optional)
                </Label>
                <Textarea
                  id="feedback-comment"
                  placeholder="Tell us more about your experience"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                />
              </div>
              <Button type="submit" size="sm" className="self-end">
                Send feedback
              </Button>
            </form>
          ))}
      </CardContent>
    </Card>
  )
}
