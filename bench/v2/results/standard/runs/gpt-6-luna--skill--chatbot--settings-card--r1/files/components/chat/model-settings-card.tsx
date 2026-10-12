"use client"

import { useState, type FormEvent } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type ModelSettingsCardProps = {
  title?: string
  description?: string
  apiKey?: string
  onSave?: (apiKey: string) => void | Promise<void>
}

export function ModelSettingsCard({
  title = "Model settings",
  description = "Add your API key to connect to this model provider.",
  apiKey = "",
  onSave,
}: ModelSettingsCardProps) {
  const [key, setKey] = useState(apiKey)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)

    try {
      await onSave?.(key)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="rounded-xl border border-border/60 bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-card-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Badge className="gap-1.5 bg-chart-2/10 text-chart-2">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-chart-2" />
          Connected
        </Badge>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="model-api-key">API key</Label>
          <Input
            autoComplete="off"
            id="model-api-key"
            name="apiKey"
            onChange={(event) => setKey(event.target.value)}
            placeholder="Enter your API key"
            spellCheck={false}
            type="text"
            value={key}
          />
        </div>
        <div className="flex justify-end">
          <Button disabled={isSaving} type="submit">
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </section>
  )
}
