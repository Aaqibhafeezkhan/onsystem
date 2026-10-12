import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ModelSettingsCard() {
  const inputId = "model-settings-api-key"

  return (
    <div
      data-slot="card"
      className="flex w-full flex-col gap-4 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-card"
    >
      <div className="flex flex-col gap-1.5">
        <h3 className="text-base leading-none font-semibold">Model settings</h3>
        <p className="text-sm text-muted-foreground">
          Enter the API key used to connect to your model provider.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={inputId}>API key</Label>
        <Input
          id={inputId}
          type="password"
          name="apiKey"
          autoComplete="off"
          placeholder="sk-..."
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-emerald-500">Connected</span>
        <Button type="button">Save</Button>
      </div>
    </div>
  )
}
