"use client"

import * as React from "react"
import { Button } from "@/registry/new-york-v4/ui/button"
import { Input } from "@/registry/new-york-v4/ui/input"

export function NewsletterSignup() {
  const [email, setEmail] = React.useState("")
  const [isSubmitted, setIsSubmitted] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setIsSubmitted(true)
  }

  return (
    <div className="flex flex-col gap-3">
      {isSubmitted ? (
        <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-card p-4 text-card-foreground">
          <p className="font-medium text-sm">Thank you for subscribing!</p>
          <p className="text-xs text-muted-foreground">
            We've sent a confirmation email to <span className="font-medium text-foreground">{email}</span>.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
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
        </form>
      )}
      <p className="text-xs text-muted-foreground">
        By subscribing, you agree to our privacy policy. Unsubscribe at any time.
      </p>
    </div>
  )
}
