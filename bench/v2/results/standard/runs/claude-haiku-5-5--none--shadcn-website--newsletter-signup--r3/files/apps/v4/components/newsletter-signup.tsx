"use client"

import * as React from "react"
import { cn } from "cn"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Input } from "@/registry/new-york-v4/ui/input"

export function NewsletterSignup({ className }: { className?: string }) {
  const [email, setEmail] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email.trim()) {
      return
    }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn("flex flex-col gap-1 text-sm", className)}
      >
        <p className="font-medium text-foreground">Thanks for subscribing!</p>
        <p className="text-muted-foreground">
          We&apos;ve sent updates to {email.trim()}.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-2", className)}
    >
      <div className="flex w-full max-w-sm items-center gap-2">
        <Input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Enter your email"
          aria-label="Email address"
          aria-describedby="newsletter-signup-helper"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Button type="submit">Subscribe</Button>
      </div>
      <p id="newsletter-signup-helper" className="text-sm text-muted-foreground">
        No spam. Unsubscribe at any time.
      </p>
    </form>
  )
}
