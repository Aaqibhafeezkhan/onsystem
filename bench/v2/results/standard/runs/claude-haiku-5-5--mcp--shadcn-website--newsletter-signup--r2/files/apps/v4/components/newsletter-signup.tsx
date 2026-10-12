"use client"

import * as React from "react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Input } from "@/registry/new-york-v4/ui/input"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/registry/new-york-v4/ui/field"

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
      <div role="status" className="text-foreground text-sm font-medium">
        Thanks for subscribing! Check your inbox to confirm {email}.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <Field>
        <FieldLabel htmlFor="newsletter-email" className="sr-only">
          Email address
        </FieldLabel>
        <div className="flex w-full max-w-sm items-center gap-2">
          <Input
            id="newsletter-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Button type="submit">Subscribe</Button>
        </div>
        <FieldDescription>
          We respect your inbox. Unsubscribe at any time.
        </FieldDescription>
      </Field>
    </form>
  )
}
