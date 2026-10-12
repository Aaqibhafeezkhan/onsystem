"use client"

import * as React from "react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Input } from "@/registry/new-york-v4/ui/input"

export function NewsletterSignup() {
  const [email, setEmail] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitted(true)
  }

  return (
    <div className="w-full max-w-sm">
      {submitted ? (
        <div className="text-sm font-medium text-foreground">
          Thank you for subscribing!
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-label="Email address"
              className="flex-1"
            />
            <Button type="submit">Subscribe</Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Get updates on new components and features. Unsubscribe at any time.
          </p>
        </form>
      )}
    </div>
  )
}

export default NewsletterSignup
