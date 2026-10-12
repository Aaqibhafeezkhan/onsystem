"use client"

import { useState, type FormEvent } from "react"

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
      <p className="text-sm text-muted-foreground" role="status">
        Thanks for subscribing! Check your inbox for updates.
      </p>
    )
  }

  return (
    <div className="w-full">
      <form className="flex w-full flex-col gap-2 sm:flex-row" onSubmit={handleSubmit}>
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
        Get the latest news and updates delivered to your inbox.
      </p>
    </div>
  )
}
