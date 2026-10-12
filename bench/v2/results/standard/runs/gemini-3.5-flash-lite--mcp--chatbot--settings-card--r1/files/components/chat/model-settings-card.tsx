"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  description = "Configure your API key for model access.",
  apiKey: apiKeyProp,
  defaultApiKey = "",
  onSave,
  isConnected = true,
  className,
  ...props
}: ModelSettingsCardProps) {
  const [apiKey, setApiKey] = React.useState(apiKeyProp ?? defaultApiKey);

  React.useEffect(() => {
    if (apiKeyProp !== undefined) {
      setApiKey(apiKeyProp);
    }
  }, [apiKeyProp]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.(apiKey);
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/50 bg-card p-6 shadow-[var(--shadow-card)]",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-1.5 mb-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-base">{title}</h3>
          {isConnected && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <span className="size-2 rounded-full bg-chart-2 inline-block" />
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
          <Label htmlFor="api-key" className="text-xs font-medium text-muted-foreground">
            API Key
          </Label>
          <Input
            id="api-key"
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
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
