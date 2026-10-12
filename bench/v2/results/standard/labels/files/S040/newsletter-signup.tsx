"use client"

import { useState } from "react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Field, FieldDescription } from "@/registry/new-york-v4/ui/field"
import { Input } from "@/registry/new-york-v4/ui/input"

export function NewsletterSignup() {
  const [isSubmitted, setIsSubmitted] = useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Thanks for subscribing! Please check your inbox for updates.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit}>
        <Field orientation="horizontal">
          <Input
            aria-label="Email address"
            autoComplete="email"
            className="min-w-0 flex-1"
            placeholder="Email address"
            required
            type="email"
          />
          <Button type="submit">Subscribe</Button>
        </Field>
      </form>
      <FieldDescription>
        Get occasional updates in your inbox. Unsubscribe anytime.
      </FieldDescription>
    </div>
  )
}
