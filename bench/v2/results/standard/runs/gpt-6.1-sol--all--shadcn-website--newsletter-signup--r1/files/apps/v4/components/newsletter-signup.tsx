"use client"

import * as React from "react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Field, FieldDescription } from "@/registry/new-york-v4/ui/field"
import { Input } from "@/registry/new-york-v4/ui/input"

export function NewsletterSignup() {
  const helperId = React.useId()
  const [submitted, setSubmitted] = React.useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <div aria-live="polite" aria-atomic="true">
      {submitted ? (
        <div role="status" className="text-foreground">
          Thanks for subscribing!
        </div>
      ) : (
        <form onSubmit={handleSubmit} aria-label="Newsletter signup">
          <Field>
            <div className="flex items-center gap-2">
              <Input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Enter your email"
                aria-label="Email address"
                aria-describedby={helperId}
                className="min-w-0 flex-1"
                required
              />
              <Button type="submit">Subscribe</Button>
            </div>
            <FieldDescription id={helperId}>
              Get newsletter updates in your inbox. Unsubscribe anytime.
            </FieldDescription>
          </Field>
        </form>
      )}
    </div>
  )
}
