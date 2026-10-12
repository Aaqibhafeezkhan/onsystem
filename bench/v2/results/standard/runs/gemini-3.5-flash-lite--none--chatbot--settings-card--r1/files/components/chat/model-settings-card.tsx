"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CheckCircleFillIcon } from "./icons";

export interface ModelSettingsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  apiKey?: string;
  defaultApiKey?: string;
  onSave?: (apiKey: string) => void;
  isConnected?: boolean;
}

export function ModelSettingsCard({
  title = "Model Settings",
  description = "Configure your API key to connect to the model.",
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
        "flex flex-col gap-5 rounded-xl border border-border/50 bg-card p-6 shadow-[var(--shadow-float)]",
        className
      )}
      {...props}
    >
      <div className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-base font-semibold text-foreground tracking-tight">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
        {isConnected && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-500 shrink-0">
            <CheckCircleFillIcon size={14} />
            <span>Connected</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label className="font-normal text-muted-foreground" htmlFor="api-key-input">
          API Key
        </Label>
        <div className="flex flex-row gap-2.5">
          <Input
            id="api-key-input"
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => {
              setInternalApiKey(e.target.value);
            }}
            className="h-10 rounded-lg border-border/50 bg-muted/50 text-sm transition-colors focus:border-foreground/20 focus:bg-muted"
          />
          <Button onClick={handleSave} className="h-10 px-4 shrink-0">
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
