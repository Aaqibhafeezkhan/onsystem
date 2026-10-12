import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ModelSettingsCard() {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 text-card-foreground">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold">Model settings</h3>
          <p className="text-sm text-muted-foreground">
            Enter the API key used to connect to your model provider.
          </p>
        </div>
        <Badge variant="secondary" className="text-chart-2">
          Connected
        </Badge>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="model-api-key">API key</Label>
        <Input id="model-api-key" type="text" placeholder="Enter your API key" />
      </div>
      <div className="flex justify-end">
        <Button>Save</Button>
      </div>
    </div>
  )
}
