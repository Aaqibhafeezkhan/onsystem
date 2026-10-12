"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircleFillIcon } from "./icons";

export type ModelSettingsCardProps = {
  className?: string;
  title?: string;
  description?: string;
  apiKey?: string;
  onApiKeyChange?: (apiKey: string) => void;
  onSave?: (apiKey: string) => void;
  isConnected?: boolean;
};

export function ModelSettingsCard({
  className,
  title = "Model Settings",
  description = "Configure your API key and model connection settings.",
  apiKey: initialApiKey = "",
  onApiKeyChange,
  onSave,
  isConnected = true,
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
        "flex flex-col gap-5 rounded-xl border border-border/50 bg-card p-6 shadow-sm",
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
          <Badge
            variant="outline"
            className="gap-1.5 border-chart-2/30 bg-chart-2/10 text-chart-2 shrink-0"
          >
            <CheckCircleFillIcon />
            Connected
          </Badge>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="api-key" className="text-xs font-medium text-muted-foreground">
          API Key
        </Label>
        <div className="flex gap-2">
          <Input
            id="api-key"
            type="password"
            placeholder="Enter API key..."
            value={apiKey}
            onChange={handleInputChange}
            className="flex-1"
          />
          <Button onClick={handleSave} type="button">
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
