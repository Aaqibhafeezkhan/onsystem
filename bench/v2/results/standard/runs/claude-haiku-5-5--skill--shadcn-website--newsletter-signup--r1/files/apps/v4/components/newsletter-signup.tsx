"use client"

import * as React from "react"

import { Alert, AlertDescription, AlertTitle } from "@/registry/new-york-v4/ui/alert"
import { Button } from "@/registry/new-york-v4/ui/button"
import { FieldDescription } from "@/registry/new-york-v4/ui/field"
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
      <Alert>
        <AlertTitle>Thanks for subscribing!</AlertTitle>
        <AlertDescription>
          We&apos;ve sent updates to {email}.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
        <Label htmlFor="newsletter-email" className="sr-only">
          Email
        </Label>
        <Input
          id="newsletter-email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Enter your email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Button type="submit">Subscribe</Button>
      </form>
      <FieldDescription>
        We&apos;ll only send you occasional updates. Unsubscribe anytime.
      </FieldDescription>
    </div>
  )
}
