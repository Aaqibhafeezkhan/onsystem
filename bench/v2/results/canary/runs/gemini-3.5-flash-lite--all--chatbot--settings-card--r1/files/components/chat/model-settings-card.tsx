"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ModelSettingsCardProps extends React.ComponentProps<"div"> {
  title?: string;
  description?: string;
  defaultApiKey?: string;
  onSave?: (apiKey: string) => void;
}

export function ModelSettingsCard({
  title = "Model API Key",
  description = "Enter your API key to authenticate requests with the AI model provider.",
  defaultApiKey = "",
  onSave,
  className,
  ...props
}: ModelSettingsCardProps) {
  const [apiKey, setApiKey] = useState(defaultApiKey);

  const handleSave = () => {
    onSave?.(apiKey);
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-5 rounded-xl border border-border/50 bg-card p-6 text-card-foreground shadow-[var(--shadow-card)]",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-base leading-none tracking-tight">
            {title}
          </h3>
          <Badge
            variant="secondary"
            className="gap-1.5 px-2.5 py-0.5 text-xs font-medium text-chart-2"
          >
            <span className="size-1.5 rounded-full bg-chart-2" />
            Connected
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="api-key-input" className="text-xs font-medium text-muted-foreground">
            API Key
          </Label>
          <Input
            id="api-key-input"
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="h-9 rounded-lg border-border/50 bg-muted/50 text-sm transition-colors focus:border-foreground/20 focus:bg-muted"
          />
        </div>

        <div className="flex items-center justify-end">
          <Button onClick={handleSave} size="sm">
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
