"use client"

import * as React from "react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { FieldDescription } from "@/registry/new-york-v4/ui/field"
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
      <div role="status" className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">
          Thanks for subscribing!
        </p>
        <FieldDescription>
          We&apos;ve sent updates to {email}.
        </FieldDescription>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm gap-2">
        <Label htmlFor="newsletter-email" className="sr-only">
          Email
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
      <FieldDescription>
        We respect your inbox. Unsubscribe at any time.
      </FieldDescription>
    </div>
  )
}
