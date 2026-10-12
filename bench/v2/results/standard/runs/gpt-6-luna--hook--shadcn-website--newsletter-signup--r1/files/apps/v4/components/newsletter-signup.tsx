"use client"

import * as React from "react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Input } from "@/registry/new-york-v4/ui/input"
import { Label } from "@/registry/new-york-v4/ui/label"

export function NewsletterSignup() {
  const [isSubmitted, setIsSubmitted] = React.useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <p className="text-sm font-medium" role="status" aria-live="polite">
        Thanks for subscribing! Check your inbox for updates.
      </p>
    )
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Label className="sr-only" htmlFor="newsletter-email">
          Email address
        </Label>
        <Input
          id="newsletter-email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          className="min-w-0 flex-1"
        />
        <Button type="submit">Subscribe</Button>
      </form>
      <p className="mt-2 text-sm text-muted-foreground">
        Get occasional updates in your inbox. Unsubscribe at any time.
      </p>
    </div>
  )
}
