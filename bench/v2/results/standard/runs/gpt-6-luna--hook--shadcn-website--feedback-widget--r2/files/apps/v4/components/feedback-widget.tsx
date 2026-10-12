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

type Vote = "helpful" | "not-helpful"

export function FeedbackWidget() {
  const [vote, setVote] = useState<Vote | null>(null)
  const [sent, setSent] = useState(false)

  return (
    <Card className="w-full max-w-md gap-4 py-4">
      <CardHeader className="flex flex-row items-center justify-between gap-4 px-4 py-0">
        <CardTitle className="text-sm font-medium leading-normal">
          Was this page helpful?
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={vote === "helpful" ? "secondary" : "outline"}
            size="icon-sm"
            aria-label="Yes, this page was helpful"
            aria-pressed={vote === "helpful"}
            onClick={() => {
              setVote("helpful")
              setSent(false)
            }}
          >
            <ThumbsUpIcon aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant={vote === "not-helpful" ? "secondary" : "outline"}
            size="icon-sm"
            aria-label="No, this page was helpful"
            aria-pressed={vote === "not-helpful"}
            onClick={() => {
              setVote("not-helpful")
              setSent(false)
            }}
          >
            <ThumbsDownIcon aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>
      {vote && (
        <CardContent className="px-4">
          {sent ? (
            <p className="text-sm text-muted-foreground" role="status">
              Thanks for your feedback!
            </p>
          ) : (
            <form
              className="grid gap-3"
              onSubmit={(event) => {
                event.preventDefault()
                setSent(true)
              }}
            >
              <Textarea
                aria-label="Optional comments"
                placeholder="Tell us more (optional)"
                className="min-h-20"
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm">
                  Send feedback
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      )}
    </Card>
  )
}
