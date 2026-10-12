"use client"

import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type ModelSettingsCardProps = {
  title?: string
  description?: string
  onSave?: (apiKey: string) => void
  className?: string
}

export function ModelSettingsCard({
  title = "Model settings",
  description = "Add your API key to connect your model provider.",
  onSave,
  className,
}: ModelSettingsCardProps) {
  const [apiKey, setApiKey] = useState("")

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave?.(apiKey)
  }

  return (
    <section
      className={cn(
        "rounded-xl border border-border/60 bg-card p-5 text-card-foreground shadow-[var(--shadow-card)] sm:p-6",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-700 dark:text-green-400">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-green-600 dark:bg-green-400"
          />
          Connected
        </span>
      </div>

      <form className="mt-5 space-y-2.5" onSubmit={handleSubmit}>
        <Label htmlFor="model-api-key">API key</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            autoComplete="off"
            className="sm:flex-1"
            id="model-api-key"
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="Enter API key"
            type="password"
            value={apiKey}
          />
          <Button className="sm:px-5" type="submit">
            Save
          </Button>
        </div>
      </form>
    </section>
  )
}
