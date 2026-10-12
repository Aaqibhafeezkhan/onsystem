"use client";

import { useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ModelSettingsCardProps = {
  onSave?: (apiKey: string) => void;
};

export function ModelSettingsCard({ onSave }: ModelSettingsCardProps) {
  const id = useId();
  const [apiKey, setApiKey] = useState("");
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const inputId = `${id}-api-key`;

  return (
    <section
      aria-labelledby={titleId}
      className="space-y-6 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-[var(--shadow-card)]"
    >
      <header className="space-y-2">
        <h2 className="font-semibold text-lg" id={titleId}>
          Model settings
        </h2>
        <p className="text-muted-foreground text-sm" id={descriptionId}>
          Configure your API key to connect to your model provider.
        </p>
      </header>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSave?.(apiKey.trim());
        }}
      >
        <div className="space-y-2">
          <Label htmlFor={inputId}>API key</Label>
          <Input
            aria-describedby={descriptionId}
            autoComplete="off"
            autoCapitalize="none"
            id={inputId}
            name="apiKey"
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="Enter your API key"
            required
            spellCheck={false}
            type="text"
            value={apiKey}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <Badge
            className="border-chart-2/20 bg-chart-2/10 text-chart-2"
            role="status"
            variant="outline"
          >
            Connected
          </Badge>
          <Button disabled={!apiKey.trim()} type="submit">
            Save
          </Button>
        </div>
      </form>
    </section>
  );
}
