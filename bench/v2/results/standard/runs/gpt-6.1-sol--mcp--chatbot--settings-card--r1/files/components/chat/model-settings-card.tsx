"use client";

import { useId, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ModelSettingsCardProps = {
  title?: string;
  description?: string;
  onSave?: (apiKey: string) => void;
};

export function ModelSettingsCard({
  title = "Model settings",
  description = "Configure the API key for your model provider.",
  onSave,
}: ModelSettingsCardProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const inputId = `${id}-api-key`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSave?.(String(data.get("apiKey") ?? "").trim());
  }

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-[var(--shadow-card)]"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold" id={titleId}>
            {title}
          </h2>
          <p className="text-sm text-muted-foreground" id={descriptionId}>
            {description}
          </p>
        </div>
        <Badge
          className="border-chart-2/20 bg-chart-2/10 text-chart-2"
          variant="outline"
        >
          Connected
        </Badge>
      </header>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor={inputId}>API key</Label>
          <Input
            aria-describedby={descriptionId}
            autoComplete="off"
            id={inputId}
            name="apiKey"
            placeholder="Enter your API key"
            required
            spellCheck={false}
            type="text"
          />
        </div>
        <Button className="self-start" type="submit">
          Save
        </Button>
      </form>
    </section>
  );
}
