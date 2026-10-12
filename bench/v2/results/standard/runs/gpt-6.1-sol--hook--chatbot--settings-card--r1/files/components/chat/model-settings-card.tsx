"use client";

import { useId, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ModelSettingsCardProps = {
  className?: string;
  defaultApiKey?: string;
  onSave?: (apiKey: string) => void;
};

export function ModelSettingsCard({
  className,
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
      className={cn(
        "space-y-5 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-[var(--shadow-card)]",
        className
      )}
    >
      <div className="space-y-2">
        <h2 className="font-semibold text-lg" id={titleId}>
          Model settings
        </h2>
        <p className="text-muted-foreground text-sm" id={descriptionId}>
          Configure your API key to connect to your model provider.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor={inputId}>API key</Label>
          <Input
            aria-describedby={descriptionId}
            autoComplete="off"
            autoCapitalize="none"
            className="rounded-lg"
            defaultValue={defaultApiKey}
            id={inputId}
            name="apiKey"
            placeholder="Enter your API key"
            spellCheck={false}
            type="text"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Badge
            className="text-chart-2"
            variant="secondary"
          >
            <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
            Connected
          </Badge>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </section>
  );
}
