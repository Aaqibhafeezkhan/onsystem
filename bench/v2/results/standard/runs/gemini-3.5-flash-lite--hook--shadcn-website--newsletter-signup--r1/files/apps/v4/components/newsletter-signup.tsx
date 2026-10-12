"use client"

import * as React from "react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Input } from "@/registry/new-york-v4/ui/input"

export function NewsletterSignup() {
  const [email, setEmail] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email) {
      return
    }
    setSubmitted(true)
  }

  return (
    <div className="w-full max-w-sm space-y-2">
      {submitted ? (
        <p className="text-sm font-medium text-foreground">
          Thank you for subscribing!
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1"
          />
          <Button type="submit">Subscribe</Button>
        </form>
      )}
      <p className="text-xs text-muted-foreground">
        We care about your data. Read our privacy policy.
      </p>
    </div>
  )
}
