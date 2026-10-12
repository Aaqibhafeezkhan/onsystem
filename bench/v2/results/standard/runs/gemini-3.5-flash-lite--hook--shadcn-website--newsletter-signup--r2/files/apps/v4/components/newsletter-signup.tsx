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
    if (!email) return
    setIsSubmitted(true)
  }

  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      {isSubmitted ? (
        <div className="text-sm font-medium text-foreground">
          Thank you for subscribing to our newsletter!
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="max-w-sm"
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
