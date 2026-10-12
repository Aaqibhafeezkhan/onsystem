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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">
          Was this page helpful?
        </CardTitle>
      </CardHeader>
      <CardContent>
        {submitted ? (
          <p className="text-sm text-muted-foreground">
            Thank you for your feedback!
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant={vote === "up" ? "default" : "outline"}
                size="icon"
                aria-label="Helpful"
                onClick={() => setVote("up")}
              >
                <ThumbsUpIcon className="size-4" />
              </Button>
              <Button
                variant={vote === "down" ? "default" : "outline"}
                size="icon"
                aria-label="Not helpful"
                onClick={() => setVote("down")}
              >
                <ThumbsDownIcon className="size-4" />
              </Button>
            </div>

            {vote !== null && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <Textarea
                  placeholder="Optional comments..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="resize-none min-h-[80px]"
                />
                <div className="flex justify-end">
                  <Button type="submit" size="sm">
                    Send feedback
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
