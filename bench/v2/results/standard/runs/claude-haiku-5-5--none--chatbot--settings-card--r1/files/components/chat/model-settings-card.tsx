"use client";

import * as React from "react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { cn } from "@/lib/utils";

export type ModelSettingsCardProps = {
  title?: string;
  description?: string;
  className?: string;
  onSave?: (apiKey: string) => void;
};

export function ModelSettingsCard({
  title = "Model settings",
  description = "Enter your API key to connect to your model provider.",
  className,
  onSave,
}: ModelSettingsCardProps) {
  const inputId = React.useId();
  const [apiKey, setApiKey] = React.useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave?.(apiKey);
  };

  return (
    <div
      data-slot="model-settings-card"
      className={cn(
        "flex w-full max-w-md flex-col gap-4 rounded-xl border border-border/50 bg-card p-5 text-card-foreground shadow-[var(--shadow-float)]",
        className
      )}
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-base leading-none font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor={inputId} className="font-normal text-muted-foreground">
            API key
          </Label>
          <Input
            id={inputId}
            type="password"
            autoComplete="off"
            placeholder="sk-..."
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-green-600 dark:bg-green-400"
            />
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
