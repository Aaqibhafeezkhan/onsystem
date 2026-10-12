"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircleIcon } from "lucide-react";

export interface ModelSettingsCardProps extends React.ComponentProps<"div"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  apiKey?: string;
  defaultApiKey?: string;
  onSave?: (apiKey: string) => void | Promise<void>;
  isConnected?: boolean;
}

export function ModelSettingsCard({
  title = "Model Settings",
  description = "Enter your API key to connect and authenticate with the model provider.",
  apiKey: apiKeyProp,
  defaultApiKey = "",
  onSave,
  isConnected = true,
  className,
  ...props
}: ModelSettingsCardProps) {
  const [apiKey, setApiKey] = useState(apiKeyProp ?? defaultApiKey);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      try {
        setIsSaving(true);
        await onSave(apiKey);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/50 bg-card p-6 shadow-[var(--shadow-card)] flex flex-col gap-5",
        className
      )}
      {...props}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-foreground tracking-tight">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
        {isConnected && (
          <Badge
            variant="outline"
            className="w-fit bg-chart-2/10 text-chart-2 border-chart-2/30 gap-1.5 px-2.5 py-1 text-xs font-medium"
          >
            <CheckCircleIcon className="size-3 text-chart-2" />
            Connected
          </Badge>
        )}
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="api-key" className="text-sm font-medium text-foreground">
            API Key
          </Label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Input
              id="api-key"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
