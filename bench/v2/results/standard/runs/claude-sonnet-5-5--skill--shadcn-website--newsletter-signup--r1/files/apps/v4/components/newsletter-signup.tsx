"use client"

import * as React from "react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Input } from "@/registry/new-york-v4/ui/input"

export function NewsletterSignup() {
  const [submitted, setSubmitted] = React.useState(false)

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <p role="status" className="text-sm font-medium">
        Thanks for subscribing! Check your inbox to confirm your email.
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-2">
      <div className="flex items-center gap-2">
        <Input
          type="email"
          name="email"
          placeholder="you@example.com"
          aria-label="Email address"
          aria-describedby="newsletter-signup-help"
          required
        />
        <Button type="submit">Subscribe</Button>
      </div>
      <p id="newsletter-signup-help" className="text-muted-foreground text-sm">
        Get product updates in your inbox. Unsubscribe at any time.
      </p>
    </form>
  )
}
