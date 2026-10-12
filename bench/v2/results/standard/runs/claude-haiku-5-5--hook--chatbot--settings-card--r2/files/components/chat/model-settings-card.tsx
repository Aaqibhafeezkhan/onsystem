"use client"

import * as React from "react"

import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { cn } from "@/lib/utils"

export function ModelSettingsCard({
  title = "Model settings",
  description = "Enter your API key to connect your AI Gateway account.",
  onSave,
  className,
}: {
  title?: string
  description?: string
  onSave?: (apiKey: string) => void
  className?: string
}) {
  const inputId = React.useId()
  const [apiKey, setApiKey] = React.useState("")

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSave?.(apiKey.trim())
  }

  return (
    <section
      data-slot="model-settings-card"
      className={cn(
        "flex w-full flex-col gap-4 rounded-xl border border-border/50 bg-card p-5 text-card-foreground shadow-[var(--shadow-float)]",
        className
      )}
    >
      <header className="flex flex-col gap-1">
        <h3 className="text-sm font-medium leading-none text-foreground">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Label
            htmlFor={inputId}
            className="font-normal text-muted-foreground"
          >
            API key
          </Label>
          <Input
            id={inputId}
            name="apiKey"
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder="sk-..."
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            className="h-10 rounded-lg border-border/50 bg-muted/50 text-sm transition-colors focus:border-foreground/20 focus:bg-muted"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-emerald-500"
            />
            Connected
          </span>
          <Button type="submit" size="sm">
            Save
          </Button>
        </div>
      </form>
    </section>
  )
}
