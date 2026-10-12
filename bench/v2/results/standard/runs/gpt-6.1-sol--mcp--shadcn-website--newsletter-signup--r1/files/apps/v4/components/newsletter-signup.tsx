"use client"

import * as React from "react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { FieldDescription } from "@/registry/new-york-v4/ui/field"
import { Input } from "@/registry/new-york-v4/ui/input"

export function NewsletterSignup() {
  const [submitted, setSubmitted] = React.useState(false)
  const helperId = React.useId()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="text-foreground">
      <div role="status" aria-live="polite" aria-atomic="true">
        {submitted ? "Thanks for subscribing to our newsletter!" : null}
      </div>
      {!submitted && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Input
              type="email"
              name="email"
              autoComplete="email"
              aria-label="Email address"
              aria-describedby={helperId}
              placeholder="Enter your email"
              required
              className="min-w-0 flex-1"
            />
            <Button type="submit" className="shrink-0">
              Subscribe
            </Button>
          </div>
          <FieldDescription id={helperId}>
            Get newsletter updates in your inbox. Unsubscribe anytime.
          </FieldDescription>
        </form>
      )}
    </div>
  )
}
