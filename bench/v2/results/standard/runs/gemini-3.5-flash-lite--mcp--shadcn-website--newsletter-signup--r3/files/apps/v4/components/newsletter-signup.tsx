"use client"

import * as React from "react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Input } from "@/registry/new-york-v4/ui/input"

export function NewsletterSignup() {
  const [submitted, setSubmitted] = React.useState(false)
  const [email, setEmail] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      setSubmitted(true)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {submitted ? (
        <div className="text-sm font-medium text-foreground">
          Thank you for subscribing!
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-label="Email address"
          />
          <Button type="submit">Subscribe</Button>
        </form>
      )}
      <p className="text-sm text-muted-foreground">
        We respect your privacy. Unsubscribe at any time.
      </p>
    </div>
  )
}
