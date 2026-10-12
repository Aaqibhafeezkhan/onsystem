import * as React from "react"

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

function ModelSettingsCard({
  title = "Model settings",
  description = "Enter your API key to connect the model provider.",
  onSave,
  className,
}: ModelSettingsCardProps) {
  const inputId = React.useId()
  const [apiKey, setApiKey] = React.useState("")

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave?.(apiKey.trim())
  }

  return (
    <div
      data-slot="model-settings-card"
      className={cn(
        "flex w-full max-w-md flex-col gap-4 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-base leading-none font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor={inputId}>API key</Label>
          <Input
            id={inputId}
            type="text"
            name="apiKey"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="sk-..."
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-chart-2">
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-chart-2"
            />
            Connected
          </span>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </div>
  )
}

export { ModelSettingsCard }
