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

export function FeedbackWidget() {
  const [vote, setVote] = React.useState<"up" | "down" | null>(null)
  const [comment, setComment] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          Was this page helpful?
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!submitted ? (
          <>
            <div className="flex items-center gap-2">
              <Button
                variant={vote === "up" ? "default" : "outline"}
                size="icon"
                aria-label="Thumbs up"
                onClick={() => setVote("up")}
              >
                <ThumbsUpIcon className="size-4" />
              </Button>
              <Button
                variant={vote === "down" ? "default" : "outline"}
                size="icon"
                aria-label="Thumbs down"
                onClick={() => setVote("down")}
              >
                <ThumbsDownIcon className="size-4" />
              </Button>
            </div>

            {vote !== null && (
              <div className="flex flex-col gap-3">
                <Textarea
                  placeholder="Any additional feedback? (optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-20 text-sm"
                />
                <Button
                  size="sm"
                  className="w-fit"
                  onClick={() => setSubmitted(true)}
                >
                  Send feedback
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-muted-foreground">
            Thank you for your feedback!
          </div>
        )}
      </CardContent>
    </Card>
  )
}
