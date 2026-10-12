"use client"

import * as React from "react"
import { CheckCircle2Icon } from "lucide-react"

import { cn } from "cn"
import { Button } from "@/registry/new-york-v4/ui/button"
import { Input } from "@/registry/new-york-v4/ui/input"
import { Label } from "@/registry/new-york-v4/ui/label"

export interface NewsletterSignupProps
  extends React.ComponentProps<"div"> {
  placeholder?: string
  buttonText?: string
  helperText?: React.ReactNode
  successMessage?: React.ReactNode
  onSubscribe?: (email: string) => void | Promise<void>
}

export function NewsletterSignup({
  className,
  placeholder = "Enter your email",
  buttonText = "Subscribe",
  helperText = "We respect your privacy. Unsubscribe at any time.",
  successMessage = "Thank you for subscribing!",
  onSubscribe,
  ...props
}: NewsletterSignupProps) {
  const [email, setEmail] = React.useState("")
  const [isSubmitted, setIsSubmitted] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (onSubscribe) {
      try {
        setIsLoading(true)
        await onSubscribe(email)
        setIsSubmitted(true)
      } finally {
        setIsLoading(false)
      }
    } else {
      setIsSubmitted(true)
    }
  }

  return (
    <div className={cn("grid w-full gap-2", className)} {...props}>
      {isSubmitted ? (
        typeof successMessage === "string" ? (
          <div
            role="status"
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <CheckCircle2Icon className="size-4 text-primary" />
            <span>{successMessage}</span>
          </div>
        ) : (
          successMessage
        )
      ) : (
        <>
          <form
            onSubmit={handleSubmit}
            aria-label="Newsletter signup"
            className="flex w-full items-center gap-2"
          >
            <Label htmlFor="newsletter-email" className="sr-only">
              Email address
            </Label>
            <Input
              id="newsletter-email"
              type="email"
              placeholder={placeholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-label="Email address"
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              {buttonText}
            </Button>
          </form>
          {helperText && (
            <p className="text-xs text-muted-foreground">{helperText}</p>
          )}
        </>
      )}
    </div>
  )
}

export default NewsletterSignup
