"use client"

import * as React from "react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Input } from "@/registry/new-york-v4/ui/input"

export function NewsletterSignup() {
  const [isSubscribed, setIsSubscribed] = React.useState(false)
  const id = React.useId()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubscribed(true)
  }

  if (isSubscribed) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Thanks for subscribing! Check your inbox for updates.
      </p>
    )
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <Input
          id={id}
          type="email"
          name="email"
          placeholder="Enter your email"
          aria-label="Email address"
          autoComplete="email"
          required
          className="min-w-0 flex-1"
        />
        <Button type="submit">Subscribe</Button>
      </form>
      <p className="mt-2 text-sm text-muted-foreground">
        Get the latest news and updates delivered to your inbox.
      </p>
    </div>
  )
}
