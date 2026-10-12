"use client";

import type { FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ModelSettingsCardProps = {
  title?: string;
  description?: string;
  defaultApiKey?: string;
  onSave?: (apiKey: string) => void | Promise<void>;
};

export function ModelSettingsCard({
  title = "Model settings",
  description = "Configure the API key used to connect to your model provider.",
  defaultApiKey = "",
  onSave,
}: ModelSettingsCardProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    void onSave?.(String(formData.get("apiKey") ?? ""));
  }

  return (
    <section className="w-full max-w-xl rounded-xl border border-border bg-card p-5 text-card-foreground shadow-[var(--shadow-card)] sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Badge className="shrink-0 bg-green-600/10 text-green-600">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-green-600" />
          Connected
        </Badge>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="model-api-key">API key</Label>
          <Input
            autoComplete="off"
            defaultValue={defaultApiKey}
            id="model-api-key"
            name="apiKey"
            placeholder="Enter your API key"
            type="text"
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit">Save</Button>
        </div>
      </form>
    </section>
  );
}
