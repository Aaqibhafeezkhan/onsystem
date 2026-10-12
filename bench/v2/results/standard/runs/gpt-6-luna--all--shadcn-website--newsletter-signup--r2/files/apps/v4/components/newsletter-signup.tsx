"use client"

import { useState } from "react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Input } from "@/registry/new-york-v4/ui/input"
import { Label } from "@/registry/new-york-v4/ui/label"

export function NewsletterSignup() {
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Thanks for subscribing! Please check your inbox for a confirmation email.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault()
          setSubmitted(true)
        }}
      >
        <div className="flex-1">
          <Label htmlFor="newsletter-email" className="sr-only">
            Email address
          </Label>
          <Input
            id="newsletter-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>
        <Button type="submit">Subscribe</Button>
      </form>
      <p className="text-sm text-muted-foreground">
        Get the latest updates and news delivered to your inbox.
      </p>
    </div>
  )
}
