"use client"

import * as React from "react"
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
  const [vote, setVote] = React.useState<"up" | "down" | null>(null)
  const [comment, setComment] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          Was this page helpful?
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {submitted ? (
          <p className="text-sm text-muted-foreground">
            Thank you for your feedback!
          </p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Button
                variant={vote === "up" ? "default" : "outline"}
                size="icon"
                className="size-8"
                onClick={() => setVote("up")}
                aria-label="Helpful"
              >
                <ThumbsUp className="size-4" />
              </Button>
              <Button
                variant={vote === "down" ? "default" : "outline"}
                size="icon"
                className="size-8"
                onClick={() => setVote("down")}
                aria-label="Not helpful"
              >
                <ThumbsDown className="size-4" />
              </Button>
            </div>

            {vote !== null && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <Textarea
                  placeholder="Optional comments..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-20 text-sm resize-none"
                  aria-label="Optional comments"
                />
                <div className="flex justify-end">
                  <Button type="submit" size="sm">
                    Send feedback
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
