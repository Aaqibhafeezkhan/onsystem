"use client"

import * as React from "react"
import { CheckIcon } from "lucide-react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Input } from "@/registry/new-york-v4/ui/input"
import { Label } from "@/registry/new-york-v4/ui/label"

export function NewsletterSignup() {
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
        className="flex items-center gap-2 text-sm font-medium text-foreground"
      >
        <CheckIcon className="size-4 text-primary" aria-hidden="true" />
        Thanks for subscribing! Check your inbox to confirm.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Label htmlFor="newsletter-email" className="sr-only">
        Email
      </Label>
      <div className="flex w-full max-w-sm items-center gap-2">
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
      </div>
      <p className="text-sm text-muted-foreground">
        We respect your privacy. Unsubscribe at any time.
      </p>
    </form>
  )
}
