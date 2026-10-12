"use client"

import * as React from "react"
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react"
import { cn } from "cn"

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

export function FeedbackWidget({
  className,
  onFeedbackSubmit,
  ...props
}: React.ComponentProps<typeof Card> & {
  onFeedbackSubmit?: (vote: "up" | "down", comment?: string) => void
}) {
  const [vote, setVote] = React.useState<"up" | "down" | null>(null)
  const [comment, setComment] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (vote) {
      onFeedbackSubmit?.(vote, comment)
    }
  }

  if (submitted) {
    return (
      <Card className={cn("w-full max-w-md", className)} {...props}>
        <CardContent className="pt-6">
          <p className="text-sm font-medium text-card-foreground">
            Thank you for your feedback!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("w-full max-w-md", className)} {...props}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">
          Was this page helpful?
        </CardTitle>
        <CardDescription>
          {!vote
            ? "Let us know what you think."
            : "Thanks for your vote! Add optional comments below."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!vote ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Yes, this page is helpful"
              onClick={() => setVote("up")}
            >
              <ThumbsUpIcon className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="No, this page is not helpful"
              onClick={() => setVote("down")}
            >
              <ThumbsDownIcon className="size-4" />
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="feedback-comment" className="sr-only">
                Optional comments
              </FieldLabel>
              <Textarea
                id="feedback-comment"
                placeholder="Any optional comments or details?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </Field>
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setVote(null)
                  setComment("")
                }}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Send feedback
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
