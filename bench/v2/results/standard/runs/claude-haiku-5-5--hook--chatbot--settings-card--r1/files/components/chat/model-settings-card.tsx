"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type ModelSettingsCardProps = {
  title: string;
  description: string;
  defaultApiKey?: string;
  onSave?: (apiKey: string) => void;
  className?: string;
};

export function ModelSettingsCard({
  title,
  description,
  defaultApiKey = "",
  onSave,
  className,
}: ModelSettingsCardProps) {
  const [apiKey, setApiKey] = useState(defaultApiKey);
  const inputId = "model-settings-api-key";

  return (
    <div
      data-slot="model-settings-card"
      className={cn(
        "flex flex-col gap-6 rounded-xl border border-border bg-card py-6 text-card-foreground shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-1.5 px-6">
        <h3 className="text-base leading-none font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <form
        className="flex flex-col gap-3 px-6"
        onSubmit={(event) => {
          event.preventDefault();
          onSave?.(apiKey);
        }}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor={inputId}>API key</Label>
          <Input
            id={inputId}
            type="text"
            name="apiKey"
            autoComplete="off"
            spellCheck={false}
            placeholder="Enter your API key"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-green-600 dark:text-green-500">
            Connected
          </span>
          <Button type="submit" size="sm">
            Save
          </Button>
        </div>
      </form>
    </div>
  );
}
