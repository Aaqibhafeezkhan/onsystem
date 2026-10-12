"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
  description = "Configure your API key and model preferences.",
  apiKey: controlledApiKey,
  defaultApiKey = "",
  onSave,
  isConnected = true,
  className,
  ...props
}: ModelSettingsCardProps) {
  const [apiKey, setApiKey] = useState(defaultApiKey);
  const currentApiKey =
    controlledApiKey !== undefined ? controlledApiKey : apiKey;

  const handleSave = () => {
    onSave?.(currentApiKey);
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-5 rounded-2xl border border-border/50 bg-card p-6 shadow-[var(--shadow-card)]",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {isConnected && (
            <Badge
              variant="outline"
              className="gap-1.5 border-green-500/30 bg-green-500/10 text-xs font-medium text-green-600 dark:text-green-400"
            >
              <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
              Connected
            </Badge>
          )}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label
          htmlFor="api-key"
          className="text-xs font-medium text-muted-foreground"
        >
          API Key
        </Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            id="api-key"
            type="password"
            placeholder="Enter your API key"
            value={currentApiKey}
            onChange={(e) => {
              if (controlledApiKey === undefined) {
                setApiKey(e.target.value);
              }
            }}
          />
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>
    </div>
  );
}
