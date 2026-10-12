"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function ModelSettingsCard({
  title = "Model settings",
  description = "Enter your API key to connect to the model provider.",
  className,
  onSave,
}: {
  title?: string;
  description?: string;
  className?: string;
  onSave?: (apiKey: string) => void | Promise<void>;
}) {
  const [apiKey, setApiKey] = useState("");

  return (
    <section
      className={cn(
        "flex w-full max-w-md flex-col gap-4 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm",
        className
      )}
    >
      <header className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold leading-none">{title}</h3>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-green-600"
            />
            Connected
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>

      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void onSave?.(apiKey);
        }}
      >
        <div className="flex flex-col gap-2">
          <Label className="font-normal text-muted-foreground" htmlFor="model-api-key">
            API key
          </Label>
          <Input
            autoComplete="off"
            className="h-10 rounded-lg border-border/50 bg-muted/50 text-sm transition-colors focus:border-foreground/20 focus:bg-muted"
            id="model-api-key"
            name="apiKey"
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="sk-..."
            spellCheck={false}
            type="text"
            value={apiKey}
          />
        </div>

        <div className="flex justify-end">
          <Button size="sm" type="submit">
            Save
          </Button>
        </div>
      </form>
    </section>
  );
}
