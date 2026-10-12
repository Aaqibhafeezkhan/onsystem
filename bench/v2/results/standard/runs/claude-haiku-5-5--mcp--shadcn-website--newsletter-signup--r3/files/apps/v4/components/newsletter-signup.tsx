"use client"

import * as React from "react"

import { Alert, AlertDescription } from "@/registry/new-york-v4/ui/alert"
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
      <Alert role="status" aria-live="polite">
        <AlertDescription>
          Thanks for subscribing! Check your inbox to confirm {email}.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Label htmlFor="newsletter-email">Email</Label>
          <Input
            id="newsletter-email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            aria-describedby="newsletter-email-help"
          />
        </div>
        <Button type="submit">Subscribe</Button>
      </form>
      <FieldDescription id="newsletter-email-help">
        We respect your inbox. Unsubscribe at any time.
      </FieldDescription>
    </div>
  )
}
