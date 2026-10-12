"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ModelSettingsCardProps = {
  title?: string
  description?: string
  initialApiKey?: string
  onSave?: (apiKey: string) => void
}

export function ModelSettingsCard({
  title = "Model settings",
  description = "Manage the API key used to connect to your model provider.",
  initialApiKey = "",
  onSave,
}: ModelSettingsCardProps) {
  const [apiKey, setApiKey] = useState(initialApiKey)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave?.(apiKey)
  }

  return (
    <section className="w-full max-w-xl rounded-2xl border border-border/50 bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-500" />
          Connected
        </span>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="model-api-key" className="text-sm font-medium">
            API key
          </Label>
          <Input
            autoComplete="off"
            id="model-api-key"
            name="apiKey"
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="Enter your API key"
            type="password"
            value={apiKey}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit">Save</Button>
        </div>
      </form>
    </section>
  )
}
