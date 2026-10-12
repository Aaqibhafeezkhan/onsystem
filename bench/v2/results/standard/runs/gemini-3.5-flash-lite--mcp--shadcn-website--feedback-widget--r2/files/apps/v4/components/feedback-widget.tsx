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
import { Field, FieldLabel } from "@/registry/new-york-v4/ui/field"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

export function FeedbackWidget() {
  const [vote, setVote] = React.useState<"up" | "down" | null>(null)
  const [submitted, setSubmitted] = React.useState(false)
  const [comment, setComment] = React.useState("")

  const handleVote = (value: "up" | "down") => {
    setVote(value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="py-4">
          <CardTitle className="text-base font-medium">Thank you!</CardTitle>
          <CardDescription>Your feedback has been received.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-3 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Was this page helpful?
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant={vote === "up" ? "default" : "outline"}
              size="icon-sm"
              onClick={() => handleVote("up")}
              aria-label="Yes, this page was helpful"
            >
              <ThumbsUpIcon />
            </Button>
            <Button
              variant={vote === "down" ? "default" : "outline"}
              size="icon-sm"
              onClick={() => handleVote("down")}
              aria-label="No, this page was not helpful"
            >
              <ThumbsDownIcon />
            </Button>
          </div>
        </div>
      </CardHeader>
      {vote !== null && (
        <CardContent className="pt-0 pb-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Field>
              <FieldLabel
                htmlFor="feedback-comment"
                className="text-xs text-muted-foreground"
              >
                Optional comments
              </FieldLabel>
              <Textarea
                id="feedback-comment"
                placeholder="How can we improve this page?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-20 text-sm resize-none"
              />
            </Field>
            <div className="flex justify-end">
              <Button type="submit" size="sm">
                Send feedback
              </Button>
            </div>
          </form>
        </CardContent>
      )}
    </Card>
  )
}
