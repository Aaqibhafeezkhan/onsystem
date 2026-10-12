"use client"

import * as React from "react"
import { IconThumbDown, IconThumbUp } from "@tabler/icons-react"

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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <Card className="w-full max-w-sm gap-4 py-4">
      <CardHeader className="flex items-center justify-between gap-2">
        <CardTitle>
          {submitted ? "Thanks for your feedback!" : "Was this page helpful?"}
        </CardTitle>
        {!submitted && (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant={vote === "up" ? "secondary" : "ghost"}
              size="icon-sm"
              aria-label="Yes, this page was helpful"
              aria-pressed={vote === "up"}
              onClick={() => setVote("up")}
            >
              <IconThumbUp />
            </Button>
            <Button
              type="button"
              variant={vote === "down" ? "secondary" : "ghost"}
              size="icon-sm"
              aria-label="No, this page was not helpful"
              aria-pressed={vote === "down"}
              onClick={() => setVote("down")}
            >
              <IconThumbDown />
            </Button>
          </div>
        )}
      </CardHeader>
      {vote && !submitted && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <CardContent>
            <Textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Any additional comments? (optional)"
              aria-label="Additional comments"
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" size="sm">
              Send feedback
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  )
}
