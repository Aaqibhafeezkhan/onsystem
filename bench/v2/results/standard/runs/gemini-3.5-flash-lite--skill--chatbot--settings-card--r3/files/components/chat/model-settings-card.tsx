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
  defaultApiKey?: string;
  apiKey?: string;
  onApiKeyChange?: (apiKey: string) => void;
  onSave?: (apiKey: string) => void;
  isConnected?: boolean;
}

export function ModelSettingsCard({
  title = "Model Settings",
  description = "Enter your API key to authenticate and access AI models.",
  defaultApiKey = "",
  apiKey: externalApiKey,
  onApiKeyChange,
  onSave,
  isConnected = true,
  className,
  ...props
}: ModelSettingsCardProps) {
  const [internalApiKey, setInternalApiKey] = useState(defaultApiKey);
  const apiKey = externalApiKey !== undefined ? externalApiKey : internalApiKey;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (onApiKeyChange) {
      onApiKeyChange(value);
    }
    if (externalApiKey === undefined) {
      setInternalApiKey(value);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(apiKey);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border/50 bg-card p-5 shadow-[var(--shadow-card)]",
        className
      )}
      data-slot="model-settings-card"
      {...props}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-base">{title}</h3>
          {isConnected && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
              <span className="size-2 rounded-full bg-green-600 dark:bg-green-400" />
              Connected
            </div>
          )}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label className="font-normal text-muted-foreground" htmlFor="api-key-input">
          API Key
        </Label>
        <div className="flex flex-row gap-2">
          <Input
            id="api-key-input"
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={handleChange}
            className="h-9 flex-1 rounded-lg border-border/50 bg-muted/50 text-sm transition-colors focus:border-foreground/20 focus:bg-muted"
          />
          <Button
            type="button"
            onClick={handleSave}
            size="sm"
            className="h-9 shrink-0"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
