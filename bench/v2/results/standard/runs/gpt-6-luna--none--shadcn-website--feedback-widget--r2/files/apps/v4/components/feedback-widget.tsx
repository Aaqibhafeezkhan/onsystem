"use client"

import { useId, useState, type FormEvent } from "react"
import { ThumbsDown, ThumbsUp } from "lucide-react"

import { Button } from "@/registry/new-york-v4/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/registry/new-york-v4/ui/card"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

export function FeedbackWidget() {
  const id = useId()
  const [vote, setVote] = useState<"yes" | "no" | null>(null)
  const [sent, setSent] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSent(true)
  }

  return (
    <Card className="w-full max-w-sm gap-4 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-medium">
          Was this page helpful?
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 px-4">
        <div className="flex gap-2">
          <Button
            type="button"
            variant={vote === "yes" ? "secondary" : "outline"}
            size="icon-sm"
            aria-label="Yes, this page was helpful"
            aria-pressed={vote === "yes"}
            onClick={() => {
              setVote("yes")
              setSent(false)
            }}
          >
            <ThumbsUp aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant={vote === "no" ? "secondary" : "outline"}
            size="icon-sm"
            aria-label="No, this page was not helpful"
            aria-pressed={vote === "no"}
            onClick={() => {
              setVote("no")
              setSent(false)
            }}
          >
            <ThumbsDown aria-hidden="true" />
          </Button>
        </div>

        {vote &&
          (sent ? (
            <p className="text-sm text-muted-foreground" role="status">
              Thanks for your feedback!
            </p>
          ) : (
            <form className="grid gap-3" onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor={`feedback-comments-${id}`}>
                Optional comments
              </label>
              <Textarea
                id={`feedback-comments-${id}`}
                placeholder="Tell us more (optional)"
                className="min-h-20 resize-y"
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
