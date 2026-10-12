"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ModelSettingsCardProps {
  title?: string;
  description?: string;
  apiKey?: string;
  onSave?: (apiKey: string) => void;
}

export function ModelSettingsCard({
  title = "Model settings",
  description = "Configure the API key used to connect to your model provider.",
  apiKey: initialApiKey = "",
  onSave,
}: ModelSettingsCardProps) {
  const [apiKey, setApiKey] = useState(initialApiKey);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave?.(apiKey);
  }

  return (
    <section className="flex flex-col gap-5 rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Badge className="gap-1.5 border-transparent bg-chart-2/10 text-chart-2" variant="outline">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-chart-2" />
          Connected
        </Badge>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="model-api-key">API key</Label>
          <Input
            autoComplete="off"
            id="model-api-key"
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
