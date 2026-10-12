"use client";

import { useId, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ModelSettingsCardProps = {
  title?: string;
  description?: string;
  defaultApiKey?: string;
  onSave?: (apiKey: string) => void;
};

export function ModelSettingsCard({
  title = "Model settings",
  description = "Configure your API key to connect to your model provider.",
  defaultApiKey = "",
  onSave,
}: ModelSettingsCardProps = {}) {
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const inputId = `${id}-api-key`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onSave?.(String(formData.get("apiKey") ?? ""));
  }

  return (
    <section
      aria-labelledby={titleId}
      className="w-full rounded-xl border border-border bg-card p-6 text-card-foreground shadow-[var(--shadow-card)]"
    >
      <div className="space-y-2">
        <h2 className="font-semibold text-lg" id={titleId}>
          {title}
        </h2>
        <p className="text-muted-foreground text-sm" id={descriptionId}>
          {description}
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor={inputId}>API key</Label>
          <Input
            aria-describedby={descriptionId}
            autoCapitalize="none"
            autoComplete="off"
            className="rounded-lg"
            defaultValue={defaultApiKey}
            id={inputId}
            name="apiKey"
            placeholder="Enter your API key"
            spellCheck={false}
            type="text"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1.5 font-medium text-green-700 text-xs dark:text-green-400">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
            Connected
          </span>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </section>
  );
}
