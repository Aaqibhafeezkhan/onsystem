import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ModelSettingsCardProps = {
  title: string
  description: string
  apiKey: string
  onApiKeyChange: (value: string) => void
  onSave: () => void
  connected?: boolean
}

export function ModelSettingsCard({
  title,
  description,
  apiKey,
  onApiKeyChange,
  onSave,
  connected = true,
}: ModelSettingsCardProps) {
  const inputId = "model-settings-api-key"

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 text-card-foreground">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-medium text-foreground">{title}</h3>
          {connected && (
            <Badge variant="outline" className="text-chart-2">
              Connected
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={inputId}>API key</Label>
        <Input
          id={inputId}
          type="password"
          autoComplete="off"
          placeholder="sk-..."
          value={apiKey}
          onChange={(event) => onApiKeyChange(event.target.value)}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={onSave}>Save</Button>
      </div>
    </div>
  )
}
