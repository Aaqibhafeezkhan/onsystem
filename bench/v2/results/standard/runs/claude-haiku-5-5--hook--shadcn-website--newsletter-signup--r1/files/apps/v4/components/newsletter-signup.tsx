"use client"

import * as React from "react"
import { cn } from "cn"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Input } from "@/registry/new-york-v4/ui/input"
import { Label } from "@/registry/new-york-v4/ui/label"

export function NewsletterSignup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email.trim()) return
    setSubmitted(true)
  }

  return (
    <div
      data-slot="newsletter-signup"
      className={cn("flex w-full flex-col gap-2", className)}
      {...props}
    >
      {submitted ? (
        <p
          role="status"
          className="text-sm font-medium text-foreground"
        >
          Thanks for subscribing! Check your inbox to confirm.
        </p>
      ) : (
        <>
          <form
            onSubmit={handleSubmit}
            className="flex w-full max-w-sm items-center gap-2"
          >
            <Label htmlFor="newsletter-signup-email" className="sr-only">
              Email address
            </Label>
            <Input
              id="newsletter-signup-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-describedby="newsletter-signup-helper"
            />
            <Button type="submit">Subscribe</Button>
          </form>
          <p
            id="newsletter-signup-helper"
            className="text-sm text-muted-foreground"
          >
            No spam. Unsubscribe at any time.
          </p>
        </>
      )}
    </div>
  )
}
