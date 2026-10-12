"use client"

import * as React from "react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Input } from "@/registry/new-york-v4/ui/input"

export function NewsletterSignup() {
  const [submitted, setSubmitted] = React.useState(false)

  if (submitted) {
    return (
      <p role="status" className="text-sm font-medium">
        Thanks for subscribing! Check your inbox to confirm.
      </p>
    )
  }

  return (
    <form
      className="flex w-full max-w-sm flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
      }}
    >
      <div className="flex gap-2">
        <Input
          type="email"
          name="email"
          placeholder="you@example.com"
          aria-label="Email address"
          required
        />
        <Button type="submit">Subscribe</Button>
      </div>
      <p className="text-muted-foreground text-sm">
        Get product updates. Unsubscribe at any time.
      </p>
    </form>
  )
}
