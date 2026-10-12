"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type ModelSettingsCardProps = {
  title?: string;
  description?: string;
  apiKey?: string;
  onApiKeyChange?: (value: string) => void;
  onSave?: (apiKey: string) => void;
  isConnected?: boolean;
  className?: string;
};

export function ModelSettingsCard({
  title = "Model Settings",
  description = "Configure your API key and connection settings.",
  apiKey: initialApiKey = "",
  onApiKeyChange,
  onSave,
  isConnected = true,
  className,
}: ModelSettingsCardProps) {
  const [apiKey, setApiKey] = useState(initialApiKey);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setApiKey(value);
    onApiKeyChange?.(value);
  };

  const handleSave = () => {
    onSave?.(apiKey);
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border/50 bg-card p-6 shadow-[var(--shadow-card)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold text-base text-foreground tracking-tight">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {isConnected && (
          <div className="flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-600 dark:text-green-400">
            <span className="size-1.5 rounded-full bg-green-500" />
            Connected
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label
          className="text-sm font-medium text-foreground"
          htmlFor="api-key-input"
        >
          API Key
        </Label>
        <div className="flex items-center gap-3">
          <Input
            id="api-key-input"
            type="password"
            value={apiKey}
            onChange={handleInputChange}
            placeholder="Enter API key..."
            className="h-10 text-sm"
          />
          <Button onClick={handleSave} type="button" className="shrink-0">
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
