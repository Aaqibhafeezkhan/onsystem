"use client";

import { useId, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ModelSettingsCardProps = {
  defaultApiKey?: string;
  onSave?: (apiKey: string) => void;
};

export function ModelSettingsCard({
  defaultApiKey = "",
  onSave,
}: ModelSettingsCardProps = {}) {
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const inputId = `${id}-api-key`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSave?.(String(data.get("apiKey") ?? ""));
  }

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6 text-card-foreground"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <header className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold" id={titleId}>
          Model settings
        </h2>
        <p className="text-sm text-muted-foreground" id={descriptionId}>
          Configure your API key to connect to your model provider.
        </p>
      </header>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor={inputId}>API key</Label>
          <Input
            aria-describedby={descriptionId}
            autoCapitalize="none"
            autoComplete="off"
            defaultValue={defaultApiKey}
            id={inputId}
            name="apiKey"
            placeholder="Enter your API key"
            required
            spellCheck={false}
            type="text"
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Badge className="text-chart-2" role="status" variant="outline">
            Connected
          </Badge>
          <Button size="sm" type="submit">
            Save
          </Button>
        </div>
      </form>
    </section>
  );
}
