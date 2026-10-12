"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ModelSettingsCardProps = {
  title?: string;
  description?: string;
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  onSave: () => void;
  connected?: boolean;
  saving?: boolean;
};

export function ModelSettingsCard({
  title = "Model settings",
  description = "Enter the API key used to connect to the language model.",
  apiKey,
  onApiKeyChange,
  onSave,
  connected = false,
  saving = false,
}: ModelSettingsCardProps) {
  const inputId = "model-settings-api-key";

  return (
    <section className="flex w-full flex-col gap-4 rounded-xl border border-border bg-card p-4 text-card-foreground">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-medium text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {connected ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-chart-2">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
            Connected
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={inputId}>API key</Label>
        <div className="flex gap-2">
          <Input
            id={inputId}
            type="password"
            autoComplete="off"
            placeholder="sk-..."
            value={apiKey}
            onChange={(event) => onApiKeyChange(event.target.value)}
          />
          <Button type="button" onClick={onSave} disabled={saving}>
            Save
          </Button>
        </div>
      </div>
    </section>
  );
}
