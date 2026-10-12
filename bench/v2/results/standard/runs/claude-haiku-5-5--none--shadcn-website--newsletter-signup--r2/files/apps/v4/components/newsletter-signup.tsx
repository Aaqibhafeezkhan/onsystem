"use client"

import * as React from "react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Input } from "@/registry/new-york-v4/ui/input"

export function NewsletterSignup() {
  const id = React.useId()
  const [email, setEmail] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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
        className="rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground"
      >
        Thanks for subscribing! Check your inbox to confirm.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex w-full max-w-sm items-center gap-2">
        <Input
          id={`newsletter-email-${id}`}
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Enter your email"
          aria-label="Email address"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Button type="submit">Subscribe</Button>
      </div>
      <p
        id={`newsletter-helper-${id}`}
        className="text-sm text-muted-foreground"
      >
        We&apos;ll send occasional updates. Unsubscribe at any time.
      </p>
    </form>
  )
}
