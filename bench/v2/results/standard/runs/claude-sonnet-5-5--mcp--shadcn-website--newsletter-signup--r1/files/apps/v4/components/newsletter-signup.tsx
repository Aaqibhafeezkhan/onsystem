"use client"

import * as React from "react"

import { Alert, AlertDescription, AlertTitle } from "@/registry/new-york-v4/ui/alert"
import { Button } from "@/registry/new-york-v4/ui/button"
import { Input } from "@/registry/new-york-v4/ui/input"

export function NewsletterSignup() {
  const [submitted, setSubmitted] = React.useState(false)

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <Alert role="status">
        <AlertTitle>You're subscribed</AlertTitle>
        <AlertDescription>
          Thanks for signing up. Check your inbox for a confirmation email.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          type="email"
          name="email"
          placeholder="you@example.com"
          aria-label="Email address"
          autoComplete="email"
          required
        />
        <Button type="submit">Subscribe</Button>
      </div>
      <p className="text-muted-foreground text-sm">
        We'll send you occasional updates. Unsubscribe at any time.
      </p>
    </form>
  )
}
