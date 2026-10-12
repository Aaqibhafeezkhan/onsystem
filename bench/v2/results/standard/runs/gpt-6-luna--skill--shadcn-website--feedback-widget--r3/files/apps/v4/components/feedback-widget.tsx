"use client"

import { useState } from "react"
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react"

import { Button } from "@/registry/new-york-v4/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/registry/new-york-v4/ui/card"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

export function FeedbackWidget() {
  const [vote, setVote] = useState<"up" | "down" | null>(null)
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <Card className="w-full max-w-sm gap-4 py-5">
      <CardHeader className="px-5">
        <CardTitle className="text-base">Was this page helpful?</CardTitle>
      </CardHeader>
      <CardContent className="px-5">
        {submitted ? (
          <p className="text-sm text-muted-foreground" role="status">
            Thanks for your feedback!
          </p>
        ) : (
          <div className="grid gap-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Yes, this page was helpful"
                aria-pressed={vote === "up"}
                className={vote === "up" ? "bg-accent text-accent-foreground" : ""}
                onClick={() => setVote("up")}
              >
                <ThumbsUpIcon />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="No, this page was not helpful"
                aria-pressed={vote === "down"}
                className={vote === "down" ? "bg-accent text-accent-foreground" : ""}
                onClick={() => setVote("down")}
              >
                <ThumbsDownIcon />
              </Button>
            </div>
            {vote && (
              <form className="grid gap-3" onSubmit={handleSubmit}>
                <Textarea
                  aria-label="Optional feedback comments"
                  placeholder="Any comments? (optional)"
                  className="min-h-20 resize-y"
                />
                <Button type="submit" size="sm" className="w-fit">
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
