"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface ModelSettingsCardProps extends React.ComponentProps<"div"> {
  title?: string;
  description?: string;
  apiKey?: string;
  defaultApiKey?: string;
  onSave?: (apiKey: string) => void;
  isConnected?: boolean;
}

export function ModelSettingsCard({
  title = "Model Settings",
  description = "Manage your API key and connection settings for the AI model.",
  apiKey: controlledApiKey,
  defaultApiKey = "",
  onSave,
  isConnected = true,
  className,
  ...props
}: ModelSettingsCardProps) {
  const [internalApiKey, setInternalApiKey] = useState(defaultApiKey);
  const apiKey = controlledApiKey !== undefined ? controlledApiKey : internalApiKey;

  const handleSave = () => {
    onSave?.(apiKey);
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/50 bg-card p-6 shadow-[var(--shadow-card)] flex flex-col gap-4",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-foreground tracking-tight">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        {isConnected && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-600 dark:bg-green-500/20 dark:text-green-400 shrink-0">
            <span className="size-1.5 rounded-full bg-green-600 dark:bg-green-400" />
            Connected
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="model-api-key" className="text-xs font-medium text-muted-foreground">
          API Key
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="model-api-key"
            type="password"
            placeholder="Enter API key..."
            value={apiKey}
            onChange={(e) => {
              if (controlledApiKey === undefined) {
                setInternalApiKey(e.target.value);
              }
            }}
          />
          <Button type="button" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
