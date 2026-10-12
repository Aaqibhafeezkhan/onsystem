"use client"

import * as React from "react"
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/new-york-v4/ui/button"
import { Card, CardContent } from "@/registry/new-york-v4/ui/card"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

type Vote = "up" | "down"

export function FeedbackWidget({ className }: { className?: string }) {
  const [vote, setVote] = React.useState<Vote | null>(null)
  const [comment, setComment] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  return (
    <Card className={cn("w-full max-w-sm py-4", className)}>
      <CardContent className="flex flex-col gap-3 px-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Was this page helpful?</p>
          <div className="flex items-center gap-1">
            <Button
              variant={vote === "up" ? "secondary" : "ghost"}
              size="icon"
              aria-label="Yes, this page was helpful"
              title="Helpful"
              aria-pressed={vote === "up"}
              disabled={submitted}
              onClick={() => setVote("up")}
            >
              <ThumbsUpIcon />
            </Button>
            <Button
              variant={vote === "down" ? "secondary" : "ghost"}
              size="icon"
              aria-label="No, this page was not helpful"
              title="Not helpful"
              aria-pressed={vote === "down"}
              disabled={submitted}
              onClick={() => setVote("down")}
            >
              <ThumbsDownIcon />
            </Button>
          </div>
        </div>
        {submitted ? (
          <p className="text-sm text-muted-foreground">
            Thanks for your feedback!
          </p>
        ) : vote ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              setSubmitted(true)
            }}
          >
            <Textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Any additional comments? (optional)"
              aria-label="Comments"
            />
            <Button type="submit" size="sm" className="self-end">
              Send feedback
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  )
}
