"use client"

import * as React from "react"
import { cn } from "cn"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Input } from "@/registry/new-york-v4/ui/input"

export interface NewsletterSignupProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function NewsletterSignup({
  className,
  ...props
}: NewsletterSignupProps) {
  const [email, setEmail] = React.useState("")
  const [isSubmitted, setIsSubmitted] = React.useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email) {
      return
    }
    setIsSubmitted(true)
  }

  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      {isSubmitted ? (
        <div className="text-sm font-medium text-foreground">
          Thank you for subscribing to our newsletter.
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
            className="max-w-sm flex-1"
          />
          <Button type="submit">Subscribe</Button>
        </form>
      )}
      <p className="text-muted-foreground text-sm">
        We care about your data. Read our privacy policy.
      </p>
    </div>
  )
}

export default NewsletterSignup
