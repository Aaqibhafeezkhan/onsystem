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
      <p className="text-sm font-medium" role="status">
        Thanks for subscribing!
      </p>
    )
  }

  return (
    <div>
      <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleSubmit}>
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
      </form>
      <p className="mt-2 text-sm text-muted-foreground">
        Get occasional updates in your inbox. Unsubscribe anytime.
      </p>
    </div>
  )
}
