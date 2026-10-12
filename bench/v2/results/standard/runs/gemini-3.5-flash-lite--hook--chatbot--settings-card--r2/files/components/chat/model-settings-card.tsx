"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CheckCircleFillIcon } from "./icons";

export interface ModelSettingsCardProps extends React.ComponentProps<"div"> {
  title?: string;
  description?: string;
  apiKey?: string;
  defaultApiKey?: string;
  onApiKeyChange?: (value: string) => void;
  onSave?: (value: string) => void | Promise<void>;
  isConnected?: boolean;
}

export function ModelSettingsCard({
  title = "Model Settings",
  description = "Configure your API key to connect your model.",
  apiKey: controlledApiKey,
  defaultApiKey = "",
  onApiKeyChange,
  onSave,
  isConnected = true,
  className,
  ...props
}: ModelSettingsCardProps) {
  const [internalApiKey, setInternalApiKey] = useState(defaultApiKey);
  const [isSaving, setIsSaving] = useState(false);

  const apiKey =
    controlledApiKey !== undefined ? controlledApiKey : internalApiKey;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (controlledApiKey === undefined) {
      setInternalApiKey(value);
    }
    onApiKeyChange?.(value);
  };

  const handleSaveClick = async () => {
    if (onSave) {
      setIsSaving(true);
      try {
        await onSave(apiKey);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-5 rounded-xl border border-border/50 bg-card p-6 shadow-[var(--shadow-float)]",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-foreground text-base leading-none tracking-tight">
            {title}
          </h3>
          {isConnected && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-chart-2/30 bg-chart-2/15 px-2.5 py-0.5 text-xs font-medium text-chart-2">
              <CheckCircleFillIcon size={12} />
              Connected
            </div>
          )}
        </div>
        {description && (
          <p className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label
          className="font-normal text-muted-foreground"
          htmlFor="api-key-input"
        >
          API Key
        </Label>
        <div className="flex items-center gap-3">
          <Input
            id="api-key-input"
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={handleChange}
            className="h-10 rounded-lg border-border/50 bg-muted/50 text-sm transition-colors focus:border-foreground/20 focus:bg-muted"
          />
          <Button
            type="button"
            onClick={handleSaveClick}
            disabled={isSaving}
            className="h-10 px-4 rounded-lg font-medium shrink-0"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
