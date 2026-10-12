"use client";

import { type FormEvent, useId } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ModelSettingsCardProps {
  title?: string;
  description?: string;
  onSave?: (apiKey: string) => void;
}

export function ModelSettingsCard({
  title = "Model settings",
  description = "Configure your API key to connect your model provider.",
  onSave,
}: ModelSettingsCardProps = {}) {
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const inputId = `${id}-api-key`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onSave?.(String(formData.get("apiKey") ?? "").trim());
  }

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6 text-card-foreground"
    >
      <header className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold" id={titleId}>
          {title}
        </h2>
        <p className="text-sm text-muted-foreground" id={descriptionId}>
          {description}
        </p>
      </header>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor={inputId}>API key</Label>
          <Input
            aria-describedby={descriptionId}
            autoComplete="off"
            autoCapitalize="none"
            id={inputId}
            name="apiKey"
            placeholder="Enter your API key"
            required
            spellCheck={false}
            type="text"
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Badge className="text-chart-2" variant="outline">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-chart-2" />
            Connected
          </Badge>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </section>
  );
}
