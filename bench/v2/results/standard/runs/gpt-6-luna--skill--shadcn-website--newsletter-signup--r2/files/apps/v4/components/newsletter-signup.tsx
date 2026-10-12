"use client"

import { type FormEvent, useState } from "react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Input } from "@/registry/new-york-v4/ui/input"

export function NewsletterSignup() {
  const [isSubscribed, setIsSubscribed] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubscribed(true)
  }

  if (isSubscribed) {
    return (
      <p role="status" className="text-sm font-medium">
        Thanks for subscribing!
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-2">
      <div className="flex items-center gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <Input
          id="newsletter-email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          className="flex-1"
        />
        <Button type="submit">Subscribe</Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Get occasional updates in your inbox. Unsubscribe anytime.
      </p>
    </form>
  )
}
