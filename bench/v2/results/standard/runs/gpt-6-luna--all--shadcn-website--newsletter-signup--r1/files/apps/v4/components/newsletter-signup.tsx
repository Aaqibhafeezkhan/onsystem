"use client"

import { useState, type FormEvent } from "react"
import { Button } from "@/registry/new-york-v4/ui/button"
import { Input } from "@/registry/new-york-v4/ui/input"
import { Label } from "@/registry/new-york-v4/ui/label"

export function NewsletterSignup() {
  const [isSubmitted, setIsSubmitted] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Thanks for subscribing! Please check your inbox.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleSubmit}>
        <Label className="sr-only" htmlFor="newsletter-email">
          Email address
        </Label>
        <Input
          autoComplete="email"
          className="min-w-0 flex-1"
          id="newsletter-email"
          name="email"
          placeholder="Enter your email"
          required
          type="email"
        />
        <Button type="submit">Subscribe</Button>
      </form>
      <p className="text-sm text-muted-foreground">
        Get the latest news and updates delivered to your inbox.
      </p>
    </div>
  )
}
