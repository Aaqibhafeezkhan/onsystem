"use client"

import * as React from "react"
import { IconThumbDown, IconThumbUp } from "@tabler/icons-react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/registry/new-york-v4/ui/card"
import { Field, FieldLabel } from "@/registry/new-york-v4/ui/field"
import { Textarea } from "@/registry/new-york-v4/ui/textarea"

type FeedbackWidgetProps = {
  onSendFeedback?: (feedback: {
    helpful: boolean
    comments: string
  }) => void
}

export function FeedbackWidget({ onSendFeedback }: FeedbackWidgetProps = {}) {
  const id = React.useId()
  const [vote, setVote] = React.useState<boolean | null>(null)
  const [comments, setComments] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (vote === null) return

    onSendFeedback?.({ helpful: vote, comments: comments.trim() })
    setSubmitted(true)
  }

  return (
    <Card className="w-full max-w-sm gap-4 py-4">
      <CardHeader className="px-4">
        <CardTitle id={`${id}-title`} className="text-sm">
          Was this page helpful?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4">
        {submitted ? (
          <p role="status" className="text-sm text-muted-foreground">
            Thanks for your feedback!
          </p>
        ) : (
          <>
            <div
              role="group"
              aria-labelledby={`${id}-title`}
              className="flex gap-2"
            >
              <Button
                type="button"
                variant={vote === true ? "secondary" : "outline"}
                size="icon"
                aria-label="Yes, this page was helpful"
                aria-pressed={vote === true}
                onClick={() => setVote(true)}
              >
                <IconThumbUp aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant={vote === false ? "secondary" : "outline"}
                size="icon"
                aria-label="No, this page was not helpful"
                aria-pressed={vote === false}
                onClick={() => setVote(false)}
              >
                <IconThumbDown aria-hidden="true" />
              </Button>
            </div>
            {vote !== null && (
              <form onSubmit={handleSubmit} className="space-y-3">
                <Field>
                  <FieldLabel htmlFor={`${id}-comments`}>
                    Comments (optional)
                  </FieldLabel>
                  <Textarea
                    id={`${id}-comments`}
                    name="comments"
                    placeholder="Tell us more…"
                    value={comments}
                    onChange={(event) => setComments(event.target.value)}
                    className="min-h-24 resize-y"
                    rows={3}
                  />
                </Field>
                <Button type="submit" size="sm">
                  Send feedback
                </Button>
              </form>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
