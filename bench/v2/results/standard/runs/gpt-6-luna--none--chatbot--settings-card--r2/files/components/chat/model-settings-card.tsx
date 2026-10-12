import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ModelSettingsCard() {
  return (
    <section className="w-full max-w-xl rounded-xl border border-border/50 bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">Model settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure the API key used to connect to your model provider.
          </p>
        </div>
        <Badge className="shrink-0 border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-500" />
          Connected
        </Badge>
      </div>

      <div className="mt-6 space-y-2">
        <Label htmlFor="model-api-key" className="text-sm font-medium">
          API key
        </Label>
        <Input
          autoComplete="off"
          id="model-api-key"
          name="apiKey"
          placeholder="Enter your API key"
          type="password"
        />
      </div>

      <div className="mt-5 flex justify-end">
        <Button type="button">Save</Button>
      </div>
    </section>
  );
}
