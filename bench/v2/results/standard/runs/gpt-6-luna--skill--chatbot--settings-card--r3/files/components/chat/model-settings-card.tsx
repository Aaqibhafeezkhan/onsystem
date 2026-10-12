import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function ModelSettingsCard() {
  return (
    <section className="rounded-xl border border-border/50 bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Model settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure the API key used to connect your model provider.
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-chart-2/10 px-2 py-1 text-xs font-medium text-chart-2">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-chart-2" />
          Connected
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <Label htmlFor="model-api-key">API key</Label>
        <Input
          autoComplete="off"
          id="model-api-key"
          name="apiKey"
          placeholder="Enter your API key"
          type="text"
        />
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="button">Save</Button>
      </div>
    </section>
  );
}
