"use client"

import * as React from "react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Input } from "@/registry/new-york-v4/ui/input"

export function NewsletterSignup() {
  const [subscribed, setSubscribed] = React.useState(false)
  const id = React.useId()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubscribed(true)
  }

  if (subscribed) {
    return (
      <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
        Thanks for subscribing!
      </p>
    )
  }

  return (
    <div className="w-full max-w-md space-y-2">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Input
          id={id}
          aria-label="Email address"
          type="email"
          name="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          className="min-w-0 flex-1"
        />
        <Button type="submit">Subscribe</Button>
      </form>
      <p className="text-xs text-muted-foreground">
        Get the latest updates delivered straight to your inbox.
      </p>
    </div>
  )
}
