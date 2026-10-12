"use client"

import { useId, useState } from "react"
import type { FormEvent } from "react"
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
  const commentId = useId()
  const [vote, setVote] = useState<Vote | null>(null)
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <Card className="w-full max-w-sm gap-4 py-4">
      <CardHeader className="grid-cols-[1fr_auto] items-center gap-4">
        <CardTitle className="text-base">Was this page helpful?</CardTitle>
        <div className="flex gap-2">
          <Button
            aria-label="Yes, this page was helpful"
            aria-pressed={vote === "helpful"}
            onClick={() => {
              setVote("helpful")
              setSubmitted(false)
            }}
            size="icon-sm"
            type="button"
            variant={vote === "helpful" ? "secondary" : "outline"}
          >
            <ThumbsUpIcon aria-hidden="true" />
          </Button>
          <Button
            aria-label="No, this page was not helpful"
            aria-pressed={vote === "not-helpful"}
            onClick={() => {
              setVote("not-helpful")
              setSubmitted(false)
            }}
            size="icon-sm"
            type="button"
            variant={vote === "not-helpful" ? "secondary" : "outline"}
          >
            <ThumbsDownIcon aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>
      {vote && (
        <CardContent>
          {submitted ? (
            <p className="text-sm text-muted-foreground" role="status">
              Thanks for your feedback!
            </p>
          ) : (
            <form className="grid gap-3" onSubmit={handleSubmit}>
              <Label htmlFor={commentId}>
                Tell us more <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id={commentId}
                name="comment"
                placeholder="Share any thoughts..."
                rows={3}
              />
              <Button className="w-fit" size="sm" type="submit">
                Send feedback
              </Button>
            </form>
          )}
        </CardContent>
      )}
    </Card>
  )
}
