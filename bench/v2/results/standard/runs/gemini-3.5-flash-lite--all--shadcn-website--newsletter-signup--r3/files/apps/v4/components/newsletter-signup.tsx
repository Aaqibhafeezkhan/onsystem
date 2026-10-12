"use client"

import * as React from "react"
import { cn } from "cn"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Input } from "@/registry/new-york-v4/ui/input"

export interface NewsletterSignupProps extends React.HTMLAttributes<HTMLDivElement> {}

export function NewsletterSignup({
  className,
  ...props
}: NewsletterSignupProps) {
  const [email, setEmail] = React.useState("")
  const [isSubmitted, setIsSubmitted] = React.useState(false)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email) return
    setIsSubmitted(true)
  }

  return (
    <div className={cn("w-full max-w-sm", className)} {...props}>
      {isSubmitted ? (
        <div className="rounded-md border bg-muted/50 p-4 text-center">
          <p className="text-sm font-medium text-foreground">
            Thank you for subscribing!
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            You will receive our next update in your inbox.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex w-full items-center gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1"
            />
            <Button type="submit">Subscribe</Button>
          </div>
          <p className="text-xs text-muted-foreground">
            We care about your data. Read our privacy policy.
          </p>
        </form>
      )}
    </div>
  )
}
