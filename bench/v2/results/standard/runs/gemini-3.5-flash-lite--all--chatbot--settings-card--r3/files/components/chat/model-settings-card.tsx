"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ModelSettingsCardProps extends React.ComponentProps<"div"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  apiKey?: string;
  defaultApiKey?: string;
  onApiKeyChange?: (value: string) => void;
  onSave?: (apiKey: string) => void | Promise<void>;
  isLoading?: boolean;
  isConnected?: boolean;
}

export function ModelSettingsCard({
  title = "API Key Configuration",
  description = "Enter your model API key to authenticate requests.",
  apiKey: controlledApiKey,
  defaultApiKey = "",
  onApiKeyChange,
  onSave,
  isLoading = false,
  isConnected = true,
  className,
  ...props
}: ModelSettingsCardProps) {
  const [internalApiKey, setInternalApiKey] = React.useState(defaultApiKey);
  const apiKey = controlledApiKey !== undefined ? controlledApiKey : internalApiKey;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (controlledApiKey === undefined) {
      setInternalApiKey(value);
    }
    onApiKeyChange?.(value);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave?.(apiKey);
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-card p-6 text-card-foreground shadow-[var(--shadow-card)]",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-1.5 mb-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-base text-foreground">{title}</h3>
          {isConnected && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-chart-2">
              <span className="size-2 rounded-full bg-chart-2 animate-pulse" />
              Connected
            </div>
          )}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="api-key-input" className="text-xs font-medium text-muted-foreground">
            API Key
          </Label>
          <Input
            id="api-key-input"
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}
