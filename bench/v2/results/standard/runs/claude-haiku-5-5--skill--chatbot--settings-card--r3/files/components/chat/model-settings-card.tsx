"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type ModelSettingsCardProps = {
  title?: string
  description?: string
  connected?: boolean
  onSave?: (apiKey: string) => void
  className?: string
}

function ModelSettingsCard({
  title = "Model settings",
  description = "Enter your API key to connect the model provider.",
  connected = false,
  onSave,
  className,
}: ModelSettingsCardProps) {
  const [apiKey, setApiKey] = React.useState("")
  const inputId = React.useId()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave?.(apiKey.trim())
  }

  return (
    <div
      data-slot="model-settings-card"
      className={cn(
        "flex w-full flex-col gap-4 rounded-xl border border-border/50 bg-card p-4 text-card-foreground shadow-[var(--shadow-float)]",
        className
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm leading-none font-medium">{title}</h3>
          {connected ? (
            <span className="text-xs font-medium text-green-600">
              Connected
            </span>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor={inputId}>API key</Label>
          <Input
            id={inputId}
            type="text"
            name="apiKey"
            autoComplete="off"
            spellCheck={false}
            placeholder="sk-..."
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit">Save</Button>
        </div>
      </form>
    </div>
  )
}

export { ModelSettingsCard }
