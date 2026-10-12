"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ModelSettingsCardProps = {
  title: string;
  description: string;
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  onSave: () => void;
  connected?: boolean;
  className?: string;
};

export function ModelSettingsCard({
  title,
  description,
  apiKey,
  onApiKeyChange,
  onSave,
  connected = true,
  className,
}: ModelSettingsCardProps) {
  const apiKeyId = "model-settings-api-key";

  return (
    <section
      className={`flex flex-col gap-4 rounded-xl border border-border bg-card p-6 text-card-foreground ${className ?? ""}`}
    >
      <header className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {connected ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-chart-2">
              <span aria-hidden="true" className="size-2 rounded-full bg-chart-2" />
              Connected
            </span>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>

      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <Label htmlFor={apiKeyId}>API key</Label>
        <div className="flex items-center gap-2">
          <Input
            id={apiKeyId}
            type="text"
            name="apiKey"
            autoComplete="off"
            spellCheck={false}
            placeholder="Enter your API key"
            value={apiKey}
            onChange={(event) => onApiKeyChange(event.target.value)}
            className="flex-1"
          />
          <Button type="submit">Save</Button>
        </div>
      </form>
    </section>
  );
}
