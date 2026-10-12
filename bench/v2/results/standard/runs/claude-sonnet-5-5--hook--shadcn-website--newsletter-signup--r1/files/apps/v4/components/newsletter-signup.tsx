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
        Thanks for subscribing! Check your inbox to confirm.
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
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
        Get product updates. No spam, unsubscribe anytime.
      </p>
    </form>
  )
}
