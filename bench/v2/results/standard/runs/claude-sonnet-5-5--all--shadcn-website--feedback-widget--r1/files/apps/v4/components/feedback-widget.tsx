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
  const [comment, setComment] = React.useState("")
  const [sent, setSent] = React.useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSent(true)
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-sm">Was this page helpful?</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={vote === "up" ? "secondary" : "outline"}
              size="icon-sm"
              aria-label="Yes, this page was helpful"
              aria-pressed={vote === "up"}
              disabled={sent}
              onClick={() => setVote("up")}
            >
              <ThumbsUpIcon />
            </Button>
            <Button
              type="button"
              variant={vote === "down" ? "secondary" : "outline"}
              size="icon-sm"
              aria-label="No, this page was not helpful"
              aria-pressed={vote === "down"}
              disabled={sent}
              onClick={() => setVote("down")}
            >
              <ThumbsDownIcon />
            </Button>
          </div>
        </div>
      </CardHeader>
      {sent ? (
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Thanks for your feedback!
          </p>
        </CardContent>
      ) : vote ? (
        <CardContent>
          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            <Textarea
              aria-label="Optional comments"
              placeholder="Any additional comments? (optional)"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
            <Button type="submit" size="sm" className="self-end">
              Send feedback
            </Button>
          </form>
        </CardContent>
      ) : null}
    </Card>
  )
}
