"use client"

import * as React from "react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Input } from "@/registry/new-york-v4/ui/input"

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
        className="flex flex-col gap-1 rounded-md border bg-card p-4 text-card-foreground"
      >
        <p className="text-sm font-medium">Thanks for subscribing!</p>
        <p className="text-sm text-muted-foreground">
          We&apos;ve sent updates to {email.trim()}.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm items-center gap-2"
      >
        <Input
          type="email"
          name="email"
          aria-label="Email address"
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
