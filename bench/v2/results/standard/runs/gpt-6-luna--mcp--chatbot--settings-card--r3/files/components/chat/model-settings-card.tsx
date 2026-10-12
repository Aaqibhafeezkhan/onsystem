"use client";

import { useId, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ModelSettingsCardProps = {
  title?: string;
  description?: string;
  initialApiKey?: string;
  onSave?: (apiKey: string) => void;
};

export function ModelSettingsCard({
  title = "Model settings",
  description = "Configure the API key used to connect to your model provider.",
  initialApiKey = "",
  onSave,
}: ModelSettingsCardProps) {
  const inputId = useId();
  const [apiKey, setApiKey] = useState(initialApiKey);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave?.(apiKey);
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-card">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Badge className="gap-1.5 border border-chart-2/20 bg-chart-2/10 text-chart-2">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-chart-2" />
          Connected
        </Badge>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor={inputId}>API key</Label>
          <Input
            autoComplete="off"
            id={inputId}
            name="apiKey"
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="Enter your API key"
            type="text"
            value={apiKey}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit">Save</Button>
        </div>
      </form>
    </section>
  );
}
