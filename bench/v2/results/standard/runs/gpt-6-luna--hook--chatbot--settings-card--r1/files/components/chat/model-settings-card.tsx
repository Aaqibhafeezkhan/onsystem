import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ModelSettingsCard() {
  return (
    <section className="w-full max-w-lg rounded-xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">Model settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure the API key used to connect to your model provider.
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-chart-2/10 px-2.5 py-1 text-xs font-medium text-chart-2">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
          Connected
        </span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="model-api-key" className="text-muted-foreground">
          API key
        </Label>
        <Input
          autoComplete="off"
          id="model-api-key"
          name="apiKey"
          placeholder="Enter your API key"
          type="text"
        />
      </div>

      <div className="mt-5 flex justify-end">
        <Button type="button">Save</Button>
      </div>
    </section>
  );
}
