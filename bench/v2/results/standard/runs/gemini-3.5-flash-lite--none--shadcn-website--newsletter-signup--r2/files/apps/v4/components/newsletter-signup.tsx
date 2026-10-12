"use client"

import * as React from "react"

import { Button } from "@/registry/new-york-v4/ui/button"
import { Input } from "@/registry/new-york-v4/ui/input"

export function NewsletterSignup() {
  const [email, setEmail] = React.useState("")
  const [isSubmitted, setIsSubmitted] = React.useState(false)

  return (
    <div className="flex flex-col gap-2">
      {isSubmitted ? (
        <p className="text-sm text-muted-foreground">
          Thank you for subscribing!
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (email.trim()) {
              setIsSubmitted(true)
            }
          }}
          className="flex w-full max-w-sm items-center gap-2"
        >
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit">Subscribe</Button>
        </form>
      )}
      <p className="text-xs text-muted-foreground">
        {isSubmitted
          ? "You have successfully joined our mailing list."
          : "We care about your data. Read our privacy policy."}
      </p>
    </div>
  )
}
