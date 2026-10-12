"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface ModelSettingsCardProps extends React.ComponentProps<"div"> {
  title?: string;
  description?: string;
  apiKey?: string;
  onApiKeyChange?: (value: string) => void;
  onSave?: (apiKey: string) => void;
  isConnected?: boolean;
}

export function ModelSettingsCard({
  title = "Model API Key",
  description = "Enter your API key to connect to the model provider.",
  apiKey: initialApiKey = "",
  onApiKeyChange,
  onSave,
  isConnected = true,
  className,
  ...props
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
        "flex flex-col gap-5 rounded-2xl border border-border/50 bg-card p-6 shadow-[var(--shadow-card)] transition-all",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-base text-foreground tracking-tight">
            {title}
          </h3>
          {isConnected && (
            <div className="flex items-center gap-1.5 rounded-full bg-chart-2/10 px-2.5 py-0.5 text-xs font-medium text-chart-2">
              <span className="size-1.5 rounded-full bg-chart-2" />
              Connected
            </div>
          )}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Label className="font-normal text-muted-foreground" htmlFor="api-key-input">
            API Key
          </Label>
          <Input
            id="api-key-input"
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={handleInputChange}
            className="h-10 rounded-lg border-border/50 bg-muted/50 text-sm transition-colors focus:border-foreground/20 focus:bg-muted"
          />
        </div>

        <div className="flex justify-end pt-1">
          <Button onClick={handleSave} size="sm" className="gap-1.5">
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
