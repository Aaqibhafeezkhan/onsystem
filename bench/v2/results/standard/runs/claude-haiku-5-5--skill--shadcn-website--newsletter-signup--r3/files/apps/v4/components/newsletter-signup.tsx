"use client"

import * as React from "react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Input } from "@/registry/new-york-v4/ui/input"
import { Label } from "@/registry/new-york-v4/ui/label"

export function NewsletterSignup() {
  const [email, setEmail] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email.trim()) return
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div
        role="status"
        className="flex flex-col gap-1 text-sm"
      >
        <p className="font-medium text-foreground">Thanks for subscribing!</p>
        <p className="text-muted-foreground">
          We&apos;ve sent your confirmation to {email}.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm gap-2">
        <Label htmlFor="newsletter-email" className="sr-only">
          Email address
        </Label>
        <Input
          id="newsletter-email"
          type="email"
          name="email"
          placeholder="Enter your email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Button type="submit">Subscribe</Button>
      </form>
      <p className="text-sm text-muted-foreground">
        We respect your inbox. Unsubscribe at any time.
      </p>
    </div>
  )
}
