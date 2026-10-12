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
      <p role="status" className="text-sm text-muted-foreground">
        Thanks for subscribing! You’re on the list.
      </p>
    )
  }

  return (
    <div className="w-full">
      <form
        className="flex w-full flex-col gap-2 sm:flex-row"
        onSubmit={handleSubmit}
      >
        <Input
          aria-label="Email address"
          autoComplete="email"
          className="flex-1"
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
        <Button type="submit">Subscribe</Button>
      </form>
      <p className="mt-2 text-sm text-muted-foreground">
        Get the latest updates delivered straight to your inbox.
      </p>
    </div>
  )
}
