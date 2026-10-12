"use client"

import * as React from "react"

import { Button } from "@/styles/base-nova/ui/button"
import { Input } from "@/styles/base-nova/ui/input"
import { Label } from "@/registry/new-york-v4/ui/label"

export function NewsletterSignup() {
  const [submitted, setSubmitted] = React.useState(false)
  const id = React.useId()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="w-full max-w-md" aria-live="polite">
      {submitted ? (
        <p role="status" className="text-sm text-foreground">
          Thanks for subscribing!
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor={`${id}-email`} className="sr-only">
              Email address
            </Label>
            <Input
              id={`${id}-email`}
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              aria-describedby={`${id}-helper`}
              required
              className="min-w-0 flex-1"
            />
            <Button type="submit" className="shrink-0">
              Subscribe
            </Button>
          </div>
          <p id={`${id}-helper`} className="text-sm text-muted-foreground">
            Get the latest updates in your inbox. Unsubscribe anytime.
          </p>
        </form>
      )}
    </div>
  )
}
