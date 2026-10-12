"use client"

import * as React from "react"

import { cn } from "cn"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Input } from "@/registry/new-york-v4/ui/input"

export function NewsletterSignup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email.trim()) {
      return
    }
    setSubmitted(true)
  }

  return (
    <div
      data-slot="newsletter-signup"
      className={cn("flex w-full max-w-sm flex-col gap-2", className)}
      {...props}
    >
      {submitted ? (
        <p
          role="status"
          aria-live="polite"
          className="text-sm font-medium text-foreground"
        >
          Thanks for subscribing! Check your inbox to confirm.
        </p>
      ) : (
        <>
          <form
            onSubmit={handleSubmit}
            className="flex w-full items-center gap-2"
          >
            <Input
              type="email"
              name="email"
              placeholder="Enter your email"
              aria-label="Email address"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="flex-1"
            />
            <Button type="submit">Subscribe</Button>
          </form>
          <p className="text-sm text-muted-foreground">
            No spam. Unsubscribe at any time.
          </p>
        </>
      )}
    </div>
  )
}
