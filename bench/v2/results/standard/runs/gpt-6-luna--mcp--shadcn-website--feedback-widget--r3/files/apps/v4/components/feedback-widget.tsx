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
import { Label } from "@/registry/new-york-v4/ui/label"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

type Vote = "helpful" | "not-helpful"

export function FeedbackWidget() {
  const [vote, setVote] = React.useState<Vote | null>(null)
  const [comment, setComment] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <Card className="w-full max-w-sm gap-4 py-4">
      <CardHeader className="gap-1 pb-0">
        <CardTitle className="text-base">Was this page helpful?</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex gap-2" role="group" aria-label="Rate this page">
          <Button
            type="button"
            variant={vote === "helpful" ? "secondary" : "outline"}
            size="icon-sm"
            aria-label="Yes, this page was helpful"
            aria-pressed={vote === "helpful"}
            onClick={() => {
              setVote("helpful")
              setSubmitted(false)
            }}
          >
            <ThumbsUpIcon />
          </Button>
          <Button
            type="button"
            variant={vote === "not-helpful" ? "secondary" : "outline"}
            size="icon-sm"
            aria-label="No, this page was not helpful"
            aria-pressed={vote === "not-helpful"}
            onClick={() => {
              setVote("not-helpful")
              setSubmitted(false)
            }}
          >
            <ThumbsDownIcon />
          </Button>
        </div>

        {vote &&
          (submitted ? (
            <p className="text-sm text-muted-foreground" role="status">
              Thanks for your feedback!
            </p>
          ) : (
            <form className="grid gap-3" onSubmit={handleSubmit}>
              <Label
                className="text-sm font-medium"
                htmlFor="feedback-comment"
              >
                Anything else you&apos;d like to share? <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="feedback-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Tell us a little more..."
                rows={3}
              />
              <Button type="submit" size="sm" className="w-fit">
                Send feedback
              </Button>
            </form>
          ))}
      </CardContent>
    </Card>
  )
}
