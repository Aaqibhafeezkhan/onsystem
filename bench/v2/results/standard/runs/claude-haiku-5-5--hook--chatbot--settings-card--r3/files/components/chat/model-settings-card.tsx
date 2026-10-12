"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ModelSettingsCardProps = {
  title?: string;
  description?: string;
  className?: string;
};

function ModelSettingsCard({
  title = "Model settings",
  description = "Enter your API key to connect to the model provider.",
  className,
}: ModelSettingsCardProps) {
  const inputId = React.useId();
  const [apiKey, setApiKey] = React.useState("");

  return (
    <div
      data-slot="model-settings-card"
      className={cn(
        "flex w-full flex-col gap-4 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base leading-none font-semibold">{title}</h3>
          <span className="text-xs leading-none font-medium text-chart-2">
            Connected
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor={inputId}>API key</Label>
          <Input
            id={inputId}
            type="text"
            name="apiKey"
            autoComplete="off"
            spellCheck={false}
            placeholder="sk-..."
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" size="sm">
            Save
          </Button>
        </div>
      </form>
    </div>
  );
}

export { ModelSettingsCard };
