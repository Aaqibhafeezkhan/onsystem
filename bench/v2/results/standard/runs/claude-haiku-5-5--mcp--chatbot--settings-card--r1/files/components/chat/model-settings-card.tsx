import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ModelSettingsCardProps = {
  title?: string;
  description?: string;
  apiKey?: string;
  onApiKeyChange?: (value: string) => void;
  onSave?: () => void;
  connected?: boolean;
};

export function ModelSettingsCard({
  title = "Model settings",
  description = "Enter your API key to connect to the model provider.",
  apiKey = "",
  onApiKeyChange,
  onSave,
  connected = true,
}: ModelSettingsCardProps) {
  const inputId = useId();

  return (
    <section className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-border bg-card p-6 text-card-foreground">
      <header className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {connected && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-chart-2">
              <span aria-hidden="true" className="size-2 rounded-full bg-chart-2" />
              Connected
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>

      <div className="flex flex-col gap-2">
        <Label htmlFor={inputId}>API key</Label>
        <Input
          id={inputId}
          type="password"
          autoComplete="off"
          placeholder="sk-..."
          value={apiKey}
          onChange={(event) => onApiKeyChange?.(event.target.value)}
        />
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={onSave}>
          Save
        </Button>
      </div>
    </section>
  );
}
