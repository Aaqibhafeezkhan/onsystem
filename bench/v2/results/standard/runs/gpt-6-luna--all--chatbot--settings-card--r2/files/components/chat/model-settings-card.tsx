"use client";

import { useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ModelSettingsCard({
  title = "Model settings",
  description = "Add your API key to connect your model provider.",
  initialApiKey = "",
  onSave,
}: {
  title?: string;
  description?: string;
  initialApiKey?: string;
  onSave?: (apiKey: string) => void;
}) {
  const inputId = useId();
  const [apiKey, setApiKey] = useState(initialApiKey);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave?.(apiKey);
  };

  return (
    <section className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 text-card-foreground">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-semibold text-lg">{title}</h2>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <Badge
          className="shrink-0 gap-1.5 border-chart-2/30 bg-chart-2/10 text-chart-2"
          variant="outline"
        >
          <span aria-hidden="true" className="size-1.5 rounded-full bg-chart-2" />
          Connected
        </Badge>
      </div>

      <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleSubmit}>
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor={inputId}>API key</Label>
          <Input
            autoComplete="off"
            id={inputId}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="Enter your API key"
            type="text"
            value={apiKey}
          />
        </div>
        <Button type="submit">Save</Button>
      </form>
    </section>
  );
}
