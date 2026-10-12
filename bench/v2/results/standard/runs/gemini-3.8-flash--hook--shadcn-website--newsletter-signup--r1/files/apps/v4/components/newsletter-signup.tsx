"use client"

import * as React from "react"
import { cn } from "cn"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Input } from "@/registry/new-york-v4/ui/input"
import { Label } from "@/registry/new-york-v4/ui/label"

export function NewsletterSignup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isSubmitted, setIsSubmitted] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const id = React.useId()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitted(true)
  }

  return (
    <div className={cn("w-full max-w-sm space-y-2", className)} {...props}>
      {isSubmitted ? (
        <p role="status" className="text-sm font-medium text-foreground">
          Thank you for subscribing!
        </p>
      ) : (
        <>
          <form
            onSubmit={handleSubmit}
            className="flex w-full items-center gap-2"
            aria-label="Newsletter signup"
          >
            <Label htmlFor={id} className="sr-only">
              Email address
            </Label>
            <Input
              id={id}
              type="email"
              name="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-describedby={`${id}-helper`}
            />
            <Button type="submit">Subscribe</Button>
          </form>
          <p id={`${id}-helper`} className="text-xs text-muted-foreground">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </>
      )}
    </div>
  )
}

export default NewsletterSignup
