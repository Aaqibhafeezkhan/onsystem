"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface ModelSettingsCardProps {
  title?: string;
  description?: string;
  apiKey?: string;
  defaultApiKey?: string;
  placeholder?: string;
  isConnected?: boolean;
  status?: string;
  statusLabel?: string;
  onApiKeyChange?: (apiKey: string) => void;
  onSave?: (apiKey: string) => void;
  className?: string;
}

export function ModelSettingsCard({
  title = "Model Settings",
  description = "Manage your API key and connection settings for the AI model.",
  apiKey,
  defaultApiKey = "",
  placeholder = "Enter your API key",
  isConnected = true,
  status,
  statusLabel,
  onApiKeyChange,
  onSave,
  className,
}: ModelSettingsCardProps) {
  const isControlled = apiKey !== undefined;
  const [internalKey, setInternalKey] = React.useState(defaultApiKey);
  const currentApiKey = isControlled ? apiKey : internalKey;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) {
      setInternalKey(e.target.value);
    }
    onApiKeyChange?.(e.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave?.(currentApiKey);
  };

  const label = status ?? statusLabel ?? "Connected";

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-6 text-card-foreground shadow-[var(--shadow-card)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {isConnected && (
          <Badge
            variant="outline"
            className="gap-1.5 border-chart-2/30 bg-chart-2/10 text-xs font-normal text-chart-2"
          >
            <span
              className="size-1.5 rounded-full bg-chart-2"
              aria-hidden="true"
            />
            {label}
          </Badge>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="api-key" className="text-sm font-medium text-foreground">
            API Key
          </Label>
          <Input
            id="api-key"
            name="apiKey"
            type="text"
            placeholder={placeholder}
            value={currentApiKey}
            onChange={handleChange}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit">Save</Button>
        </div>
      </form>
    </div>
  );
}
