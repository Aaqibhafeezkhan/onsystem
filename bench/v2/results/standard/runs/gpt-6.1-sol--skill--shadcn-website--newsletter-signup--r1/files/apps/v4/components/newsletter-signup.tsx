"use client"

import * as React from "react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Input } from "@/registry/new-york-v4/ui/input"
import { Label } from "@/registry/new-york-v4/ui/label"

export function NewsletterSignup() {
  const id = React.useId()
  const [submitted, setSubmitted] = React.useState(false)
  const emailId = `${id}-email`
  const helperId = `${id}-helper`

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="space-y-2">
      <div role="status" aria-live="polite" aria-atomic="true">
        {submitted && (
          <p className="text-sm text-foreground">
            Thanks for subscribing!
          </p>
        )}
      </div>
      {!submitted && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Label htmlFor={emailId} className="sr-only">
            Email address
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id={emailId}
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              aria-describedby={helperId}
              required
              className="flex-1"
            />
            <Button type="submit">Subscribe</Button>
          </div>
          <p id={helperId} className="text-sm text-muted-foreground">
            Get the latest news and updates. Unsubscribe at any time.
          </p>
        </form>
      )}
    </div>
  )
}
