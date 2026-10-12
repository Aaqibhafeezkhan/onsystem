"use client"

import { useState } from "react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Input } from "@/registry/new-york-v4/ui/input"

export function NewsletterSignup() {
  const [isSubscribed, setIsSubscribed] = useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubscribed(true)
  }

  if (isSubscribed) {
    return (
      <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
        Thanks for subscribing! Check your inbox for updates.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex w-full items-center gap-2">
        <Input
          aria-label="Email address"
          autoComplete="email"
          className="min-w-0 flex-1"
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
        <Button type="submit">Subscribe</Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Get the latest news and updates delivered to your inbox.
      </p>
    </form>
  )
}
