"use client"

import { useState } from "react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Input } from "@/registry/new-york-v4/ui/input"

export function NewsletterSignup() {
  const [isSubmitted, setIsSubmitted] = useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Thanks for subscribing! Check your inbox for updates.
      </p>
    )
  }

  return (
    <div className="w-full max-w-md">
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
        Get the latest news and updates delivered to your inbox.
      </p>
    </div>
  )
}
