import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ModelSettingsCard() {
  return (
    <section className="w-full max-w-xl rounded-xl border border-border bg-card p-6 text-card-foreground shadow-card">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Model settings</h2>
          <p className="text-sm text-muted-foreground">
            Manage the API key used to connect to your model provider.
          </p>
        </div>
        <Badge className="shrink-0 border border-chart-2/20 bg-chart-2/10 text-chart-2">
          Connected
        </Badge>
      </div>
      <form className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="model-api-key">API key</Label>
          <Input
            autoComplete="off"
            id="model-api-key"
            name="apiKey"
            placeholder="Enter your API key"
            type="password"
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit">Save</Button>
        </div>
      </form>
    </section>
  );
}
