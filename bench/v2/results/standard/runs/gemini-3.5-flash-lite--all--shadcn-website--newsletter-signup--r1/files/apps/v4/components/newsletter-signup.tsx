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
  const [isSubmitted, setIsSubmitted] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      setIsSubmitted(true)
    }
  }

  return (
    <div className={cn("not-typeset", className)} {...props}>
      {isSubmitted ? (
        <div className="text-sm text-muted-foreground">
          Thank you for subscribing! We&apos;ll be in touch soon.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-label="Email address"
              className="max-w-xs"
            />
            <Button type="submit">Subscribe</Button>
          </div>
          <p className="text-sm text-muted-foreground">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </form>
      )}
    </div>
  )
}
