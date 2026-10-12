"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ModelSettingsCardProps = {
  title?: string;
  description?: string;
  /** Initial value of the API key input. */
  defaultApiKey?: string;
  /** Whether the saved key is currently connected. */
  connected?: boolean;
  /** Called with the entered API key when Save is pressed. */
  onSave?: (apiKey: string) => void;
  className?: string;
};

export function ModelSettingsCard({
  title = "Model settings",
  description = "Enter your API key to connect the model provider.",
  defaultApiKey = "",
  connected = false,
  onSave,
  className,
}: ModelSettingsCardProps) {
  const inputId = useId();
  const [apiKey, setApiKey] = useState(defaultApiKey);

  return (
    <div
      data-slot="model-settings-card"
      className={cn(
        "flex w-full flex-col gap-4 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-1.5">
        <h3 className="text-base leading-none font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          onSave?.(apiKey.trim());
        }}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor={inputId}>API key</Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              id={inputId}
              name="apiKey"
              type="text"
              autoComplete="off"
              spellCheck={false}
              placeholder="sk-..."
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              className="sm:flex-1"
            />
            <Button type="submit" className="sm:w-auto">
              Save
            </Button>
          </div>
        </div>

        {connected ? (
          <span
            data-slot="model-settings-status"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600"
          >
            <span aria-hidden className="size-1.5 rounded-full bg-green-600" />
            Connected
          </span>
        ) : null}
      </form>
    </div>
  );
}
