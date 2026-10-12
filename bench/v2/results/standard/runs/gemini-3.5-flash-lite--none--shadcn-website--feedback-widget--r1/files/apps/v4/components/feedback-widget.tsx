"use client"

import * as React from "react"
import { IconThumbDown, IconThumbUp } from "@tabler/icons-react"
import { cn } from "cn"

import { Button } from "@/registry/new-york-v4/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/registry/new-york-v4/ui/card"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

export function FeedbackWidget({
  className,
  ...props
}: React.ComponentProps<typeof Card>) {
  const [vote, setVote] = React.useState<"up" | "down" | null>(null)
  const [comment, setComment] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <Card className={cn("w-full max-w-sm", className)} {...props}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 py-4">
        <CardTitle className="text-sm font-medium">
          Was this page helpful?
        </CardTitle>
        <div className="flex items-center gap-1.5">
          <Button
            variant={vote === "up" ? "default" : "outline"}
            size="icon"
            className="size-8"
            aria-label="Thumbs up"
            onClick={() => setVote("up")}
          >
            <IconThumbUp className="size-4" />
          </Button>
          <Button
            variant={vote === "down" ? "default" : "outline"}
            size="icon"
            className="size-8"
            aria-label="Thumbs down"
            onClick={() => setVote("down")}
          >
            <IconThumbDown className="size-4" />
          </Button>
        </div>
      </CardHeader>
      {vote && !submitted && (
        <CardContent className="pt-0 pb-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Textarea
              placeholder="Optional comments..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-20 resize-none text-sm"
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm">
                Send feedback
              </Button>
            </div>
          </form>
        </CardContent>
      )}
      {submitted && (
        <CardContent className="pt-0 pb-4 text-sm text-muted-foreground">
          Thank you for your feedback!
        </CardContent>
      )}
    </Card>
  )
}
