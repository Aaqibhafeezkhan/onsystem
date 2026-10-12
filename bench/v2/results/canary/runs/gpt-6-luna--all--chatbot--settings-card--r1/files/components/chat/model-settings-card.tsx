import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ModelSettingsCard() {
  return (
    <section className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Model settings</h2>
          <p className="text-sm text-muted-foreground">
            Connect your provider with an API key to use this model.
          </p>
        </div>
        <Badge className="shrink-0 border-chart-2/20 bg-chart-2/10 text-chart-2">
          Connected
        </Badge>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="model-api-key">API key</Label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            autoComplete="off"
            className="min-w-0 flex-1"
            id="model-api-key"
            name="apiKey"
            placeholder="Enter your API key"
            type="password"
          />
          <Button className="sm:shrink-0" type="button">
            Save
          </Button>
        </div>
      </div>
    </section>
  );
}
