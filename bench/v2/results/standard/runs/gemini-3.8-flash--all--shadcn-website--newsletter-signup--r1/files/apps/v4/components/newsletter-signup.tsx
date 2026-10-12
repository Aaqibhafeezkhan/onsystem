"use client"

import * as React from "react"

import { cn } from "cn"
import { Button } from "@/registry/new-york-v4/ui/button"
import { Input } from "@/registry/new-york-v4/ui/input"

export function NewsletterSignup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isSubmitted, setIsSubmitted] = React.useState(false)
  const [email, setEmail] = React.useState("")

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitted(true)
  }

  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      {isSubmitted ? (
        <p className="text-sm text-muted-foreground">
          Thank you for subscribing!
        </p>
      ) : (
        <>
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
          <p className="text-xs text-muted-foreground">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </>
      )}
    </div>
  )
}

export default NewsletterSignup
