"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface ModelSettingsCardProps
  extends Omit<React.ComponentProps<"div">, "onSave" | "onChange"> {
  title?: string;
  description?: string;
  apiKey?: string;
  defaultApiKey?: string;
  statusLabel?: string;
  onSave?: (apiKey: string) => void;
  onChange?: (apiKey: string) => void;
  onApiKeyChange?: (apiKey: string) => void;
}

export function ModelSettingsCard({
  title = "Model Settings",
  description = "Configure your model provider and API key settings.",
  apiKey,
  defaultApiKey = "",
  statusLabel = "Connected",
  onSave,
  onChange,
  onApiKeyChange,
  className,
  ...props
}: ModelSettingsCardProps) {
  const [internalApiKey, setInternalApiKey] = useState(defaultApiKey);
  const currentKey = apiKey !== undefined ? apiKey : internalApiKey;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave?.(currentKey);
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-card p-6 text-card-foreground shadow-[var(--shadow-card)]",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold leading-none text-card-foreground">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Badge
          variant="outline"
          className="gap-1.5 border-chart-2/30 bg-chart-2/10 text-chart-2"
        >
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-chart-2"
          />
          {statusLabel}
        </Badge>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="api-key" className="text-sm font-medium text-foreground">
            API Key
          </Label>
          <Input
            id="api-key"
            name="apiKey"
            type="text"
            placeholder="Enter your API key"
            value={currentKey}
            onChange={(e) => {
              const nextValue = e.target.value;
              if (apiKey === undefined) {
                setInternalApiKey(nextValue);
              }
              onChange?.(nextValue);
              onApiKeyChange?.(nextValue);
            }}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit">Save</Button>
        </div>
      </form>
    </div>
  );
}
