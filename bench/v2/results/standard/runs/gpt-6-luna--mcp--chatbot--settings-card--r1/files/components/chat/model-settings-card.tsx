"use client";

import { useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ModelSettingsCardProps = {
  title?: string;
  description?: string;
  initialApiKey?: string;
  onSave?: (apiKey: string) => void | Promise<void>;
};

export function ModelSettingsCard({
  title = "Model settings",
  description = "Manage the API key used to connect to your model provider.",
  initialApiKey = "",
  onSave,
}: ModelSettingsCardProps) {
  const inputId = useId();
  const [apiKey, setApiKey] = useState(initialApiKey);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSave?.(apiKey);
  }

  return (
    <section className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-card">
      <header className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-lg">{title}</h2>
          <Badge className="gap-1.5 border-transparent bg-chart-2/10 text-chart-2">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-chart-2" />
            Connected
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">{description}</p>
      </header>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor={inputId}>API key</Label>
          <Input
            autoComplete="off"
            id={inputId}
            name="apiKey"
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="Enter your API key"
            type="password"
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
