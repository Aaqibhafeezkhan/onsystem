import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ModelSettingsCard() {
  return (
    <section className="w-full rounded-2xl border border-border/50 bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
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

      <div className="mt-5 flex flex-col gap-2">
        <Label className="text-sm font-medium" htmlFor="model-api-key">
          API key
        </Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            autoComplete="off"
            className="h-10 rounded-lg border-border/50 bg-muted/50 text-sm"
            id="model-api-key"
            name="apiKey"
            placeholder="Enter your API key"
            type="password"
          />
          <Button className="h-10 sm:shrink-0" type="button">
            Save
          </Button>
        </div>
      </div>
    </section>
  )
}
