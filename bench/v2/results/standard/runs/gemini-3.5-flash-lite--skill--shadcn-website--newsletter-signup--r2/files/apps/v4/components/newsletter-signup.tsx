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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (email.trim()) {
      setIsSubmitted(true)
    }
  }

  return (
    <div className={cn("grid gap-2", className)} {...props}>
      {isSubmitted ? (
        <div className="text-sm font-medium text-foreground">
          Thank you for subscribing to our newsletter.
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
            className="max-w-sm"
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
