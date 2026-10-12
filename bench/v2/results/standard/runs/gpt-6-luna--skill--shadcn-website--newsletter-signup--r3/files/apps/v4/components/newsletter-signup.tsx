"use client"

import { useId, useState, type FormEvent } from "react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Input } from "@/registry/new-york-v4/ui/input"

export function NewsletterSignup() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const emailId = useId()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Thanks for subscribing!
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <form className="flex items-center gap-2" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor={emailId}>
          Email address
        </label>
        <Input
          autoComplete="email"
          className="min-w-0 flex-1"
          id={emailId}
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
        <Button type="submit">Subscribe</Button>
      </form>
      <p className="text-sm text-muted-foreground">
        Get the latest updates delivered to your inbox.
      </p>
    </div>
  )
}
