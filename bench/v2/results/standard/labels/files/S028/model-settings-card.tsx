"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface ModelSettingsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  apiKey?: string;
  defaultApiKey?: string;
  onSave?: (apiKey: string) => void | Promise<void>;
  isConnected?: boolean;
}

export function ModelSettingsCard({
  title = "Model API Key",
  description = "Configure your API key to authenticate model requests.",
  apiKey: controlledApiKey,
  defaultApiKey = "",
  onSave,
  isConnected = true,
  className,
  ...props
}: ModelSettingsCardProps) {
  const [uncontrolledApiKey, setUncontrolledApiKey] = useState(defaultApiKey);
  const apiKey = controlledApiKey !== undefined ? controlledApiKey : uncontrolledApiKey;
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      setLoading(true);
      try {
        await onSave(apiKey);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/50 bg-card p-6 shadow-[var(--shadow-card)] transition-all duration-200",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-1.5 mb-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground tracking-tight">
            {title}
          </h3>
          {isConnected && (
            <Badge variant="secondary" className="gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium">
              <span className="size-1.5 rounded-full bg-chart-2" />
              Connected
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="api-key-input" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            API Key
          </Label>
          <div className="flex gap-2">
            <Input
              id="api-key-input"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => {
                if (controlledApiKey === undefined) {
                  setUncontrolledApiKey(e.target.value);
                }
              }}
              className="h-10 rounded-lg border-border/50 bg-muted/50 text-sm transition-colors focus:border-foreground/20 focus:bg-muted"
            />
            <Button type="submit" disabled={loading} className="h-10 px-4 rounded-lg">
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
