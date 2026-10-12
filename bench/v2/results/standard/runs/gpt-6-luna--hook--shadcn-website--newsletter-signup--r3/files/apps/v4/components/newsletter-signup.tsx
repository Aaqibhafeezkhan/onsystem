"use client"

import { useId, useState } from "react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Input } from "@/registry/new-york-v4/ui/input"
import { Label } from "@/registry/new-york-v4/ui/label"

export function NewsletterSignup() {
  const emailId = useId()
  const [isSubmitted, setIsSubmitted] = useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <p className="text-sm" role="status">
        Thanks for subscribing! Check your inbox for updates.
      </p>
    )
  }

  return (
    <div className="w-full max-w-md">
      <form className="flex w-full items-center gap-2" onSubmit={handleSubmit}>
        <Label className="sr-only" htmlFor={emailId}>
          Email address
        </Label>
        <Input
          className="min-w-0 flex-1"
          id={emailId}
          name="email"
          type="email"
          placeholder="Enter your email"
          autoComplete="email"
          required
        />
        <Button type="submit">Subscribe</Button>
      </form>
      <p className="mt-2 text-sm text-muted-foreground">
        Get the latest news and updates delivered to your inbox.
      </p>
    </div>
  )
}
