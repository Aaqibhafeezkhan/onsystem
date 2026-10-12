"use client"

import * as React from "react"
import { ThumbsDownIcon, ThumbsUpIcon } from "lucide-react"

import { Button } from "@/registry/new-york-v4/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardTitle,
} from "@/registry/new-york-v4/ui/card"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

type Vote = "up" | "down"

export function FeedbackWidget() {
  const [vote, setVote] = React.useState<Vote | null>(null)
  const [comment, setComment] = React.useState("")
  const [sent, setSent] = React.useState(false)

  function handleSend() {
    // Comments are optional; the vote alone is enough to send.
    setSent(true)
  }

  return (
    <Card className="w-full max-w-sm gap-4 py-4">
      <CardContent className="flex flex-col gap-4">
        <CardTitle className="text-sm">Was this page helpful?</CardTitle>

        {sent ? (
          <p className="text-sm text-muted-foreground">
            Thanks for your feedback!
          </p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={vote === "up" ? "secondary" : "outline"}
                size="icon-sm"
                aria-label="Yes, this page was helpful"
                aria-pressed={vote === "up"}
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
                onClick={() => setVote("down")}
              >
                <ThumbsDownIcon />
              </Button>
            </div>

            {vote !== null && (
              <div className="flex flex-col gap-3">
                <Textarea
                  aria-label="Additional comments (optional)"
                  placeholder="Tell us more (optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            )}
          </>
        )}
      </CardContent>

      {vote !== null && !sent && (
        <CardFooter className="justify-end">
          <Button type="button" size="sm" onClick={handleSend}>
            Send feedback
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
