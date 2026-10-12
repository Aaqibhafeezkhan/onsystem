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
import { Label } from "@/registry/new-york-v4/ui/label"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

export function FeedbackWidget() {
  const [vote, setVote] = React.useState<"up" | "down" | null>(null)
  const [comment, setComment] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)
  const commentId = React.useId()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <Card className="w-full max-w-sm gap-4 py-5">
      <CardHeader className="gap-1 px-5">
        <CardTitle className="text-base">Was this page helpful?</CardTitle>
        <CardDescription>
          {submitted ? "Thanks for your feedback." : "Your feedback helps us improve."}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5">
        {!submitted && (
          <div className="grid gap-3">
            <div className="flex gap-2" role="group" aria-label="Rate this page">
              <Button
                type="button"
                variant={vote === "up" ? "secondary" : "outline"}
                size="icon-sm"
                aria-label="Yes, this page was helpful"
                aria-pressed={vote === "up"}
                onClick={() => setVote("up")}
              >
                <ThumbsUpIcon aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant={vote === "down" ? "secondary" : "outline"}
                size="icon-sm"
                aria-label="No, this page was not helpful"
                aria-pressed={vote === "down"}
                onClick={() => setVote("down")}
              >
                <ThumbsDownIcon aria-hidden="true" />
              </Button>
            </div>
            {vote && (
              <form onSubmit={handleSubmit} className="grid gap-3">
                <Label htmlFor={commentId} className="sr-only">
                  Optional comments
                </Label>
                <Textarea
                  id={commentId}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="What could we improve? (optional)"
                  className="min-h-20 resize-y"
                />
                <Button type="submit" size="sm" className="justify-self-start">
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
