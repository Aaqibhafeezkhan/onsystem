"use client";

import { useState } from "react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function ModelSettingsCard({
  title = "Model settings",
  description = "Enter your API key to connect your AI provider.",
  defaultApiKey = "",
  onSave,
}: {
  title?: string;
  description?: string;
  defaultApiKey?: string;
  onSave?: (apiKey: string) => void | Promise<void>;
}) {
  const [apiKey, setApiKey] = useState(defaultApiKey);

  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-border/50 bg-card p-5 text-card-foreground shadow-[var(--shadow-float)]">
      <div className="flex flex-col gap-1.5">
        <h3 className="font-medium text-foreground text-sm leading-none">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void onSave?.(apiKey);
        }}
      >
        <div className="flex flex-col gap-2">
          <Label className="font-normal text-muted-foreground" htmlFor="api-key">
            API key
          </Label>
          <Input
            autoComplete="off"
            className="h-10 rounded-lg border-border/50 bg-muted/50 text-sm transition-colors focus:border-foreground/20 focus:bg-muted"
            id="api-key"
            name="apiKey"
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="sk-..."
            type="password"
            value={apiKey}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 font-medium text-green-600 text-xs dark:text-green-500">
            <span aria-hidden className="size-1.5 rounded-full bg-green-600 dark:bg-green-500" />
            Connected
          </span>
          <Button className="h-8 rounded-lg px-3 text-xs" size="sm" type="submit">
            Save
          </Button>
        </div>
      </form>
    </div>
  );
}
